package ar.gov.mpd.concursobackend.dashboard.infrastructure.scheduler;

import ar.gov.mpd.concursobackend.dashboard.infrastructure.cache.DashboardCacheService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Scheduler para limpieza automática del cache del dashboard
 * Ejecuta tareas de mantenimiento periódicas para optimizar el rendimiento
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DashboardCacheCleanupScheduler {
    
    private static final String LOG_TAG = "DashboardCacheCleanupScheduler";
    
    private final DashboardCacheService cacheService;
    
    /**
     * Limpia entradas expiradas del cache cada 10 minutos
     */
    @Scheduled(fixedRate = 600000) // 10 minutos = 600,000 ms
    public void cleanupExpiredCacheEntries() {
        log.debug("[{}] Iniciando limpieza automática del cache", LOG_TAG);
        
        try {
            cacheService.cleanupExpiredEntries();
            log.debug("[{}] Limpieza automática del cache completada", LOG_TAG);
        } catch (Exception e) {
            log.error("[{}] Error durante la limpieza automática del cache: {}", LOG_TAG, e.getMessage(), e);
        }
    }
    
    /**
     * Reporta métricas del cache cada 30 minutos para monitoreo
     */
    @Scheduled(fixedRate = 1800000) // 30 minutos = 1,800,000 ms
    public void reportCacheMetrics() {
        log.debug("[{}] Generando reporte de métricas del cache", LOG_TAG);
        
        try {
            DashboardCacheService.CacheMetrics metrics = cacheService.getCacheMetrics();
            
            log.info("[{}] Métricas del Cache Dashboard:", LOG_TAG);
            log.info("  - Estadísticas: {}/{} entradas válidas (TTL: {} min)", 
                    metrics.getValidStatsEntries(), 
                    metrics.getTotalStatsEntries(), 
                    metrics.getStatsTtlMinutes());
            log.info("  - Vencimientos: {}/{} entradas válidas (TTL: {} min)", 
                    metrics.getValidDeadlinesEntries(), 
                    metrics.getTotalDeadlinesEntries(), 
                    metrics.getDeadlinesTtlMinutes());
            
            // Calcular eficiencia del cache
            double statsEfficiency = metrics.getTotalStatsEntries() > 0 ? 
                    (double) metrics.getValidStatsEntries() / metrics.getTotalStatsEntries() * 100 : 0;
            double deadlinesEfficiency = metrics.getTotalDeadlinesEntries() > 0 ? 
                    (double) metrics.getValidDeadlinesEntries() / metrics.getTotalDeadlinesEntries() * 100 : 0;
            
            log.info("  - Eficiencia: Estadísticas {:.1f}%, Vencimientos {:.1f}%", 
                    statsEfficiency, deadlinesEfficiency);
            
        } catch (Exception e) {
            log.error("[{}] Error generando métricas del cache: {}", LOG_TAG, e.getMessage(), e);
        }
    }
}
