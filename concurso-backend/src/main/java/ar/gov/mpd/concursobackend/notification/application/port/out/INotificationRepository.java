package ar.gov.mpd.concursobackend.notification.application.port.out;

import ar.gov.mpd.concursobackend.notification.domain.model.Notification;

import java.util.List;
import java.util.UUID;

public interface INotificationRepository {
    Notification save(Notification notification);
    List<Notification> findByRecipientId(UUID recipientId);
    Notification findById(UUID id);
    void deleteById(UUID id);
    Notification update(Notification notification);
}
