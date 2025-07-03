package ar.gov.mpd.concursobackend.education.application.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.*;

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
