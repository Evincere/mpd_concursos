package ar.gov.mpd.concursobackend.inscription.domain.model.valueobjects;

import ar.gov.mpd.concursobackend.inscription.domain.model.exceptions.InvalidInscriptionException;
import lombok.Value;

@Value
public class InscriptionId {
    Long value;

    public InscriptionId(Long value) {
        if (value == null) {
            throw new InvalidInscriptionException("El ID de inscripción no puede ser nulo");
        }
        if (value <= 0) {
            throw new InvalidInscriptionException("El ID de inscripción debe ser un número positivo");
        }
        this.value = value;
    }
} 