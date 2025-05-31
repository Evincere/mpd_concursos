package ar.gov.mpd.concursobackend.document.application.dto;

import lombok.Data;

/**
 * DTO para representar el estado de un documento en la cola de procesamiento.
 */
@Data
public class QueuedDocumentStatus {
    
    /**
     * ID único de la tarea en cola
     */
    private String queueId;
    
    /**
     * ID del documento (disponible después de completar el procesamiento)
     */
    private String documentId;
    
    /**
     * ID del tipo de documento
     */
    private String documentTypeId;
    
    /**
     * Nombre del archivo
     */
    private String fileName;
    
    /**
     * ID del usuario que subió el documento
     */
    private String userId;
    
    /**
     * Estado actual del documento:
     * - PENDING: En espera de procesamiento
     * - PROCESSING: Procesamiento iniciado
     * - VALIDATING: Validando documento
     * - UPLOADING: Subiendo documento
     * - COMPLETED: Procesamiento completado
     * - ERROR: Error durante el procesamiento
     */
    private String status;
    
    /**
     * Progreso actual (0-100)
     */
    private int progress;
    
    /**
     * Mensaje de error (si hay alguno)
     */
    private String errorMessage;
    
    /**
     * Timestamp de la última actualización
     */
    private long lastUpdated = System.currentTimeMillis();
}
