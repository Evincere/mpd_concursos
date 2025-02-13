package ar.gov.mpd.concursobackend.inscription.domain.model.valueobjects;

import lombok.Value;
import java.util.UUID;

@Value
public class InscriptionId {
    UUID value;

    public InscriptionId() {
        this.value = UUID.randomUUID();
    }

    public InscriptionId(UUID value) {
        if (value == null) {
            throw new IllegalArgumentException("InscriptionId no puede ser nulo");
        }
        this.value = value;
    }
} 