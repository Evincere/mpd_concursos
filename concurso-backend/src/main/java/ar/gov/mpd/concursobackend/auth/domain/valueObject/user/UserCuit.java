package ar.gov.mpd.concursobackend.auth.domain.valueObject.user;

import ar.gov.mpd.concursobackend.auth.domain.exception.InvalidCuitException;

public class UserCuit {
    private final String value;

    public UserCuit(String cuit) {
        validateCuit(cuit);
        this.value = cuit;
    }

    private void validateCuit(String cuit) {
        if (cuit == null || cuit.length() != 11) {
            throw new InvalidCuitException("El CUIT debe tener 11 dígitos.");
        }

        if (!cuit.matches("\\d{11}")) {
            throw new InvalidCuitException("El CUIT solo debe contener números.");
        }

        String prefix = cuit.substring(0, 2);
        if (!prefix.equals("20") && !prefix.equals("23") && !prefix.equals("24") &&
            !prefix.equals("27") && !prefix.equals("30") && !prefix.equals("33") &&
            !prefix.equals("34")) {
            throw new InvalidCuitException("El prefijo del CUIT no es válido.");
        }

        if (!isValidCuitVerifier(cuit)) {
            throw new InvalidCuitException("El dígito verificador del CUIT es inválido.");
        }
    }

    private boolean isValidCuitVerifier(String cuit) {
        int[] multipliers = {5, 4, 3, 2, 7, 6, 5, 4, 3, 2};

        int sum = 0;
        for (int i = 0; i < 10; i++) {
            sum += Character.getNumericValue(cuit.charAt(i)) * multipliers[i];
        }

        int remainder = sum % 11;
        int verifier;
        String prefix = cuit.substring(0, 2);

        if (remainder == 0) {
            verifier = 0;
        } else if (remainder == 1) {
            // Si el prefijo es de persona física (20, 23, 24, 27)
            if (prefix.equals("20") || prefix.equals("23") || prefix.equals("24") || prefix.equals("27")) {
                verifier = 9;
            } else {
                verifier = 4;
            }
        } else {
            verifier = 11 - remainder;
        }

        return verifier == Character.getNumericValue(cuit.charAt(10));
    }

    public String value() {
        return value;
    }

    @Override
    public String toString() {
        return value;
    }
}
