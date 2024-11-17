package ar.gov.mpd.concursobackend.auth.domain.valueObject.user;

import ar.gov.mpd.concursobackend.auth.domain.exception.InvalidCuitException;

public class UserCuit {
    private final String cuit;
    private final String dni;

    public UserCuit(String cuit, String dni) {
        validateCuit(cuit, dni);
        this.cuit = cuit;
        this.dni = dni;
    }

    private void validateCuit(String cuit, String dni) {
        // Verificación de longitud
        if (cuit.length() != 11) {
            throw new InvalidCuitException("El CUIT debe tener 11 caracteres.");
        }
        
        // Verificación de formato
        if (!cuit.matches("\\d{2}\\d{8}\\d")) {
            throw new InvalidCuitException("El CUIT debe tener el formato correcto.");
        }

        // Verificación de que los 8 números coincidan con el DNI
        String cuitDniPart = cuit.substring(2, 10);
        if (!cuitDniPart.equals(dni)) {
            throw new InvalidCuitException("Los números del CUIT no coinciden con el DNI.");
        }
    }

    public String value() {
        return this.cuit;
    }

}
