package ar.gov.mpd.concursobackend.document.application.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Error de validación de un documento
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ValidationError {
    private String code;
    private String message;
}
