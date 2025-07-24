package ar.gov.mpd.concursobackend.document.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO que representa un resumen de documentos agrupados por tipo,
 * mostrando solo el documento más reciente con información del historial
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentSummaryDto {
    
    // Información del documento más reciente (activo)
    private String id;
    private String tipoDocumentoId;
    private DocumentTypeDto tipoDocumento;
    private String nombreArchivo;
    private String contentType;
    private String estado;
    private String comentarios;
    private LocalDateTime fechaCarga;
    private String validadoPor;
    private LocalDateTime fechaValidacion;
    private String motivoRechazo;
    
    // Información del historial de versiones
    private int totalVersiones;
    private int versionActual;
    private boolean tieneVersionesAnteriores;
    private List<DocumentVersionDto> versionesAnteriores;
    
    // Información adicional para UI
    private boolean esDocumentoActivo;
    private String estadoDetallado; // "Activo", "Reemplazado", "Archivado"
}
