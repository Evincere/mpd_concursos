package ar.gov.mpd.concursobackend.auth.domain.valueObject.user;

public class UserUsername {
    private final String username;

    public UserUsername(String username) {
        this.username = username;
        this.ensureIsValid();
    }

    private void ensureIsValid() {
        if (username == null || username.isEmpty()) {
            throw new IllegalArgumentException("El nombre de usuario no puede ser nulo o vacío");
        }
        if (username.length() < 3) {
            throw new IllegalArgumentException("El nombre de usuario debe tener al menos 3 caracteres");
        }
    }

    public String value() {
        return username;
    }
}
