package ar.gov.mpd.concursobackend.notification.application.mapper;

import ar.gov.mpd.concursobackend.notification.application.dto.NotificationResponse;
import ar.gov.mpd.concursobackend.notification.domain.model.Notification;
import ar.gov.mpd.concursobackend.notification.domain.enums.SignatureType;
import org.springframework.stereotype.Component;

@Component
public class NotificationMapper {

    public NotificationResponse toResponse(Notification notification) {
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
