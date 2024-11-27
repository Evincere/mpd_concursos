package ar.gov.mpd.concursobackend.inscription.domain.model.exceptions;

public class InscriptionNotFoundException extends RuntimeException {
    public InscriptionNotFoundException(String message) {
        super(message);
    }
} 