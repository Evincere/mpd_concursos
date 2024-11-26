package ar.gov.mpd.concursobackend.filter.domain.model.exceptions;

public class InvalidContestStatusException extends RuntimeException {
    public InvalidContestStatusException(String message) {
        super(message);
    }
} 