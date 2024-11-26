package ar.gov.mpd.concursobackend.filter.domain.model.exceptions;

public class InvalidContestFilterException extends RuntimeException {
    public InvalidContestFilterException(String message) {
        super(message);
    }
} 