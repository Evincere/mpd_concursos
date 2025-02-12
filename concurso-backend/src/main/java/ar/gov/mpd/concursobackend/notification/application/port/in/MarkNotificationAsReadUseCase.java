package ar.gov.mpd.concursobackend.notification.application.port.in;

import ar.gov.mpd.concursobackend.notification.application.dto.NotificationResponse;
import java.util.UUID;

public interface MarkNotificationAsReadUseCase {
    NotificationResponse markAsRead(UUID notificationId);
}