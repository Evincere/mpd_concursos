package ar.gov.mpd.concursobackend.notification.application.port.in;

import ar.gov.mpd.concursobackend.notification.application.dto.MassNotificationRequest;
import ar.gov.mpd.concursobackend.notification.application.dto.MassNotificationResponse;

/**
 * Use case for sending mass notifications to multiple users
 */
public interface SendMassNotificationUseCase {
    /**
     * Send a notification to multiple users
     * @param request The mass notification request
     * @return The response containing information about the sent notifications
     */
    MassNotificationResponse sendMassNotification(MassNotificationRequest request);
}
