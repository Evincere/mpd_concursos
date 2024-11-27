package ar.gov.mpd.concursobackend.inscription.domain.model.valueobjects;

import ar.gov.mpd.concursobackend.inscription.domain.model.exceptions.InvalidInscriptionException;
import lombok.Value;

@Value
public class UserId {
    Long value;

    public UserId(Long value) {
        if (value == null) {
            throw new InvalidInscriptionException("El ID del usuario no puede ser nulo");
        }
        if (value <= 0) {
            throw new InvalidInscriptionException("El ID del usuario debe ser un número positivo");
        }
        this.value = value;
    }
} 