package ar.gov.mpd.concursobackend.inscription.domain.model.valueobjects;

import lombok.Value;
import java.util.UUID;

@Value
public class UserId {
    UUID value;

    public UserId(UUID value) {
        if (value == null) {
            throw new IllegalArgumentException("UserId no puede ser nulo");
        }
        this.value = value;
    }
}