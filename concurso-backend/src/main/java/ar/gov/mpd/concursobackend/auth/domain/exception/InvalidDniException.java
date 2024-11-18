package ar.gov.mpd.concursobackend.auth.domain.exception;

public class InvalidDniException extends RuntimeException { 
    private static final long serialVersionUID = 1L;
    
    public InvalidDniException(String message) {
        super(message);
    }
} 