package ar.gov.mpd.concursobackend.notification.domain.exception;

public class InvalidNotificationContentException extends RuntimeException {
    public InvalidNotificationContentException(String message) {
        super(message);
    }
}
