package ar.gov.mpd.concursobackend.document.application.service;

import ar.gov.mpd.concursobackend.document.application.dto.DocumentResponse;
import ar.gov.mpd.concursobackend.document.application.dto.DocumentUploadRequest;
import ar.gov.mpd.concursobackend.document.application.dto.QueuedDocumentStatus;
import ar.gov.mpd.concursobackend.document.domain.exception.DocumentException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Servicio para procesar documentos en cola.
 * Permite subir múltiples documentos de forma asíncrona y consultar su estado.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentQueueService {

    private final DocumentServiceImpl documentService;
    
    // Mapa para almacenar el estado de los documentos en cola
    private final Map<String, QueuedDocumentStatus> documentQueue = new ConcurrentHashMap<>();

    /**
     * Encola un documento para su procesamiento asíncrono.
     *
     * @param request Solicitud de carga de documento
     * @param fileContent Contenido del archivo en bytes
     * @param userId ID del usuario
     * @return ID de la tarea en cola
     */
    public String enqueueDocument(DocumentUploadRequest request, byte[] fileContent, UUID userId) {
        String queueId = UUID.randomUUID().toString();
        
        // Crear estado inicial del documento en cola
        QueuedDocumentStatus status = new QueuedDocumentStatus();
        status.setQueueId(queueId);
        status.setFileName(request.getFileName());
        status.setStatus("PENDING");
        status.setProgress(0);
        status.setUserId(userId.toString());
        status.setDocumentTypeId(request.getDocumentTypeId());
        
        // Almacenar en el mapa de estado
        documentQueue.put(queueId, status);
        
        // Iniciar procesamiento asíncrono
        processDocumentAsync(queueId, request, fileContent, userId);
        
        return queueId;
    }

    /**
     * Procesa un documento de forma asíncrona.
     *
     * @param queueId ID de la tarea en cola
     * @param request Solicitud de carga de documento
     * @param fileContent Contenido del archivo
     * @param userId ID del usuario
     * @return CompletableFuture con la respuesta del documento
     */
    @Async("taskExecutor")
    public CompletableFuture<DocumentResponse> processDocumentAsync(String queueId, DocumentUploadRequest request, 
                                                                   byte[] fileContent, UUID userId) {
        log.debug("Iniciando procesamiento asíncrono de documento: {}", request.getFileName());
        
        try {
            // Actualizar estado a "PROCESSING"
            updateStatus(queueId, "PROCESSING", 10);
            
            // Validar documento (simulación)
            Thread.sleep(500); // Simular tiempo de validación
            updateStatus(queueId, "VALIDATING", 30);
            
            // Procesar documento
            Thread.sleep(500); // Simular tiempo de procesamiento
            updateStatus(queueId, "UPLOADING", 50);
            
            // Crear InputStream a partir de los bytes
            try (InputStream inputStream = new ByteArrayInputStream(fileContent)) {
                // Subir documento
                DocumentResponse response = documentService.uploadDocument(request, inputStream, userId);
                
                // Actualizar estado a "COMPLETED"
                updateStatus(queueId, "COMPLETED", 100);
                
                // Almacenar ID del documento en el estado
                QueuedDocumentStatus status = documentQueue.get(queueId);
                if (status != null) {
                    status.setDocumentId(response.getId());
                }
                
                log.debug("Documento procesado correctamente: {}", request.getFileName());
                return CompletableFuture.completedFuture(response);
            }
        } catch (Exception e) {
            log.error("Error al procesar documento: {}", request.getFileName(), e);
            
            // Actualizar estado a "ERROR"
            QueuedDocumentStatus status = documentQueue.get(queueId);
            if (status != null) {
                status.setStatus("ERROR");
                status.setErrorMessage(e.getMessage());
            }
            
            return CompletableFuture.failedFuture(
                new DocumentException("Error al procesar documento: " + e.getMessage(), e));
        }
    }

    /**
     * Obtiene el estado actual de un documento en cola.
     *
     * @param queueId ID de la tarea en cola
     * @return Estado del documento en cola
     */
    public QueuedDocumentStatus getDocumentStatus(String queueId) {
        return documentQueue.get(queueId);
    }

    /**
     * Actualiza el estado de un documento en cola.
     *
     * @param queueId ID de la tarea en cola
     * @param status Nuevo estado
     * @param progress Progreso actual (0-100)
     */
    private void updateStatus(String queueId, String status, int progress) {
        QueuedDocumentStatus queuedStatus = documentQueue.get(queueId);
        if (queuedStatus != null) {
            queuedStatus.setStatus(status);
            queuedStatus.setProgress(progress);
            queuedStatus.setLastUpdated(System.currentTimeMillis());
        }
    }

    /**
     * Limpia los estados de documentos completados o con error que sean más antiguos que el tiempo especificado.
     *
     * @param maxAgeMs Edad máxima en milisegundos
     */
    public void cleanupOldEntries(long maxAgeMs) {
        long now = System.currentTimeMillis();
        documentQueue.entrySet().removeIf(entry -> {
            QueuedDocumentStatus status = entry.getValue();
            boolean isCompleted = "COMPLETED".equals(status.getStatus()) || "ERROR".equals(status.getStatus());
            boolean isOld = (now - status.getLastUpdated()) > maxAgeMs;
            return isCompleted && isOld;
        });
    }
}
