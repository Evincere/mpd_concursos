package ar.gov.mpd.concursobackend.notification.application.dto;

import ar.gov.mpd.concursobackend.notification.domain.enums.NotificationStatus;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

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
    private String acknowledgementSignature;
}
