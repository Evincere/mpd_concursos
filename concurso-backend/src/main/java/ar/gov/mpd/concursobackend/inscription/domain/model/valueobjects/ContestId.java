package ar.gov.mpd.concursobackend.inscription.domain.model.valueobjects;

import lombok.Value;

@Value
public class ContestId {
    Long value;

    public ContestId(Long value) {
        if (value == null) {
            throw new IllegalArgumentException("ContestId no puede ser nulo");
        }
        this.value = value;
    }
} 