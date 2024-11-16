package ar.gov.mpd.concursobackend.auth.domain.exception;

public class InvalidRequestException extends RuntimeException {
    public InvalidRequestException(String message) {
        super(message);
    }
} 