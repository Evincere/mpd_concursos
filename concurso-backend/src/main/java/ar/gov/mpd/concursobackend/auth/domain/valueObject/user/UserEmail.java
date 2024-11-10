package ar.gov.mpd.concursobackend.auth.domain.valueObject.user;

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
            throw new IllegalArgumentException("Email cannot be null or empty");
        }

        if (!email.contains("@") || !email.contains(".")) {
            throw new IllegalArgumentException("Format email not valid");
        }
    }

    public String value() {
        return email;
    }
}
