package ar.gov.mpd.concursobackend.auth.domain.valueObject.user;

import ar.gov.mpd.concursobackend.auth.domain.exception.ValidationException;

import java.time.LocalDateTime;

public class UserCreatedAt {
    private final LocalDateTime createdAt;

    public UserCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
        this.ensuranceIsValid();
    }

    private void ensuranceIsValid() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime maxFutureDate = now.plusDays(1);

        if (this.createdAt.isAfter(maxFutureDate)) {
            throw new ValidationException("La fecha de creación no puede ser más de 1 día en el futuro");
        }
    }

    public LocalDateTime value() {
        return createdAt;
    }
}
