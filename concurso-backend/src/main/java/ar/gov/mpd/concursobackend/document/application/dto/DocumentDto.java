package ar.gov.mpd.concursobackend.document.application.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentDto {
    private String id;
    private String tipoDocumentoId;
    private DocumentTypeDto tipoDocumento;
    private String nombreArchivo;
    private String contentType;
    private String estado;
    private String comentarios;
    private LocalDateTime fechaCarga;
}