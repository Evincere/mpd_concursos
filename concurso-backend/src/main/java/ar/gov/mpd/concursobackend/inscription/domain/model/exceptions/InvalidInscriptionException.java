package ar.gov.mpd.concursobackend.inscription.domain.model.exceptions;

public class InvalidInscriptionException extends RuntimeException {
    public InvalidInscriptionException(String message) {
        super(message);
    }
} 