package ar.gov.mpd.concursobackend.education.application.validation;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

/**
 * Validación personalizada para estados de educación
 * Valida que el string corresponda a un EducationStatus válido
 */
@Documented
@Constraint(validatedBy = EducationStatusValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidEducationStatus {
    
    String message() default "Invalid education status";
    
    Class<?>[] groups() default {};
    
    Class<? extends Payload>[] payload() default {};
}
