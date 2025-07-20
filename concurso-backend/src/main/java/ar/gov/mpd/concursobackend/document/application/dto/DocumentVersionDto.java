package ar.gov.mpd.concursobackend.document.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO que representa una versión anterior de un documento
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentVersionDto {
    private String id;
    private String nombreArchivo;
    private String estado;
    private LocalDateTime fechaCarga;
    private String comentarios;
    private int numeroVersion;
    private boolean esArchivado;
    private LocalDateTime fechaArchivado;
    private String archivedBy;
}
