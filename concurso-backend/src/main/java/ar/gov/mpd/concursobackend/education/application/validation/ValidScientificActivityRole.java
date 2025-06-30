package ar.gov.mpd.concursobackend.education.application.validation;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

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
