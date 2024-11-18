package ar.gov.mpd.concursobackend.auth.domain.exception;

public class UserDniAlreadyExistsException extends RuntimeException {
    private static final long serialVersionUID = 1L;
    
    public UserDniAlreadyExistsException(String message) {
        super(message);
    }
} 