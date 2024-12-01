package ar.gov.mpd.concursobackend.inscription.domain.model.valueobjects;

import ar.gov.mpd.concursobackend.inscription.domain.model.exceptions.InvalidInscriptionException;
import lombok.Value;

import java.util.UUID;

@Value
public class UserId {
    UUID value;

    public UserId(UUID value) {
        if (value == null) {
            throw new InvalidInscriptionException("El ID del usuario no puede ser nulo");
        }
        this.value = value;
    }
}