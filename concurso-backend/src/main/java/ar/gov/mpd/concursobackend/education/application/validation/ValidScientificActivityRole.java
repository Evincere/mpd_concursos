package ar.gov.mpd.concursobackend.education.application.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.*;

/**
 * Validación personalizada para roles de actividad científica
 * Valida que el string corresponda a un ScientificActivityRole válido
 */
@Documented
@Constraint(validatedBy = ScientificActivityRoleValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidScientificActivityRole {
    
    String message() default "Invalid scientific activity role";
    
    Class<?>[] groups() default {};
    
    Class<? extends Payload>[] payload() default {};
}
