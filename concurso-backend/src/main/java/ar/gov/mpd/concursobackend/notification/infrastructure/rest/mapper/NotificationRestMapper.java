package ar.gov.mpd.concursobackend.notification.infrastructure.rest.mapper;

import ar.gov.mpd.concursobackend.notification.application.dto.NotificationRequest;
import ar.gov.mpd.concursobackend.notification.application.dto.NotificationResponse;
import ar.gov.mpd.concursobackend.notification.domain.enums.SignatureType;
import ar.gov.mpd.concursobackend.notification.domain.model.Notification;
import org.springframework.stereotype.Component;

@Component
public class NotificationRestMapper {

    public Notification toDomainEntity(NotificationRequest request) {
        if (request == null) {
            return null;
        }

        return Notification.builder()
                .subject(request.getSubject())
                .content(request.getContent())
                .acknowledgementLevel(request.getAcknowledgementLevel())
                .build();
    }

    public NotificationResponse toResponse(Notification notification) {
        if (notification == null) {
            return null;
        }

        return NotificationResponse.builder()
                .id(notification.getId())
                .recipientId(notification.getRecipientId())
                .subject(notification.getSubject())
                .content(notification.getContent())
                .status(notification.getStatus())
                .sentAt(notification.getSentAt())
                .readAt(notification.getReadAt())
                .acknowledgedAt(notification.getAcknowledgedAt())
                .acknowledgementLevel(notification.getAcknowledgementLevel())
                .signatureType(
                        notification.getSignatureType() != null ? SignatureType.valueOf(notification.getSignatureType())
                                : null)
                .signatureValue(notification.getSignatureValue())
                .signatureMetadata(notification.getSignatureMetadata())
                .build();
    }
}
