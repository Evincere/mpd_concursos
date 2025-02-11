package ar.gov.mpd.concursobackend.notification.domain.valueobjects;

import ar.gov.mpd.concursobackend.notification.domain.exception.InvalidNotificationSubjectException;
import lombok.Value;

@Value
public class NotificationSubject {
    String value;

    public NotificationSubject(String value) {
        if (value == null || value.trim().isEmpty()) {
            throw new InvalidNotificationSubjectException("El asunto de la notificación no puede estar vacío");
        }
        if (value.length() > 200) {
            throw new InvalidNotificationSubjectException("El asunto de la notificación no puede exceder los 200 caracteres");
        }
        this.value = value;
    }
}
