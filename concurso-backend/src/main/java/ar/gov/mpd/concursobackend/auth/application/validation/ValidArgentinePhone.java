package ar.gov.mpd.concursobackend.auth.application.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Validador personalizado para números de teléfono argentinos
 * Acepta diferentes formatos válidos para Argentina
 */
@Constraint(validatedBy = ValidArgentinePhoneValidator.class)
@Target({ ElementType.FIELD, ElementType.PARAMETER })
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidArgentinePhone {
    String message() default "El formato del teléfono argentino no es válido";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
    
    /**
     * Si se permite que el teléfono esté vacío
     */
    boolean allowEmpty() default true;
    
    /**
     * Si se requiere código de país
     */
    boolean requireCountryCode() default false;
}
