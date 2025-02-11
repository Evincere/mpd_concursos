package ar.gov.mpd.concursobackend.notification.application.port.in;

import ar.gov.mpd.concursobackend.notification.application.dto.NotificationResponse;
import java.util.List;

public interface GetUserNotificationsUseCase {
    List<NotificationResponse> getUserNotifications();
}
