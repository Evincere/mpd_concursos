package ar.gov.mpd.concursobackend.notification.application.port.in;

import ar.gov.mpd.concursobackend.notification.application.dto.NotificationRequest;
import ar.gov.mpd.concursobackend.notification.application.dto.NotificationResponse;

public interface SendNotificationUseCase {
    NotificationResponse sendNotification(NotificationRequest request);
}
