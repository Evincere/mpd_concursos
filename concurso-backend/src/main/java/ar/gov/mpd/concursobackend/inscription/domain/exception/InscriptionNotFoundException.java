package ar.gov.mpd.concursobackend.inscription.domain.exception;

/**
 * Exception thrown when an inscription is not found or user doesn't have permission to access it
 */
public class InscriptionNotFoundException extends RuntimeException {
    
    public InscriptionNotFoundException(String message) {
        super(message);
    }
    
    public InscriptionNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}
