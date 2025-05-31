package ar.gov.mpd.concursobackend.notification.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Response DTO for mass notification requests
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MassNotificationResponse {
    /**
     * ID of the mass notification batch
     */
    private UUID batchId;

    /**
     * Total number of recipients
     */
    private int totalRecipients;

    /**
     * Number of successful notifications sent
     */
    private int successCount;

    /**
     * Number of failed notifications
     */
    private int failureCount;

    /**
     * List of notification IDs that were successfully sent
     */
    private List<UUID> sentNotificationIds;

    /**
     * Time when the batch was processed
     */
    private LocalDateTime processedAt;

    /**
     * Scheduled time for sending (if applicable)
     */
    private LocalDateTime scheduledTime;

    /**
     * Status of the batch (PENDING, PROCESSING, COMPLETED, FAILED, SCHEDULED)
     */
    private String status;
}
