package ar.gov.mpd.concursobackend.notification.infrastructure.persistence;

import ar.gov.mpd.concursobackend.notification.domain.model.Notification;
import ar.gov.mpd.concursobackend.notification.domain.valueobjects.NotificationContent;
import ar.gov.mpd.concursobackend.notification.domain.valueobjects.NotificationId;
import ar.gov.mpd.concursobackend.notification.domain.valueobjects.NotificationSubject;
import ar.gov.mpd.concursobackend.auth.domain.port.IUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class NotificationPersistenceMapper {

    private final IUserRepository userRepository;

    public NotificationJpaEntity toJpaEntity(Notification notification) {
        return NotificationJpaEntity.builder()
            .id(notification.getId().getValue())
            .recipientId(notification.getRecipient().getId().value())
            .subject(notification.getSubject().getValue())
            .content(notification.getContent().getValue())
            .status(notification.getStatus())
            .sentAt(notification.getSentAt())
            .readAt(notification.getReadAt())
            .acknowledgedAt(notification.getAcknowledgedAt())
            .acknowledgementSignature(notification.getAcknowledgementSignature())
            .build();
    }

    public Notification toDomainEntity(NotificationJpaEntity entity) {
        var recipient = userRepository.findById(entity.getRecipientId())
            .orElseThrow(() -> new IllegalStateException("Usuario no encontrado"));

        var notification = new Notification(
            new NotificationId(entity.getId()),
            recipient,
            new NotificationSubject(entity.getSubject()),
            new NotificationContent(entity.getContent())
        );

        // Restaurar el estado
        if (entity.getSentAt() != null) {
            notification.send();
        }
        if (entity.getReadAt() != null) {
            notification.markAsRead();
        }
        if (entity.getAcknowledgedAt() != null) {
            notification.acknowledge(entity.getAcknowledgementSignature());
        }

        return notification;
    }
}
