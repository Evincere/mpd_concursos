package ar.gov.mpd.concursobackend.notification.application.command;

import ar.gov.mpd.concursobackend.notification.domain.enums.AcknowledgementLevel;
import ar.gov.mpd.concursobackend.notification.domain.enums.NotificationStatus;
import ar.gov.mpd.concursobackend.notification.domain.enums.NotificationType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Builder
@Data
public class NotificationCommand {
    private String userId;
    private String subject;
    private String content;
    private NotificationType type;
    private AcknowledgementLevel acknowledgementLevel;
    private NotificationStatus status;
    private LocalDateTime sentAt;

    @Builder.Default
    private Map<String, String> metadata = new HashMap<>();
} 