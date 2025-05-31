package ar.gov.mpd.concursobackend.document.infrastructure.scheduler;

import ar.gov.mpd.concursobackend.document.application.service.DocumentQueueService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Programador para limpiar entradas antiguas de la cola de documentos.
 */
@Component
@EnableScheduling
@RequiredArgsConstructor
@Slf4j
public class DocumentQueueCleanupScheduler {

    private final DocumentQueueService documentQueueService;

    @Value("${app.document.queue.max.age:3600000}")
    private long maxAgeMs; // 1 hora por defecto

    /**
     * Limpia entradas antiguas de la cola de documentos cada hora.
     */
    @Scheduled(fixedRate = 3600000) // Ejecutar cada hora
    public void cleanupOldQueueEntries() {
        log.debug("Iniciando limpieza programada de entradas antiguas en la cola de documentos");
        documentQueueService.cleanupOldEntries(maxAgeMs);
        log.debug("Limpieza de cola de documentos completada");
    }
}
