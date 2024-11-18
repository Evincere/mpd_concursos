package ar.gov.mpd.concursobackend.auth.domain.exception;

public class NombreObligatorioException extends RuntimeException {
    private static final long serialVersionUID = 1L;
    
    public NombreObligatorioException(String message) {
        super(message);
    }
} 