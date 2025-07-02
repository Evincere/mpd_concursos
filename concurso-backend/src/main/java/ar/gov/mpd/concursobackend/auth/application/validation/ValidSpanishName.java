package ar.gov.mpd.concursobackend.auth.application.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Validador personalizado para nombres en español
 * Permite letras, espacios, acentos, ñ, guiones y apostrofes
 * Valida formato correcto sin espacios múltiples o caracteres al inicio/final
 */
@Constraint(validatedBy = ValidSpanishNameValidator.class)
@Target({ ElementType.FIELD, ElementType.PARAMETER })
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidSpanishName {
    String message() default "El nombre solo puede contener letras, espacios, acentos, ñ, guiones y apostrofes";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
    
    /**
     * Longitud mínima del nombre
     */
    int minLength() default 2;
    
    /**
     * Longitud máxima del nombre
     */
    int maxLength() default 50;
    
    /**
     * Si se permite que el nombre esté vacío
     */
    boolean allowEmpty() default false;
}
