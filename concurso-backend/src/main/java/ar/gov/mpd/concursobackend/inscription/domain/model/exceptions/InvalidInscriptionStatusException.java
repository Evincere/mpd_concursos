package ar.gov.mpd.concursobackend.inscription.domain.model.exceptions;

public class InvalidInscriptionStatusException extends RuntimeException {
    public InvalidInscriptionStatusException(String message) {
        super(message);
    }
} 