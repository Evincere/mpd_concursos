package ar.gov.mpd.concursobackend.auth.domain.exception;

public class InvalidRequestException extends RuntimeException {
    private static final long serialVersionUID = 1L;
    
    public InvalidRequestException(String message) {
        super(message);
    }
} 