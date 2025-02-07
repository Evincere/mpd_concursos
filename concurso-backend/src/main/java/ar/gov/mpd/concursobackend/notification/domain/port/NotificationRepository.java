package ar.gov.mpd.concursobackend.notification.domain.port;

import ar.gov.mpd.concursobackend.notification.domain.model.Notification;
import ar.gov.mpd.concursobackend.notification.domain.valueobjects.NotificationId;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface NotificationRepository {
    Notification save(Notification notification);
    Optional<Notification> findById(NotificationId id);
    List<Notification> findByRecipientId(UUID recipientId);
    List<Notification> findPendingNotifications();
}
