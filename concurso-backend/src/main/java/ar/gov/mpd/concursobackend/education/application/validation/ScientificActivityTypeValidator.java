package ar.gov.mpd.concursobackend.education.application.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import ar.gov.mpd.concursobackend.education.domain.model.ScientificActivityType;

/**
 * Validador para tipos de actividad científica
 * Verifica que el string corresponda a un ScientificActivityType válido usando displayName
 */
public class ScientificActivityTypeValidator implements ConstraintValidator<ValidScientificActivityType, String> {

    @Override
    public void initialize(ValidScientificActivityType constraintAnnotation) {
        // No initialization needed
    }

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null || value.trim().isEmpty()) {
            return true; // Permitir null/empty, @NotBlank se encarga si es requerido
        }

        try {
            ScientificActivityType.fromDisplayName(value);
            return true;
        } catch (IllegalArgumentException e) {
            // Personalizar el mensaje de error con los valores válidos
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(
                "Invalid scientific activity type. Valid values: " + getValidValues()
            ).addConstraintViolation();
            return false;
        }
    }

    private String getValidValues() {
        StringBuilder sb = new StringBuilder();
        ScientificActivityType[] types = ScientificActivityType.values();
        for (int i = 0; i < types.length; i++) {
            sb.append("'").append(types[i].getDisplayName()).append("'");
            if (i < types.length - 1) {
                sb.append(", ");
            }
        }
        return sb.toString();
    }
}
