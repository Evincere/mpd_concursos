package ar.gov.mpd.concursobackend.education.application.validation;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

/**
 * Validación personalizada para tipos de educación
 * Valida que el string corresponda a un EducationType válido
 */
@Documented
@Constraint(validatedBy = EducationTypeValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidEducationType {
    
    String message() default "Invalid education type";
    
    Class<?>[] groups() default {};
    
    Class<? extends Payload>[] payload() default {};
}
