package ar.gov.mpd.concursobackend.filter.domain.model.valueobjects;

import ar.gov.mpd.concursobackend.filter.domain.model.exceptions.InvalidContestIdException;
import lombok.Value;

@Value
public class ContestId {
    Long value;

    public ContestId(Long value) {
        if (value == null) {
            throw new InvalidContestIdException("El ID del concurso no puede ser nulo");
        }
        this.value = value;
    }
} 