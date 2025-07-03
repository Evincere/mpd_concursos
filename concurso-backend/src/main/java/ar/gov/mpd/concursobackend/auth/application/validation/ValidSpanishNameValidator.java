package ar.gov.mpd.concursobackend.auth.application.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.util.regex.Pattern;

/**
 * Implementación del validador para nombres en español
 */
public class ValidSpanishNameValidator implements ConstraintValidator<ValidSpanishName, String> {
    
    private static final Pattern SPANISH_NAME_PATTERN = 
        Pattern.compile("^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\\s'\\-]+$");
    
    private static final Pattern MULTIPLE_SPACES_PATTERN = 
        Pattern.compile("\\s{2,}");
    
    private static final Pattern INVALID_START_END_PATTERN = 
        Pattern.compile("^[\\s'\\-]|[\\s'\\-]$");
    
    private int minLength;
    private int maxLength;
    private boolean allowEmpty;
    
    @Override
    public void initialize(ValidSpanishName constraintAnnotation) {
        this.minLength = constraintAnnotation.minLength();
        this.maxLength = constraintAnnotation.maxLength();
        this.allowEmpty = constraintAnnotation.allowEmpty();
    }
    
    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        // Permitir valores nulos (usar @NotNull por separado si es requerido)
        if (value == null) {
            return true;
        }
        
        // Permitir valores vacíos si está configurado
        if (value.trim().isEmpty()) {
            return allowEmpty;
        }
        
        String trimmedValue = value.trim();
        
        // Validar longitud
        if (trimmedValue.length() < minLength || trimmedValue.length() > maxLength) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(
                String.format("El nombre debe tener entre %d y %d caracteres", minLength, maxLength)
            ).addConstraintViolation();
            return false;
        }
        
        // Validar caracteres permitidos
        if (!SPANISH_NAME_PATTERN.matcher(trimmedValue).matches()) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(
                "El nombre solo puede contener letras, espacios, acentos, ñ, guiones y apostrofes"
            ).addConstraintViolation();
            return false;
        }
        
        // Validar espacios múltiples
        if (MULTIPLE_SPACES_PATTERN.matcher(trimmedValue).find()) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(
                "El nombre no puede contener espacios múltiples consecutivos"
            ).addConstraintViolation();
            return false;
        }
        
        // Validar que no empiece o termine con espacios, guiones o apostrofes
        if (INVALID_START_END_PATTERN.matcher(trimmedValue).find()) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(
                "El nombre no puede empezar o terminar con espacios, guiones o apostrofes"
            ).addConstraintViolation();
            return false;
        }
        
        // Validar que no sea solo espacios, guiones o apostrofes
        if (trimmedValue.replaceAll("[\\s'\\-]", "").isEmpty()) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(
                "El nombre debe contener al menos una letra"
            ).addConstraintViolation();
            return false;
        }
        
        return true;
    }
}
