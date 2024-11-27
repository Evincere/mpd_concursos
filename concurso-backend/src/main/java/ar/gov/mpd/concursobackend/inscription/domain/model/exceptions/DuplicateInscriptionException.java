package ar.gov.mpd.concursobackend.inscription.domain.model.exceptions;

public class DuplicateInscriptionException extends RuntimeException {
    public DuplicateInscriptionException(String message) {
        super(message);
    }
} 