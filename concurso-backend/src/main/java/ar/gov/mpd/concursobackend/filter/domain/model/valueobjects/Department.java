package ar.gov.mpd.concursobackend.filter.domain.model.valueobjects;

import ar.gov.mpd.concursobackend.filter.domain.model.exceptions.InvalidDepartmentException;
import lombok.Value;

@Value
public class Department {
    String value;

    public Department(String value) {
        if (value == null || value.trim().isEmpty()) {
            throw new InvalidDepartmentException("El departamento no puede ser nulo o vacío");
        }
        this.value = value;
    }
} 