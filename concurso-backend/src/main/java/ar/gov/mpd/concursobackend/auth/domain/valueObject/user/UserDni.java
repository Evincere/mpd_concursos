package ar.gov.mpd.concursobackend.auth.domain.valueObject.user;

import ar.gov.mpd.concursobackend.auth.domain.exception.InvalidDniException;

public class UserDni {
    private String dni;

    public UserDni(String dni) {
        this.dni = dni;
        this.ensureIsValid();
    }

    private void ensureIsValid() {
        if (dni == null || dni.isEmpty()) {
            throw new InvalidDniException("DNI no puede estar vacío");
        }
        if (dni.length() != 8) {
            throw new InvalidDniException("DNI debe tener 8 caracteres");
        }
       
    }

    public String value() {
        return dni;
    }

    
}
