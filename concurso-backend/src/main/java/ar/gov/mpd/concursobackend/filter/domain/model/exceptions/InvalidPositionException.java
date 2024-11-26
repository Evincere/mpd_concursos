package ar.gov.mpd.concursobackend.filter.domain.model.exceptions;

public class InvalidPositionException extends RuntimeException {
    public InvalidPositionException(String message) {
        super(message);
    }
} 