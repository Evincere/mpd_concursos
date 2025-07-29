package ar.gov.mpd.concursobackend.inscription.application.service;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * ✅ SOLUCIÓN PROBLEMA 1: Cache de creación de inscripciones
 * 
 * Servicio que maneja un cache temporal para prevenir condiciones de carrera
 * durante la creación de inscripciones. Implementa timeout automático y
 * limpieza periódica para evitar memory leaks.
 * 
 * Funcionalidades:
 * - Cache temporal con timeout configurable (default: 30 segundos)
 * - Limpieza automática de entradas expiradas cada 60 segundos
 * - Thread-safe usando ConcurrentHashMap
 * - Logging detallado para debugging y monitoreo
 */
@Service
@RequiredArgsConstructor
public class InscriptionCreationCacheService {
    
    private static final Logger log = LoggerFactory.getLogger(InscriptionCreationCacheService.class);
    
    /**
     * Cache para almacenar las creaciones en progreso
     * Key: "contestId:userId" (Long:UUID)
     * Value: CreationCacheEntry con timestamp y metadata
     */
    private final ConcurrentHashMap<String, CreationCacheEntry> creationCache = new ConcurrentHashMap<>();
    
    /**
     * Executor para limpieza automática del cache
     */
    private final ScheduledExecutorService cleanupExecutor = Executors.newSingleThreadScheduledExecutor(r -> {
        Thread t = new Thread(r, "inscription-cache-cleanup");
        t.setDaemon(true);
        return t;
    });
    
    /**
     * Timeout por defecto para entradas del cache (30 segundos)
     */
    private static final long DEFAULT_TIMEOUT_SECONDS = 30;
    
    /**
     * Intervalo de limpieza automática (60 segundos)
     */
    private static final long CLEANUP_INTERVAL_SECONDS = 60;
    
    /**
     * Inicialización del servicio - configura limpieza automática
     */
    public void init() {
        log.info("Inicializando InscriptionCreationCacheService con timeout de {} segundos", DEFAULT_TIMEOUT_SECONDS);
        
        // Programar limpieza automática cada 60 segundos
        cleanupExecutor.scheduleAtFixedRate(
            this::cleanupExpiredEntries,
            CLEANUP_INTERVAL_SECONDS,
            CLEANUP_INTERVAL_SECONDS,
            TimeUnit.SECONDS
        );
        
        log.debug("Limpieza automática programada cada {} segundos", CLEANUP_INTERVAL_SECONDS);
    }
    
    /**
     * Intenta marcar una inscripción como "en creación"
     * @param contestId ID del concurso (Long)
     * @param userId ID del usuario (UUID)
     * @return true si se pudo marcar (no existe otra creación en progreso), false si ya existe
     */
    public boolean tryMarkAsCreating(Long contestId, UUID userId) {
        String key = buildCacheKey(contestId, userId);
        LocalDateTime now = LocalDateTime.now();
        
        // Verificar si ya existe una entrada no expirada
        CreationCacheEntry existing = creationCache.get(key);
        if (existing != null && !isExpired(existing, now)) {
            log.debug("Creación ya en progreso para clave {} - Rechazando intento duplicado", key);
            return false;
        }
        
        // Crear nueva entrada
        CreationCacheEntry newEntry = new CreationCacheEntry(now, contestId, userId);
        CreationCacheEntry previous = creationCache.put(key, newEntry);
        
        if (previous != null && !isExpired(previous, now)) {
            // Condición de carrera: otra thread creó la entrada justo antes
            log.debug("Condición de carrera detectada para clave {} - Rechazando", key);
            return false;
        }
        
        log.debug("Marcado como 'en creación' exitoso para clave {} - Timeout: {} segundos", 
                 key, DEFAULT_TIMEOUT_SECONDS);
        return true;
    }
    
    /**
     * Marca una inscripción como completada (exitosa o fallida)
     * @param contestId ID del concurso (Long)
     * @param userId ID del usuario (UUID)
     * @param success true si la creación fue exitosa, false si falló
     */
    public void markAsCompleted(Long contestId, UUID userId, boolean success) {
        String key = buildCacheKey(contestId, userId);
        CreationCacheEntry removed = creationCache.remove(key);
        
        if (removed != null) {
            log.debug("Creación completada para clave {} - Éxito: {} - Duración: {} ms", 
                     key, success, java.time.Duration.between(removed.timestamp, LocalDateTime.now()).toMillis());
        } else {
            log.warn("Intento de marcar como completada una clave inexistente: {}", key);
        }
    }
    
    /**
     * Verifica si hay una creación en progreso para el usuario/concurso
     * @param contestId ID del concurso (Long)
     * @param userId ID del usuario (UUID)
     * @return true si hay una creación en progreso
     */
    public boolean isCreationInProgress(Long contestId, UUID userId) {
        String key = buildCacheKey(contestId, userId);
        CreationCacheEntry entry = creationCache.get(key);
        
        if (entry == null) {
            return false;
        }
        
        if (isExpired(entry, LocalDateTime.now())) {
            // Limpiar entrada expirada
            creationCache.remove(key);
            log.debug("Entrada expirada removida para clave {}", key);
            return false;
        }
        
        return true;
    }
    
    /**
     * Limpia todas las entradas expiradas del cache
     */
    public void cleanupExpiredEntries() {
        LocalDateTime now = LocalDateTime.now();
        int initialSize = creationCache.size();
        
        creationCache.entrySet().removeIf(entry -> {
            if (isExpired(entry.getValue(), now)) {
                log.debug("Removiendo entrada expirada: {}", entry.getKey());
                return true;
            }
            return false;
        });
        
        int finalSize = creationCache.size();
        if (initialSize != finalSize) {
            log.debug("Limpieza completada - Entradas removidas: {} - Entradas restantes: {}", 
                     initialSize - finalSize, finalSize);
        }
    }
    
    /**
     * Obtiene estadísticas del cache para monitoreo
     * @return InscriptionCacheStats con información del cache
     */
    public InscriptionCacheStats getCacheStats() {
        LocalDateTime now = LocalDateTime.now();
        int totalEntries = creationCache.size();
        int expiredEntries = (int) creationCache.values().stream()
                .mapToLong(entry -> isExpired(entry, now) ? 1 : 0)
                .sum();
        
        return new InscriptionCacheStats(totalEntries, expiredEntries, totalEntries - expiredEntries);
    }
    
    /**
     * Construye la clave del cache
     */
    private String buildCacheKey(Long contestId, UUID userId) {
        return contestId + ":" + userId.toString();
    }
    
    /**
     * Verifica si una entrada está expirada
     */
    private boolean isExpired(CreationCacheEntry entry, LocalDateTime now) {
        return entry.timestamp.plusSeconds(DEFAULT_TIMEOUT_SECONDS).isBefore(now);
    }
    
    /**
     * Entrada del cache con timestamp y metadata
     */
    private static class CreationCacheEntry {
        final LocalDateTime timestamp;
        final Long contestId;
        final UUID userId;

        CreationCacheEntry(LocalDateTime timestamp, Long contestId, UUID userId) {
            this.timestamp = timestamp;
            this.contestId = contestId;
            this.userId = userId;
        }
    }
    
    /**
     * Estadísticas del cache para monitoreo
     */
    public static class InscriptionCacheStats {
        public final int totalEntries;
        public final int expiredEntries;
        public final int activeEntries;
        
        public InscriptionCacheStats(int totalEntries, int expiredEntries, int activeEntries) {
            this.totalEntries = totalEntries;
            this.expiredEntries = expiredEntries;
            this.activeEntries = activeEntries;
        }
        
        @Override
        public String toString() {
            return String.format("InscriptionCacheStats{total=%d, expired=%d, active=%d}", 
                               totalEntries, expiredEntries, activeEntries);
        }
    }
    
    /**
     * Cleanup al destruir el servicio
     */
    public void destroy() {
        log.info("Cerrando InscriptionCreationCacheService");
        cleanupExecutor.shutdown();
        try {
            if (!cleanupExecutor.awaitTermination(5, TimeUnit.SECONDS)) {
                cleanupExecutor.shutdownNow();
            }
        } catch (InterruptedException e) {
            cleanupExecutor.shutdownNow();
            Thread.currentThread().interrupt();
        }
        creationCache.clear();
    }
}
