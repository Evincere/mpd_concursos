package ar.gov.mpd.concursobackend.notification.infrastructure.persistence.mapper;

import ar.gov.mpd.concursobackend.notification.domain.model.Notification;
import ar.gov.mpd.concursobackend.notification.infrastructure.persistence.entity.NotificationJpaEntity;
import org.springframework.stereotype.Component;

@Component
public class NotificationPersistenceMapper {

    public NotificationJpaEntity toJpaEntity(Notification notification) {
        if (notification == null) {
            return null;
        }

        return NotificationJpaEntity.builder()
                .id(notification.getId())
                .recipientId(notification.getRecipientId())
                .subject(notification.getSubject())
                .content(notification.getContent())
                .status(notification.getStatus())
                .sentAt(notification.getSentAt())
                .readAt(notification.getReadAt())
                .acknowledgedAt(notification.getAcknowledgedAt())
                .acknowledgementSignature(notification.getAcknowledgementSignature())
                .version(notification.getVersion())
                .build();
    }

    public Notification toDomainEntity(NotificationJpaEntity entity) {
        if (entity == null) {
            return null;
        }

        return Notification.builder()
                .id(entity.getId())
                .recipientId(entity.getRecipientId())
                .subject(entity.getSubject())
                .content(entity.getContent())
                .status(entity.getStatus())
                .sentAt(entity.getSentAt())
                .readAt(entity.getReadAt())
                .acknowledgedAt(entity.getAcknowledgedAt())
                .acknowledgementSignature(entity.getAcknowledgementSignature())
                .version(entity.getVersion())
                .build();
    }
}
