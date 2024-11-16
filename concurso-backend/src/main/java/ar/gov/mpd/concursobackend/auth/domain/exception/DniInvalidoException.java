package ar.gov.mpd.concursobackend.auth.domain.exception;

public class DniInvalidoException extends RuntimeException {
    public DniInvalidoException(String message) {
        super(message);
    }
} 