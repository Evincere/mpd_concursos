package ar.gov.mpd.concursobackend.education.application.validation;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

/**
 * Validación personalizada para tipos de actividad científica
 * Valida que el string corresponda a un ScientificActivityType válido
 */
@Documented
@Constraint(validatedBy = ScientificActivityTypeValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidScientificActivityType {
    
    String message() default "Invalid scientific activity type";
    
    Class<?>[] groups() default {};
    
    Class<? extends Payload>[] payload() default {};
}
