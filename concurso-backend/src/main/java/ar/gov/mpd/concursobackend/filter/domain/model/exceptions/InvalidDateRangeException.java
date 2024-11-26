package ar.gov.mpd.concursobackend.filter.domain.model.exceptions;

public class InvalidDateRangeException extends RuntimeException {
    public InvalidDateRangeException(String message) {
        super(message);
    }
} 