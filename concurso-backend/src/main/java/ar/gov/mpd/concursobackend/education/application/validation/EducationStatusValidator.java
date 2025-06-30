package ar.gov.mpd.concursobackend.education.application.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import ar.gov.mpd.concursobackend.education.domain.model.EducationStatus;

/**
 * Validador para estados de educación
 * Verifica que el string corresponda a un EducationStatus válido usando displayName
 */
public class EducationStatusValidator implements ConstraintValidator<ValidEducationStatus, String> {

    @Override
    public void initialize(ValidEducationStatus constraintAnnotation) {
        // No initialization needed
    }

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null || value.trim().isEmpty()) {
            return false; // @NotBlank se encarga de esto, pero por seguridad
        }

        try {
            EducationStatus.fromDisplayName(value);
            return true;
        } catch (IllegalArgumentException e) {
            // Personalizar el mensaje de error con los valores válidos
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(
                "Invalid education status. Valid values: " + getValidValues()
            ).addConstraintViolation();
            return false;
        }
    }

    private String getValidValues() {
        StringBuilder sb = new StringBuilder();
        EducationStatus[] statuses = EducationStatus.values();
        for (int i = 0; i < statuses.length; i++) {
            sb.append("'").append(statuses[i].getDisplayName()).append("'");
            if (i < statuses.length - 1) {
                sb.append(", ");
            }
        }
        return sb.toString();
    }
}
