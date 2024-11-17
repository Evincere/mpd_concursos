package ar.gov.mpd.concursobackend.auth.domain.exception;

public class InvalidDniException extends RuntimeException {
    public InvalidDniException(String message) {
        super(message);
    }
} 