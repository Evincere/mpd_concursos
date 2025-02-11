package ar.gov.mpd.concursobackend.notification.domain.valueobjects;

import lombok.Value;
import java.util.UUID;

@Value
public class NotificationId {
    UUID value;

    public NotificationId() {
        this.value = UUID.randomUUID();
    }

    public NotificationId(UUID value) {
        if (value == null) {
            throw new IllegalArgumentException("El ID de la notificación no puede ser nulo");
        }
        this.value = value;
    }
}
