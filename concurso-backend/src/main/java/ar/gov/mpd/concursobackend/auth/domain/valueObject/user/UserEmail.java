package ar.gov.mpd.concursobackend.auth.domain.valueObject.user;

import ar.gov.mpd.concursobackend.auth.domain.exception.InvalidEmailException;
import lombok.Data;

@Data
public class UserEmail {

    private final String email;

    public UserEmail(String email) {
        this.email = email;
        this.ensureIsValid();
    }

    private void ensureIsValid() {
        if (email == null || email.isEmpty()) {
            throw new InvalidEmailException("El email no puede estar vacío");
        }

        if (!email.contains("@") || !email.contains(".")) {
            throw new InvalidEmailException("El formato del email no es válido");
        }
    }

    public String value() {
        return email;
    }
}
