package ar.gov.mpd.concursobackend.shared.infrastructure.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

/**
 * Configuración para habilitar el procesamiento asíncrono en la aplicación.
 * Define un pool de hilos para ejecutar tareas asíncronas.
 */
@Configuration
@EnableAsync
public class AsyncConfig {

    /**
     * Configura un executor de tareas asíncronas con un pool de hilos.
     * Este executor se utilizará para procesar documentos en segundo plano.
     *
     * @return Executor configurado para tareas asíncronas
     */
    @Bean(name = "taskExecutor")
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        // Número de hilos principales
        executor.setCorePoolSize(2);
        // Número máximo de hilos
        executor.setMaxPoolSize(4);
        // Tamaño de la cola de tareas pendientes
        executor.setQueueCapacity(100);
        // Prefijo para los nombres de los hilos
        executor.setThreadNamePrefix("DocumentProcessor-");
        // Inicializar el executor
        executor.initialize();
        return executor;
    }
}
