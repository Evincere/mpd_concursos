package ar.gov.mpd.concursobackend.notification.application.service;

import ar.gov.mpd.concursobackend.notification.application.dto.NotificationResponse;
import ar.gov.mpd.concursobackend.notification.domain.model.Notification;
import org.springframework.stereotype.Component;

@Component
public class NotificationMapper {
    
    public NotificationResponse toResponse(Notification notification) {
        return NotificationResponse.builder()
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
}
