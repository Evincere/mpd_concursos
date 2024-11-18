package ar.gov.mpd.concursobackend.auth.domain.exception;

public class InvalidCuitException extends RuntimeException {    
    private static final long serialVersionUID = 1L;
    
    public InvalidCuitException(String message) {
        super(message);
    }
} 