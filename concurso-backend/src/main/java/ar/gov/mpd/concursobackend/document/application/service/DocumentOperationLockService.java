package ar.gov.mpd.concursobackend.document.application.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Servicio CRÍTICO para prevenir operaciones concurrentes de doble clic
 * Resuelve el problema de múltiples requests simultáneos del mismo usuario
 * sobre el mismo documento
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentOperationLockService {

    private final DocumentConcurrencyMetricsService metricsService;
    private final ConcurrentHashMap<String, OperationLock> activeOperations = new ConcurrentHashMap<>();
    
    private static final int OPERATION_TIMEOUT_MINUTES = 5;
    
    /**
     * Intenta adquirir un lock para una operación de documento
     * @param userId ID del usuario
     * @param documentId ID del documento
     * @param operationType Tipo de operación (REPLACE, DELETE, etc.)
     * @return true si el lock fue adquirido, false si ya hay una operación en progreso
     */
    public boolean tryAcquireLock(UUID userId, UUID documentId, String operationType) {
        String lockKey = generateLockKey(userId, documentId, operationType);
        
        // Limpiar operaciones expiradas antes de verificar
        cleanExpiredOperations();
        
        OperationLock newLock = new OperationLock(userId, documentId, operationType, LocalDateTime.now());
        
        OperationLock existingLock = activeOperations.putIfAbsent(lockKey, newLock);
        
        if (existingLock == null) {
            log.info("🔒 Lock adquirido exitosamente: {} para usuario: {}", lockKey, userId);
            metricsService.recordLockAcquisition(userId.toString(), documentId.toString(), operationType);
            return true;
        } else {
            log.warn("⚠️ Operación ya en progreso detectada: {} para usuario: {} (iniciada: {})",
                    lockKey, userId, existingLock.getStartTime());
            metricsService.recordLockTimeout(userId.toString(), documentId.toString(), operationType);
            return false;
        }
    }
    
    /**
     * Libera un lock de operación
     * @param userId ID del usuario
     * @param documentId ID del documento
     * @param operationType Tipo de operación
     */
    public void releaseLock(UUID userId, UUID documentId, String operationType) {
        String lockKey = generateLockKey(userId, documentId, operationType);
        
        OperationLock removedLock = activeOperations.remove(lockKey);
        
        if (removedLock != null) {
            long durationMs = ChronoUnit.MILLIS.between(removedLock.getStartTime(), LocalDateTime.now());
            log.info("🔓 Lock liberado: {} después de {}ms", lockKey, durationMs);
        } else {
            log.warn("⚠️ Intento de liberar lock inexistente: {}", lockKey);
        }
    }
    
    /**
     * Libera un lock usando try-with-resources pattern
     */
    public AutoCloseable acquireLockWithAutoRelease(UUID userId, UUID documentId, String operationType) {
        if (!tryAcquireLock(userId, documentId, operationType)) {
            throw new IllegalStateException("No se pudo adquirir el lock para la operación: " + operationType);
        }
        
        return () -> releaseLock(userId, documentId, operationType);
    }
    
    /**
     * Verifica si hay una operación en progreso
     */
    public boolean isOperationInProgress(UUID userId, UUID documentId, String operationType) {
        String lockKey = generateLockKey(userId, documentId, operationType);
        cleanExpiredOperations();
        return activeOperations.containsKey(lockKey);
    }
    
    /**
     * Obtiene información sobre operaciones activas (para debugging)
     */
    public int getActiveOperationsCount() {
        cleanExpiredOperations();
        return activeOperations.size();
    }

    /**
     * Obtiene estadísticas de locks activos
     */
    public LockStats getStats() {
        cleanExpiredOperations();
        return new LockStats(
            activeOperations.size(),
            activeOperations.keySet().toArray(new String[0])
        );
    }
    
    /**
     * Genera una clave única para el lock
     */
    private String generateLockKey(UUID userId, UUID documentId, String operationType) {
        return String.format("%s:%s:%s", userId, documentId, operationType);
    }
    
    /**
     * Limpia operaciones que han expirado
     */
    private void cleanExpiredOperations() {
        LocalDateTime cutoff = LocalDateTime.now().minus(OPERATION_TIMEOUT_MINUTES, ChronoUnit.MINUTES);
        
        activeOperations.entrySet().removeIf(entry -> {
            boolean isExpired = entry.getValue().getStartTime().isBefore(cutoff);
            if (isExpired) {
                log.warn("🧹 Limpiando operación expirada: {} (iniciada: {})", 
                        entry.getKey(), entry.getValue().getStartTime());
            }
            return isExpired;
        });
    }
    
    /**
     * Clase interna para representar un lock de operación
     */
    private static class OperationLock {
        private final UUID userId;
        private final UUID documentId;
        private final String operationType;
        private final LocalDateTime startTime;
        
        public OperationLock(UUID userId, UUID documentId, String operationType, LocalDateTime startTime) {
            this.userId = userId;
            this.documentId = documentId;
            this.operationType = operationType;
            this.startTime = startTime;
        }
        
        public LocalDateTime getStartTime() {
            return startTime;
        }
    }

    /**
     * Record para estadísticas de locks
     */
    public record LockStats(int activeLocksCount, String[] lockedButtons) {}
}
