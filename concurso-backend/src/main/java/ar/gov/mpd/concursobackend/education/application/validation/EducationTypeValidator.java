package ar.gov.mpd.concursobackend.education.application.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import ar.gov.mpd.concursobackend.education.domain.model.EducationType;

/**
 * Validador para tipos de educación
 * Verifica que el string corresponda a un EducationType válido usando displayName
 */
public class EducationTypeValidator implements ConstraintValidator<ValidEducationType, String> {

    @Override
    public void initialize(ValidEducationType constraintAnnotation) {
        // No initialization needed
    }

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null || value.trim().isEmpty()) {
            return false; // @NotBlank se encarga de esto, pero por seguridad
        }

        try {
            EducationType.fromDisplayName(value);
            return true;
        } catch (IllegalArgumentException e) {
            // Personalizar el mensaje de error con los valores válidos
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(
                "Invalid education type. Valid values: " + getValidValues()
            ).addConstraintViolation();
            return false;
        }
    }

    private String getValidValues() {
        StringBuilder sb = new StringBuilder();
        EducationType[] types = EducationType.values();
        for (int i = 0; i < types.length; i++) {
            sb.append("'").append(types[i].getDisplayName()).append("'");
            if (i < types.length - 1) {
                sb.append(", ");
            }
        }
        return sb.toString();
    }
}
