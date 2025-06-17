package ar.gov.mpd.concursobackend.dashboard.infrastructure.cache;

import ar.gov.mpd.concursobackend.dashboard.domain.UserDashboardStats;
import ar.gov.mpd.concursobackend.dashboard.domain.UserDeadline;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Servicio de cache en memoria para datos del dashboard
 * Mejora el rendimiento evitando consultas repetitivas a la base de datos
 */
@Service
@Slf4j
public class DashboardCacheService {
    
    private static final String LOG_TAG = "DashboardCacheService";
    
    // Cache para estadísticas de usuario (TTL: 15 minutos)
    private final Map<String, CacheEntry<UserDashboardStats>> statsCache = new ConcurrentHashMap<>();
    
    // Cache para vencimientos de usuario (TTL: 5 minutos)
    private final Map<String, CacheEntry<List<UserDeadline>>> deadlinesCache = new ConcurrentHashMap<>();
    
    // TTL en minutos
    private static final int STATS_TTL_MINUTES = 15;
    private static final int DEADLINES_TTL_MINUTES = 5;
    
    /**
     * Obtiene las estadísticas del usuario desde cache o null si no existe/expiró
     */
    public UserDashboardStats getUserStats(Long userId) {
        String key = "stats_" + userId;
        CacheEntry<UserDashboardStats> entry = statsCache.get(key);
        
        if (entry != null && !entry.isExpired()) {
            log.debug("[{}] Cache HIT para estadísticas del usuario {}", LOG_TAG, userId);
            return entry.getValue();
        }
        
        if (entry != null) {
            log.debug("[{}] Cache EXPIRED para estadísticas del usuario {}", LOG_TAG, userId);
            statsCache.remove(key);
        } else {
            log.debug("[{}] Cache MISS para estadísticas del usuario {}", LOG_TAG, userId);
        }
        
        return null;
    }
    
    /**
     * Almacena las estadísticas del usuario en cache
     */
    public void putUserStats(Long userId, UserDashboardStats stats) {
        String key = "stats_" + userId;
        LocalDateTime expiry = LocalDateTime.now().plusMinutes(STATS_TTL_MINUTES);
        statsCache.put(key, new CacheEntry<>(stats, expiry));
        log.debug("[{}] Estadísticas del usuario {} almacenadas en cache (expira: {})", 
                LOG_TAG, userId, expiry);
    }
    
    /**
     * Obtiene los vencimientos del usuario desde cache o null si no existe/expiró
     */
    public List<UserDeadline> getUserDeadlines(Long userId, String cacheKey) {
        String key = "deadlines_" + userId + "_" + cacheKey;
        CacheEntry<List<UserDeadline>> entry = deadlinesCache.get(key);
        
        if (entry != null && !entry.isExpired()) {
            log.debug("[{}] Cache HIT para vencimientos del usuario {} (key: {})", LOG_TAG, userId, cacheKey);
            return entry.getValue();
        }
        
        if (entry != null) {
            log.debug("[{}] Cache EXPIRED para vencimientos del usuario {} (key: {})", LOG_TAG, userId, cacheKey);
            deadlinesCache.remove(key);
        } else {
            log.debug("[{}] Cache MISS para vencimientos del usuario {} (key: {})", LOG_TAG, userId, cacheKey);
        }
        
        return null;
    }
    
    /**
     * Almacena los vencimientos del usuario en cache
     */
    public void putUserDeadlines(Long userId, String cacheKey, List<UserDeadline> deadlines) {
        String key = "deadlines_" + userId + "_" + cacheKey;
        LocalDateTime expiry = LocalDateTime.now().plusMinutes(DEADLINES_TTL_MINUTES);
        deadlinesCache.put(key, new CacheEntry<>(deadlines, expiry));
        log.debug("[{}] Vencimientos del usuario {} almacenados en cache (key: {}, expira: {})", 
                LOG_TAG, userId, cacheKey, expiry);
    }
    
    /**
     * Invalida todo el cache de un usuario específico
     */
    public void invalidateUserCache(Long userId) {
        String userPrefix = "_" + userId + "_";
        
        // Invalidar estadísticas
        statsCache.entrySet().removeIf(entry -> entry.getKey().contains(userPrefix));
        
        // Invalidar vencimientos
        deadlinesCache.entrySet().removeIf(entry -> entry.getKey().contains(userPrefix));
        
        log.info("[{}] Cache invalidado para usuario {}", LOG_TAG, userId);
    }
    
    /**
     * Invalida todo el cache (útil para mantenimiento)
     */
    public void invalidateAllCache() {
        int statsCount = statsCache.size();
        int deadlinesCount = deadlinesCache.size();
        
        statsCache.clear();
        deadlinesCache.clear();
        
        log.info("[{}] Todo el cache invalidado ({} estadísticas, {} vencimientos)", 
                LOG_TAG, statsCount, deadlinesCount);
    }
    
    /**
     * Limpia entradas expiradas del cache (mantenimiento automático)
     */
    public void cleanupExpiredEntries() {
        LocalDateTime now = LocalDateTime.now();
        
        // Limpiar estadísticas expiradas
        int statsRemoved = 0;
        var statsIterator = statsCache.entrySet().iterator();
        while (statsIterator.hasNext()) {
            var entry = statsIterator.next();
            if (entry.getValue().getExpiry().isBefore(now)) {
                statsIterator.remove();
                statsRemoved++;
            }
        }
        
        // Limpiar vencimientos expirados
        int deadlinesRemoved = 0;
        var deadlinesIterator = deadlinesCache.entrySet().iterator();
        while (deadlinesIterator.hasNext()) {
            var entry = deadlinesIterator.next();
            if (entry.getValue().getExpiry().isBefore(now)) {
                deadlinesIterator.remove();
                deadlinesRemoved++;
            }
        }
        
        if (statsRemoved > 0 || deadlinesRemoved > 0) {
            log.info("[{}] Limpieza de cache completada: {} estadísticas, {} vencimientos removidos", 
                    LOG_TAG, statsRemoved, deadlinesRemoved);
        }
    }
    
    /**
     * Obtiene métricas del cache para monitoreo
     */
    public CacheMetrics getCacheMetrics() {
        LocalDateTime now = LocalDateTime.now();
        
        long validStatsEntries = statsCache.values().stream()
                .mapToLong(entry -> entry.getExpiry().isAfter(now) ? 1 : 0)
                .sum();
        
        long validDeadlinesEntries = deadlinesCache.values().stream()
                .mapToLong(entry -> entry.getExpiry().isAfter(now) ? 1 : 0)
                .sum();
        
        return CacheMetrics.builder()
                .totalStatsEntries(statsCache.size())
                .validStatsEntries(validStatsEntries)
                .totalDeadlinesEntries(deadlinesCache.size())
                .validDeadlinesEntries(validDeadlinesEntries)
                .statsTtlMinutes(STATS_TTL_MINUTES)
                .deadlinesTtlMinutes(DEADLINES_TTL_MINUTES)
                .build();
    }
    
    /**
     * Entrada de cache con TTL
     */
    private static class CacheEntry<T> {
        private final T value;
        private final LocalDateTime expiry;
        
        public CacheEntry(T value, LocalDateTime expiry) {
            this.value = value;
            this.expiry = expiry;
        }
        
        public T getValue() {
            return value;
        }
        
        public LocalDateTime getExpiry() {
            return expiry;
        }
        
        public boolean isExpired() {
            return LocalDateTime.now().isAfter(expiry);
        }
    }
    
    /**
     * Métricas del cache para monitoreo
     */
    public static class CacheMetrics {
        private final long totalStatsEntries;
        private final long validStatsEntries;
        private final long totalDeadlinesEntries;
        private final long validDeadlinesEntries;
        private final int statsTtlMinutes;
        private final int deadlinesTtlMinutes;
        
        private CacheMetrics(Builder builder) {
            this.totalStatsEntries = builder.totalStatsEntries;
            this.validStatsEntries = builder.validStatsEntries;
            this.totalDeadlinesEntries = builder.totalDeadlinesEntries;
            this.validDeadlinesEntries = builder.validDeadlinesEntries;
            this.statsTtlMinutes = builder.statsTtlMinutes;
            this.deadlinesTtlMinutes = builder.deadlinesTtlMinutes;
        }
        
        public static Builder builder() {
            return new Builder();
        }
        
        // Getters
        public long getTotalStatsEntries() { return totalStatsEntries; }
        public long getValidStatsEntries() { return validStatsEntries; }
        public long getTotalDeadlinesEntries() { return totalDeadlinesEntries; }
        public long getValidDeadlinesEntries() { return validDeadlinesEntries; }
        public int getStatsTtlMinutes() { return statsTtlMinutes; }
        public int getDeadlinesTtlMinutes() { return deadlinesTtlMinutes; }
        
        public static class Builder {
            private long totalStatsEntries;
            private long validStatsEntries;
            private long totalDeadlinesEntries;
            private long validDeadlinesEntries;
            private int statsTtlMinutes;
            private int deadlinesTtlMinutes;
            
            public Builder totalStatsEntries(long totalStatsEntries) {
                this.totalStatsEntries = totalStatsEntries;
                return this;
            }
            
            public Builder validStatsEntries(long validStatsEntries) {
                this.validStatsEntries = validStatsEntries;
                return this;
            }
            
            public Builder totalDeadlinesEntries(long totalDeadlinesEntries) {
                this.totalDeadlinesEntries = totalDeadlinesEntries;
                return this;
            }
            
            public Builder validDeadlinesEntries(long validDeadlinesEntries) {
                this.validDeadlinesEntries = validDeadlinesEntries;
                return this;
            }
            
            public Builder statsTtlMinutes(int statsTtlMinutes) {
                this.statsTtlMinutes = statsTtlMinutes;
                return this;
            }
            
            public Builder deadlinesTtlMinutes(int deadlinesTtlMinutes) {
                this.deadlinesTtlMinutes = deadlinesTtlMinutes;
                return this;
            }
            
            public CacheMetrics build() {
                return new CacheMetrics(this);
            }
        }
    }
}
