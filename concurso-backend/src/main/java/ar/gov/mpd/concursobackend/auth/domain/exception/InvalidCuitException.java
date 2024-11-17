package ar.gov.mpd.concursobackend.auth.domain.exception;

public class InvalidCuitException extends RuntimeException {
    public InvalidCuitException(String message) {
        super(message);
    }
} 