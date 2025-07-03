package ar.gov.mpd.concursobackend.document.application.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

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
