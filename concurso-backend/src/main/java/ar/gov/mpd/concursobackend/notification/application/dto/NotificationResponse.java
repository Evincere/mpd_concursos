package ar.gov.mpd.concursobackend.notification.application.dto;

import ar.gov.mpd.concursobackend.notification.domain.enums.AcknowledgementLevel;
import ar.gov.mpd.concursobackend.notification.domain.enums.NotificationStatus;
import ar.gov.mpd.concursobackend.notification.domain.enums.SignatureType;
import ar.gov.mpd.concursobackend.notification.domain.enums.NotificationType;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.Map;

@Data
@Builder
public class NotificationResponse {
    private UUID id;
    private UUID recipientId;
    private String subject;
    private String content;
    private NotificationStatus status;
    private LocalDateTime sentAt;
    private LocalDateTime readAt;
    private LocalDateTime acknowledgedAt;
    private AcknowledgementLevel acknowledgementLevel;
    private SignatureType signatureType;
    private String signatureValue;
    private Map<String, String> signatureMetadata;
    private NotificationType type;
}
