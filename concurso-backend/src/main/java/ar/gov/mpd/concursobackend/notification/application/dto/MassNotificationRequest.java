package ar.gov.mpd.concursobackend.notification.application.dto;

import ar.gov.mpd.concursobackend.auth.domain.enums.RoleEnum;
import ar.gov.mpd.concursobackend.notification.domain.enums.AcknowledgementLevel;
import ar.gov.mpd.concursobackend.notification.domain.enums.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Request DTO for sending mass notifications to multiple users
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MassNotificationRequest {
    /**
     * List of specific user IDs to send the notification to.
     * If null or empty, the notification will be sent based on roles.
     */
    private List<UUID> recipientIds;

    /**
     * List of roles to send the notification to.
     * If recipientIds is provided, this field is ignored.
     */
    private List<RoleEnum> recipientRoles;

    /**
     * Subject of the notification
     */
    private String subject;

    /**
     * Content of the notification
     */
    private String content;

    /**
     * Type of notification
     */
    private NotificationType type;

    /**
     * Level of acknowledgement required
     */
    private AcknowledgementLevel acknowledgementLevel;

    /**
     * Optional scheduled time for sending the notification.
     * If null, the notification will be sent immediately.
     */
    private LocalDateTime scheduledTime;

    /**
     * Optional metadata for the notification
     */
    private Map<String, Object> metadata;
}
