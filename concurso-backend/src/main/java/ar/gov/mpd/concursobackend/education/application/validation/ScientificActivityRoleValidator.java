package ar.gov.mpd.concursobackend.education.application.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import ar.gov.mpd.concursobackend.education.domain.model.ScientificActivityRole;

/**
 * Validador para roles de actividad científica
 * Verifica que el string corresponda a un ScientificActivityRole válido usando displayName
 */
public class ScientificActivityRoleValidator implements ConstraintValidator<ValidScientificActivityRole, String> {

    @Override
    public void initialize(ValidScientificActivityRole constraintAnnotation) {
        // No initialization needed
    }

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null || value.trim().isEmpty()) {
            return true; // Permitir null/empty, @NotBlank se encarga si es requerido
        }

        try {
            ScientificActivityRole.fromDisplayName(value);
            return true;
        } catch (IllegalArgumentException e) {
            // Personalizar el mensaje de error con los valores válidos
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(
                "Invalid scientific activity role. Valid values: " + getValidValues()
            ).addConstraintViolation();
            return false;
        }
    }

    private String getValidValues() {
        StringBuilder sb = new StringBuilder();
        ScientificActivityRole[] roles = ScientificActivityRole.values();
        for (int i = 0; i < roles.length; i++) {
            sb.append("'").append(roles[i].getDisplayName()).append("'");
            if (i < roles.length - 1) {
                sb.append(", ");
            }
        }
        return sb.toString();
    }
}
