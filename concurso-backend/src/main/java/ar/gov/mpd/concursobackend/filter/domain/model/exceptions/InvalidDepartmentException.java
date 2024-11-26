package ar.gov.mpd.concursobackend.filter.domain.model.exceptions;

public class InvalidDepartmentException extends RuntimeException {
    public InvalidDepartmentException(String message) {
        super(message);
    }
} 