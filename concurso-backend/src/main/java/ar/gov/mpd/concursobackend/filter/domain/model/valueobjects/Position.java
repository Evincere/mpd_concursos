package ar.gov.mpd.concursobackend.filter.domain.model.valueobjects;

import lombok.Value;

@Value
public class Position {
    String value;

    public Position(String value) {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException("Position cannot be null or empty");
        }
        this.value = value;
    }
} 