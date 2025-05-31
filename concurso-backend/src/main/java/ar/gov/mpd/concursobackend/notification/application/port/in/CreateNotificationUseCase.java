package ar.gov.mpd.concursobackend.notification.application.port.in;

import ar.gov.mpd.concursobackend.notification.application.dto.NotificationResponse;
import ar.gov.mpd.concursobackend.notification.domain.enums.NotificationType;

/**
 * Use case for creating a notification
 */
public interface CreateNotificationUseCase {
    /**
     * Create a notification for a user
     *
     * @param username The username of the recipient
     * @param content The content of the notification
     * @param type The type of the notification
     * @return The created notification
     */
    NotificationResponse createNotification(String username, String content, NotificationType type);
}
