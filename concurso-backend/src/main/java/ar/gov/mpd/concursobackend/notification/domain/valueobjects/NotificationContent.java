package ar.gov.mpd.concursobackend.notification.domain.valueobjects;

import ar.gov.mpd.concursobackend.notification.domain.exception.InvalidNotificationContentException;
import lombok.Value;

@Value
public class NotificationContent {
    String value;

    public NotificationContent(String value) {
        if (value == null || value.trim().isEmpty()) {
            throw new InvalidNotificationContentException("El contenido de la notificación no puede estar vacío");
        }
        if (value.length() > 5000) {
            throw new InvalidNotificationContentException("El contenido de la notificación no puede exceder los 5000 caracteres");
        }
        this.value = value;
    }
}
