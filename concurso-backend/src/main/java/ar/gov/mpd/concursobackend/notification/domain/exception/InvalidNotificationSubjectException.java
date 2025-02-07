package ar.gov.mpd.concursobackend.notification.domain.exception;

public class InvalidNotificationSubjectException extends RuntimeException {
    public InvalidNotificationSubjectException(String message) {
        super(message);
    }
}
