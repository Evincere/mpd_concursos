package ar.gov.mpd.concursobackend.document.application.service;

import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Servicio para recopilar y analizar métricas de concurrencia en documentos.
 * 
 * Características:
 * - Tracking de conflictos de concurrencia
 * - Métricas de retry automático
 * - Análisis de patrones de uso
 * - Alertas por picos de actividad
 * - Estadísticas de rendimiento
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentConcurrencyMetricsService {

    // Contadores de eventos
    private final AtomicLong totalConcurrencyConflicts = new AtomicLong(0);
    private final AtomicLong totalRetryAttempts = new AtomicLong(0);
    private final AtomicLong totalSuccessfulRetries = new AtomicLong(0);
    private final AtomicLong totalFailedOperations = new AtomicLong(0);
    private final AtomicLong totalLockAcquisitions = new AtomicLong(0);
    private final AtomicLong totalLockTimeouts = new AtomicLong(0);

    // Tracking de operaciones por usuario
    private final ConcurrentHashMap<String, UserConcurrencyStats> userStats = new ConcurrentHashMap<>();
    
    // Historial de eventos recientes (últimas 1000 entradas)
    private final List<ConcurrencyEvent> recentEvents = new ArrayList<>();
    private final Object eventsLock = new Object();
    private static final int MAX_RECENT_EVENTS = 1000;

    // Timestamps para análisis temporal
    private final AtomicReference<LocalDateTime> lastConflictTime = new AtomicReference<>(LocalDateTime.now());
    private final AtomicReference<LocalDateTime> serviceStartTime = new AtomicReference<>(LocalDateTime.now());

    /**
     * Registra un conflicto de concurrencia
     */
    public void recordConcurrencyConflict(String userId, String documentId, String operationType) {
        totalConcurrencyConflicts.incrementAndGet();
        lastConflictTime.set(LocalDateTime.now());
        
        // Actualizar estadísticas por usuario
        userStats.computeIfAbsent(userId, k -> new UserConcurrencyStats())
                .incrementConflicts();
        
        // Registrar evento
        recordEvent(ConcurrencyEventType.CONFLICT, userId, documentId, operationType, null);
        
        log.info("📊 [ConcurrencyMetrics] Conflicto registrado - Usuario: {}, Documento: {}, Operación: {}", 
                userId, documentId, operationType);
    }

    /**
     * Registra un intento de retry
     */
    public void recordRetryAttempt(String userId, String documentId, String operationType, int attemptNumber) {
        totalRetryAttempts.incrementAndGet();
        
        userStats.computeIfAbsent(userId, k -> new UserConcurrencyStats())
                .incrementRetries();
        
        recordEvent(ConcurrencyEventType.RETRY_ATTEMPT, userId, documentId, operationType, 
                Map.of("attemptNumber", attemptNumber));
        
        log.debug("🔄 [ConcurrencyMetrics] Retry registrado - Usuario: {}, Intento: {}", userId, attemptNumber);
    }

    /**
     * Registra un retry exitoso
     */
    public void recordSuccessfulRetry(String userId, String documentId, String operationType, int totalAttempts) {
        totalSuccessfulRetries.incrementAndGet();
        
        userStats.computeIfAbsent(userId, k -> new UserConcurrencyStats())
                .incrementSuccessfulRetries();
        
        recordEvent(ConcurrencyEventType.RETRY_SUCCESS, userId, documentId, operationType, 
                Map.of("totalAttempts", totalAttempts));
        
        log.info("✅ [ConcurrencyMetrics] Retry exitoso - Usuario: {}, Intentos totales: {}", userId, totalAttempts);
    }

    /**
     * Registra una operación fallida definitivamente
     */
    public void recordFailedOperation(String userId, String documentId, String operationType, String errorType) {
        totalFailedOperations.incrementAndGet();
        
        userStats.computeIfAbsent(userId, k -> new UserConcurrencyStats())
                .incrementFailures();
        
        recordEvent(ConcurrencyEventType.OPERATION_FAILED, userId, documentId, operationType, 
                Map.of("errorType", errorType));
        
        log.warn("❌ [ConcurrencyMetrics] Operación fallida - Usuario: {}, Error: {}", userId, errorType);
    }

    /**
     * Registra adquisición de lock
     */
    public void recordLockAcquisition(String userId, String documentId, String operationType) {
        totalLockAcquisitions.incrementAndGet();
        
        recordEvent(ConcurrencyEventType.LOCK_ACQUIRED, userId, documentId, operationType, null);
        
        log.debug("🔒 [ConcurrencyMetrics] Lock adquirido - Usuario: {}, Documento: {}", userId, documentId);
    }

    /**
     * Registra timeout de lock
     */
    public void recordLockTimeout(String userId, String documentId, String operationType) {
        totalLockTimeouts.incrementAndGet();
        
        userStats.computeIfAbsent(userId, k -> new UserConcurrencyStats())
                .incrementLockTimeouts();
        
        recordEvent(ConcurrencyEventType.LOCK_TIMEOUT, userId, documentId, operationType, null);
        
        log.warn("⏰ [ConcurrencyMetrics] Lock timeout - Usuario: {}, Documento: {}", userId, documentId);
    }

    /**
     * Obtiene métricas generales del sistema
     */
    public ConcurrencyMetrics getSystemMetrics() {
        LocalDateTime now = LocalDateTime.now();
        long uptimeMinutes = ChronoUnit.MINUTES.between(serviceStartTime.get(), now);
        
        return ConcurrencyMetrics.builder()
                .totalConflicts(totalConcurrencyConflicts.get())
                .totalRetryAttempts(totalRetryAttempts.get())
                .totalSuccessfulRetries(totalSuccessfulRetries.get())
                .totalFailedOperations(totalFailedOperations.get())
                .totalLockAcquisitions(totalLockAcquisitions.get())
                .totalLockTimeouts(totalLockTimeouts.get())
                .retrySuccessRate(calculateRetrySuccessRate())
                .averageConflictsPerHour(calculateConflictsPerHour(uptimeMinutes))
                .lastConflictTime(lastConflictTime.get())
                .uptimeMinutes(uptimeMinutes)
                .activeUsers(userStats.size())
                .build();
    }

    /**
     * Obtiene estadísticas por usuario
     */
    public Map<String, UserConcurrencyStats> getUserStats() {
        return new ConcurrentHashMap<>(userStats);
    }

    /**
     * Obtiene eventos recientes
     */
    public List<ConcurrencyEvent> getRecentEvents(int limit) {
        synchronized (eventsLock) {
            int fromIndex = Math.max(0, recentEvents.size() - limit);
            return new ArrayList<>(recentEvents.subList(fromIndex, recentEvents.size()));
        }
    }

    /**
     * Detecta si hay un pico de actividad anómalo
     */
    public boolean detectAnomalousActivity() {
        // Considerar anómalo si hay más de 10 conflictos en los últimos 5 minutos
        LocalDateTime fiveMinutesAgo = LocalDateTime.now().minusMinutes(5);
        
        synchronized (eventsLock) {
            long recentConflicts = recentEvents.stream()
                    .filter(event -> event.getTimestamp().isAfter(fiveMinutesAgo))
                    .filter(event -> event.getEventType() == ConcurrencyEventType.CONFLICT)
                    .count();
            
            return recentConflicts > 10;
        }
    }

    /**
     * Registra un evento en el historial
     */
    private void recordEvent(ConcurrencyEventType eventType, String userId, String documentId, 
                           String operationType, Map<String, Object> metadata) {
        ConcurrencyEvent event = ConcurrencyEvent.builder()
                .eventType(eventType)
                .timestamp(LocalDateTime.now())
                .userId(userId)
                .documentId(documentId)
                .operationType(operationType)
                .metadata(metadata)
                .build();
        
        synchronized (eventsLock) {
            recentEvents.add(event);
            
            // Mantener solo los eventos más recientes
            if (recentEvents.size() > MAX_RECENT_EVENTS) {
                recentEvents.remove(0);
            }
        }
    }

    /**
     * Calcula la tasa de éxito de retry
     */
    private double calculateRetrySuccessRate() {
        long totalRetries = totalRetryAttempts.get();
        if (totalRetries == 0) return 0.0;
        
        return (double) totalSuccessfulRetries.get() / totalRetries * 100.0;
    }

    /**
     * Calcula conflictos por hora
     */
    private double calculateConflictsPerHour(long uptimeMinutes) {
        if (uptimeMinutes == 0) return 0.0;
        
        return (double) totalConcurrencyConflicts.get() / uptimeMinutes * 60.0;
    }

    /**
     * Limpia estadísticas antiguas (para mantenimiento)
     */
    public void cleanupOldStats() {
        // Limpiar eventos más antiguos de 24 horas
        LocalDateTime oneDayAgo = LocalDateTime.now().minusDays(1);
        
        synchronized (eventsLock) {
            recentEvents.removeIf(event -> event.getTimestamp().isBefore(oneDayAgo));
        }
        
        log.info("🧹 [ConcurrencyMetrics] Limpieza de estadísticas completada");
    }

    // ========== CLASES DE DATOS ==========

    /**
     * Métricas generales del sistema
     */
    @Data
    @Builder
    public static class ConcurrencyMetrics {
        private long totalConflicts;
        private long totalRetryAttempts;
        private long totalSuccessfulRetries;
        private long totalFailedOperations;
        private long totalLockAcquisitions;
        private long totalLockTimeouts;
        private double retrySuccessRate;
        private double averageConflictsPerHour;
        private LocalDateTime lastConflictTime;
        private long uptimeMinutes;
        private int activeUsers;
    }

    /**
     * Estadísticas por usuario
     */
    @Data
    public static class UserConcurrencyStats {
        private final AtomicLong conflicts = new AtomicLong(0);
        private final AtomicLong retries = new AtomicLong(0);
        private final AtomicLong successfulRetries = new AtomicLong(0);
        private final AtomicLong failures = new AtomicLong(0);
        private final AtomicLong lockTimeouts = new AtomicLong(0);
        private final LocalDateTime firstActivity = LocalDateTime.now();
        private final AtomicReference<LocalDateTime> lastActivity = new AtomicReference<>(LocalDateTime.now());

        public void incrementConflicts() {
            conflicts.incrementAndGet();
            lastActivity.set(LocalDateTime.now());
        }

        public void incrementRetries() {
            retries.incrementAndGet();
            lastActivity.set(LocalDateTime.now());
        }

        public void incrementSuccessfulRetries() {
            successfulRetries.incrementAndGet();
            lastActivity.set(LocalDateTime.now());
        }

        public void incrementFailures() {
            failures.incrementAndGet();
            lastActivity.set(LocalDateTime.now());
        }

        public void incrementLockTimeouts() {
            lockTimeouts.incrementAndGet();
            lastActivity.set(LocalDateTime.now());
        }

        public long getConflicts() { return conflicts.get(); }
        public long getRetries() { return retries.get(); }
        public long getSuccessfulRetries() { return successfulRetries.get(); }
        public long getFailures() { return failures.get(); }
        public long getLockTimeouts() { return lockTimeouts.get(); }
        public LocalDateTime getLastActivity() { return lastActivity.get(); }
    }

    /**
     * Evento de concurrencia
     */
    @Data
    @Builder
    public static class ConcurrencyEvent {
        private ConcurrencyEventType eventType;
        private LocalDateTime timestamp;
        private String userId;
        private String documentId;
        private String operationType;
        private Map<String, Object> metadata;
    }

    /**
     * Tipos de eventos de concurrencia
     */
    public enum ConcurrencyEventType {
        CONFLICT,
        RETRY_ATTEMPT,
        RETRY_SUCCESS,
        OPERATION_FAILED,
        LOCK_ACQUIRED,
        LOCK_TIMEOUT
    }
}
