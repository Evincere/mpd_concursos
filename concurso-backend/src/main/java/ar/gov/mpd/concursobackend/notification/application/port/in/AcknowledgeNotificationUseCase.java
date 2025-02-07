package ar.gov.mpd.concursobackend.notification.application.port.in;

import ar.gov.mpd.concursobackend.notification.application.dto.NotificationAcknowledgementRequest;
import ar.gov.mpd.concursobackend.notification.application.dto.NotificationResponse;

public interface AcknowledgeNotificationUseCase {
    NotificationResponse acknowledgeNotification(NotificationAcknowledgementRequest request);
}
