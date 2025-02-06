package ar.gov.mpd.concursobackend.auth.domain.valueObject.user;

import ar.gov.mpd.concursobackend.auth.domain.exception.InvalidCuitException;

public class UserCuit {
    private final String value;

    public UserCuit(String cuit) {
        validateCuit(cuit);
        this.value = cuit;
    }

    private void validateCuit(String cuit) {
        if (cuit == null || cuit.trim().isEmpty()) {
            throw new InvalidCuitException("El CUIT no puede estar vacío.");
        }

        // Verificación de longitud
        if (cuit.length() != 11) {
            throw new InvalidCuitException("El CUIT debe tener 11 caracteres.");
        }
        
        // Verificación de formato
        if (!cuit.matches("\\d{2}\\d{8}\\d")) {
            throw new InvalidCuitException("El CUIT debe tener el formato correcto (solo números).");
        }

        // Verificar dígito verificador
        if (!isValidCuitVerifier(cuit)) {
            throw new InvalidCuitException("El dígito verificador del CUIT es inválido.");
        }
    }

    private boolean isValidCuitVerifier(String cuit) {
        int[] mult = {5, 4, 3, 2, 7, 6, 5, 4, 3, 2};
        int[] numbers = cuit.chars()
                .map(Character::getNumericValue)
                .toArray();
        
        int sum = 0;
        for (int i = 0; i < mult.length; i++) {
            sum += numbers[i] * mult[i];
        }
        
        int mod11 = sum % 11;
        int verifier = 11 - mod11;
        
        if (verifier == 11) {
            verifier = 0;
        } else if (verifier == 10) {
            verifier = 9;
        }
        
        return verifier == numbers[10];
    }

    public String value() {
        return value;
    }

    @Override
    public String toString() {
        return value;
    }
}
