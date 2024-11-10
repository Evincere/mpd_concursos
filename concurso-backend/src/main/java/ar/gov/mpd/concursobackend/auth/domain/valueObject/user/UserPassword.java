package ar.gov.mpd.concursobackend.auth.domain.valueObject.user;

import lombok.Data;

@Data
public class UserPassword {
    private final String password;

    public UserPassword(String password) {
        this.password = password;
        this.ensureIsValid();
    }

    private void ensureIsValid() {
        if (this.password == null || this.password.isEmpty()) {
            throw new IllegalArgumentException("Password is empty");
        }

        if (this.password.length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters");
        }
    }

    public String value() {
        return password;
    }
}
