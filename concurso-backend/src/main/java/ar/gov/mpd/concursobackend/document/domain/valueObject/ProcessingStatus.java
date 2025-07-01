package ar.gov.mpd.concursobackend.document.domain.valueObject;

/**
 * Estados técnicos para el procesamiento de documentos.
 * Estos estados representan el progreso técnico de la subida y procesamiento,
 * separados de los estados de negocio (DocumentStatus).
 */
public enum ProcessingStatus {
    /**
     * Documento iniciando proceso de subida
     */
    UPLOADING,
    
    /**
     * Documento siendo procesado (validaciones técnicas, almacenamiento)
     */
    PROCESSING,
    
    /**
     * Procesamiento técnico completado exitosamente
     * El documento está listo y en estado PENDING para revisión administrativa
     */
    UPLOAD_COMPLETE,
    
    /**
     * Error durante el procesamiento técnico
     */
    UPLOAD_FAILED
}
