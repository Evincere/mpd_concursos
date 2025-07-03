package ar.gov.mpd.concursobackend.auth.application.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.util.regex.Pattern;

/**
 * Implementación del validador para números de teléfono argentinos
 */
public class ValidArgentinePhoneValidator implements ConstraintValidator<ValidArgentinePhone, String> {
    
    // Patrones para diferentes formatos de teléfonos argentinos
    private static final Pattern[] PHONE_PATTERNS = {
        // +54 9 11 1234-5678 (celular con código de país completo)
        Pattern.compile("^\\+54\\s?9\\s?\\d{2,4}\\s?\\d{4}[\\-\\s]?\\d{4}$"),
        
        // +54 11 1234-5678 (fijo con código de país)
        Pattern.compile("^\\+54\\s?\\d{2,4}\\s?\\d{4}[\\-\\s]?\\d{4}$"),
        
        // 54 9 11 1234-5678 (celular sin +)
        Pattern.compile("^54\\s?9\\s?\\d{2,4}\\s?\\d{4}[\\-\\s]?\\d{4}$"),
        
        // 54 11 1234-5678 (fijo sin +)
        Pattern.compile("^54\\s?\\d{2,4}\\s?\\d{4}[\\-\\s]?\\d{4}$"),
        
        // 011 1234-5678 (fijo con código de área)
        Pattern.compile("^0\\d{2,4}\\s?\\d{4}[\\-\\s]?\\d{4}$"),
        
        // 15 1234-5678 (celular formato corto)
        Pattern.compile("^15\\s?\\d{4}[\\-\\s]?\\d{4}$"),
        
        // 1234-5678 (formato local)
        Pattern.compile("^\\d{4}[\\-\\s]?\\d{4}$"),
        
        // 11 1234-5678 (con código de área sin 0)
        Pattern.compile("^\\d{2,4}\\s?\\d{4}[\\-\\s]?\\d{4}$"),
        
        // Formatos con paréntesis: (011) 1234-5678
        Pattern.compile("^\\(\\d{2,4}\\)\\s?\\d{4}[\\-\\s]?\\d{4}$"),
        
        // Formato celular: 9 11 1234-5678
        Pattern.compile("^9\\s?\\d{2,4}\\s?\\d{4}[\\-\\s]?\\d{4}$")
    };
    
    // Patrón para validar solo caracteres permitidos
    private static final Pattern ALLOWED_CHARS_PATTERN = 
        Pattern.compile("^[0-9\\s\\-\\(\\)\\+]+$");
    
    private boolean allowEmpty;
    private boolean requireCountryCode;
    
    @Override
    public void initialize(ValidArgentinePhone constraintAnnotation) {
        this.allowEmpty = constraintAnnotation.allowEmpty();
        this.requireCountryCode = constraintAnnotation.requireCountryCode();
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
        
        // Validar longitud mínima y máxima
        if (trimmedValue.length() < 7 || trimmedValue.length() > 20) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(
                "El teléfono debe tener entre 7 y 20 caracteres"
            ).addConstraintViolation();
            return false;
        }
        
        // Validar caracteres permitidos
        if (!ALLOWED_CHARS_PATTERN.matcher(trimmedValue).matches()) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(
                "El teléfono solo puede contener números, espacios, guiones, paréntesis y signo más"
            ).addConstraintViolation();
            return false;
        }
        
        // Si se requiere código de país, validar que esté presente
        if (requireCountryCode && !trimmedValue.startsWith("+54") && !trimmedValue.startsWith("54")) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(
                "El teléfono debe incluir el código de país argentino (+54 o 54)"
            ).addConstraintViolation();
            return false;
        }
        
        // Validar contra los patrones de formato
        boolean isValidFormat = false;
        for (Pattern pattern : PHONE_PATTERNS) {
            if (pattern.matcher(trimmedValue).matches()) {
                isValidFormat = true;
                break;
            }
        }
        
        if (!isValidFormat) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(
                "El formato del teléfono argentino no es válido. " +
                "Ejemplos válidos: +54 11 1234-5678, 011 1234-5678, 15 1234-5678"
            ).addConstraintViolation();
            return false;
        }
        
        // Validar que tenga suficientes dígitos (sin contar espacios, guiones, etc.)
        String digitsOnly = trimmedValue.replaceAll("[^0-9]", "");
        if (digitsOnly.length() < 7 || digitsOnly.length() > 15) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(
                "El teléfono debe tener entre 7 y 15 dígitos"
            ).addConstraintViolation();
            return false;
        }
        
        return true;
    }
}
