package ar.gov.mpd.concursobackend.document.application.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Resultado de la validación de un documento
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class DocumentValidationResult {
    private boolean valid;
    private List<ValidationError> errors;
}
