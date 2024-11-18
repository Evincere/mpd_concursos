package ar.gov.mpd.concursobackend.auth.domain.exception;

public class InvalidEmailException extends RuntimeException {
    private static final long serialVersionUID = 1L;
    
    public InvalidEmailException(String message) {
        super(message);
    }
} 