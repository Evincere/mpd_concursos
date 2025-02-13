package ar.gov.mpd.concursobackend.notification.application.command;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import ar.gov.mpd.concursobackend.notification.domain.enums.NotificationType;
import ar.gov.mpd.concursobackend.notification.domain.enums.AcknowledgementLevel;
import ar.gov.mpd.concursobackend.notification.domain.enums.NotificationStatus;

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