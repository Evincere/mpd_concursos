package ar.gov.mpd.concursobackend.filter.domain.model.exceptions;

public class InvalidContestIdException extends RuntimeException {
    public InvalidContestIdException(String message) {
        super(message);
    }
} 