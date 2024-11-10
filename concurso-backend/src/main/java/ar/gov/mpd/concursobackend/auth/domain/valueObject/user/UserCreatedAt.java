package ar.gov.mpd.concursobackend.auth.domain.valueObject.user;

import java.time.LocalDateTime;
import ar.gov.mpd.concursobackend.auth.domain.exception.ValidationException;

public class UserCreatedAt {
    private LocalDateTime createdAt;

    public UserCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
        this.ensuranceIsValid();
    }

    private void ensuranceIsValid() {
        if (this.createdAt.isAfter(LocalDateTime.now())) {
            throw new ValidationException("La fecha de creación no puede ser futura");
        }
    }

    public LocalDateTime value() {
        return createdAt;
    }
}
