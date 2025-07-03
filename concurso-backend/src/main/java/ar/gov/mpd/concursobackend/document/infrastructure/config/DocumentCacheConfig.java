package ar.gov.mpd.concursobackend.document.infrastructure.config;

import java.util.Arrays;
import java.util.concurrent.Executor;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

/**
 * Configuración de caché y procesamiento asíncrono para el sistema de documentos
 */
@Configuration
@EnableCaching
@EnableAsync
@EnableScheduling
public class DocumentCacheConfig {

    /**
     * Configuración del caché manager con ConcurrentMap (simple pero efectivo)
     */
    @Bean
    public CacheManager cacheManager() {
        ConcurrentMapCacheManager cacheManager = new ConcurrentMapCacheManager();

        // Cachés específicos para el sistema de documentos
        cacheManager.setCacheNames(Arrays.asList("documentMetrics", "documentTypes", "userDocuments"));

        return cacheManager;
    }

    /**
     * Configuración del executor para tareas asíncronas de documentos
     */
    @Bean(name = "documentTaskExecutor")
    public Executor documentTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        
        // Configuración del pool de threads
        executor.setCorePoolSize(2); // Mínimo 2 threads
        executor.setMaxPoolSize(10); // Máximo 10 threads
        executor.setQueueCapacity(100); // Cola de 100 tareas
        executor.setThreadNamePrefix("DocumentTask-");
        
        // Configuración de rechazo y cierre
        executor.setRejectedExecutionHandler(new java.util.concurrent.ThreadPoolExecutor.CallerRunsPolicy());
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(60);
        
        executor.initialize();
        return executor;
    }

    /**
     * Configuración del executor para limpieza y mantenimiento
     */
    @Bean(name = "cleanupTaskExecutor")
    public Executor cleanupTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        
        // Configuración específica para tareas de limpieza
        executor.setCorePoolSize(1); // Solo 1 thread para limpieza
        executor.setMaxPoolSize(2); // Máximo 2 threads
        executor.setQueueCapacity(10); // Cola pequeña
        executor.setThreadNamePrefix("CleanupTask-");
        
        // Configuración de rechazo y cierre
        executor.setRejectedExecutionHandler(new java.util.concurrent.ThreadPoolExecutor.CallerRunsPolicy());
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(120); // Más tiempo para limpieza
        
        executor.initialize();
        return executor;
    }
}
