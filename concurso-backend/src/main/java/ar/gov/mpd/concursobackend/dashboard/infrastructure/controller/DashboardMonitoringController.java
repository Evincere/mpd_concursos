package ar.gov.mpd.concursobackend.dashboard.infrastructure.controller;

import ar.gov.mpd.concursobackend.dashboard.infrastructure.cache.DashboardCacheService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Controlador para monitoreo y administración del dashboard
 * Proporciona endpoints para métricas, cache y mantenimiento
 */
@RestController
@RequestMapping("/api/dashboard/monitoring")
@RequiredArgsConstructor
@Slf4j
public class DashboardMonitoringController {
    
    private static final String LOG_TAG = "DashboardMonitoringController";
    
    private final DashboardCacheService cacheService;
    
    /**
     * Obtiene métricas del cache del dashboard
     * Solo accesible para administradores
     */
    @GetMapping("/cache/metrics")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getCacheMetrics() {
        log.info("[{}] Solicitando métricas del cache", LOG_TAG);
        
        try {
            DashboardCacheService.CacheMetrics metrics = cacheService.getCacheMetrics();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("metrics", Map.of(
                "stats", Map.of(
                    "totalEntries", metrics.getTotalStatsEntries(),
                    "validEntries", metrics.getValidStatsEntries(),
                    "ttlMinutes", metrics.getStatsTtlMinutes(),
                    "efficiency", metrics.getTotalStatsEntries() > 0 ? 
                        (double) metrics.getValidStatsEntries() / metrics.getTotalStatsEntries() * 100 : 0
                ),
                "deadlines", Map.of(
                    "totalEntries", metrics.getTotalDeadlinesEntries(),
                    "validEntries", metrics.getValidDeadlinesEntries(),
                    "ttlMinutes", metrics.getDeadlinesTtlMinutes(),
                    "efficiency", metrics.getTotalDeadlinesEntries() > 0 ? 
                        (double) metrics.getValidDeadlinesEntries() / metrics.getTotalDeadlinesEntries() * 100 : 0
                )
            ));
            
            log.info("[{}] Métricas del cache enviadas exitosamente", LOG_TAG);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("[{}] Error obteniendo métricas del cache: {}", LOG_TAG, e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Error interno del servidor");
            errorResponse.put("message", e.getMessage());
            
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
    
    /**
     * Limpia entradas expiradas del cache manualmente
     * Solo accesible para administradores
     */
    @PostMapping("/cache/cleanup")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> cleanupCache() {
        log.info("[{}] Solicitando limpieza manual del cache", LOG_TAG);
        
        try {
            cacheService.cleanupExpiredEntries();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Limpieza del cache completada exitosamente");
            
            log.info("[{}] Limpieza manual del cache completada", LOG_TAG);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("[{}] Error en limpieza manual del cache: {}", LOG_TAG, e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Error interno del servidor");
            errorResponse.put("message", e.getMessage());
            
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
    
    /**
     * Invalida todo el cache del dashboard
     * Solo accesible para administradores - usar con precaución
     */
    @PostMapping("/cache/invalidate-all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> invalidateAllCache() {
        log.warn("[{}] Solicitando invalidación completa del cache", LOG_TAG);
        
        try {
            cacheService.invalidateAllCache();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Todo el cache ha sido invalidado");
            response.put("warning", "Esta acción afectará el rendimiento temporalmente");
            
            log.warn("[{}] Cache completamente invalidado", LOG_TAG);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("[{}] Error invalidando todo el cache: {}", LOG_TAG, e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Error interno del servidor");
            errorResponse.put("message", e.getMessage());
            
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
    
    /**
     * Invalida el cache de un usuario específico
     * Solo accesible para administradores
     */
    @PostMapping("/cache/invalidate-user/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> invalidateUserCache(@PathVariable Long userId) {
        log.info("[{}] Solicitando invalidación del cache para usuario {}", LOG_TAG, userId);
        
        try {
            cacheService.invalidateUserCache(userId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Cache del usuario " + userId + " invalidado exitosamente");
            
            log.info("[{}] Cache del usuario {} invalidado", LOG_TAG, userId);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("[{}] Error invalidando cache del usuario {}: {}", LOG_TAG, userId, e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Error interno del servidor");
            errorResponse.put("message", e.getMessage());
            
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
    
    /**
     * Obtiene información general del estado del dashboard
     * Solo accesible para administradores
     */
    @GetMapping("/health")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getDashboardHealth() {
        log.info("[{}] Solicitando estado de salud del dashboard", LOG_TAG);
        
        try {
            DashboardCacheService.CacheMetrics metrics = cacheService.getCacheMetrics();
            
            Map<String, Object> health = new HashMap<>();
            health.put("status", "UP");
            health.put("cache", Map.of(
                "enabled", true,
                "totalEntries", metrics.getTotalStatsEntries() + metrics.getTotalDeadlinesEntries(),
                "validEntries", metrics.getValidStatsEntries() + metrics.getValidDeadlinesEntries()
            ));
            health.put("timestamp", System.currentTimeMillis());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("health", health);
            
            log.info("[{}] Estado de salud del dashboard enviado", LOG_TAG);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("[{}] Error obteniendo estado de salud del dashboard: {}", LOG_TAG, e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("health", Map.of("status", "DOWN"));
            errorResponse.put("error", e.getMessage());
            
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
}
