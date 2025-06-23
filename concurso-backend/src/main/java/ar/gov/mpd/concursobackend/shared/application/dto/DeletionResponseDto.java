package ar.gov.mpd.concursobackend.shared.application.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonFormat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for deletion operation responses
 * Provides information about the deletion status and recovery options
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeletionResponseDto {

    /**
     * Whether the deletion was successful
     */
    private boolean success;

    /**
     * Human-readable message about the deletion
     */
    private String message;

    /**
     * ID of the deleted entity
     */
    private UUID deletedId;

    /**
     * Type of entity that was deleted
     */
    private String entityType;

    /**
     * Timestamp when the deletion occurred
     */
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime deletedAt;

    /**
     * ID of the user who performed the deletion
     */
    private UUID deletedBy;

    /**
     * Whether the deletion can be recovered
     */
    private boolean recoverable;

    /**
     * Number of hours remaining in the recovery window
     */
    private Integer recoveryWindowHours;

    /**
     * Deadline for recovery (if recoverable)
     */
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime recoveryDeadline;

    /**
     * Whether the deleted entity had associated documents
     */
    private boolean hadAssociatedDocuments;

    /**
     * Number of associated documents that were also marked for deletion
     */
    private Integer associatedDocumentsCount;

    /**
     * Additional metadata about the deletion
     */
    private DeletionMetadata metadata;

    /**
     * Creates a successful deletion response
     */
    public static DeletionResponseDto success(UUID deletedId, String entityType, String message) {
        return DeletionResponseDto.builder()
                .success(true)
                .deletedId(deletedId)
                .entityType(entityType)
                .message(message)
                .deletedAt(LocalDateTime.now())
                .recoverable(true)
                .recoveryWindowHours(24)
                .recoveryDeadline(LocalDateTime.now().plusHours(24))
                .build();
    }

    /**
     * Creates a successful deletion response with document information
     */
    public static DeletionResponseDto successWithDocuments(
            UUID deletedId, 
            String entityType, 
            String message,
            int documentCount) {
        return DeletionResponseDto.builder()
                .success(true)
                .deletedId(deletedId)
                .entityType(entityType)
                .message(message)
                .deletedAt(LocalDateTime.now())
                .recoverable(true)
                .recoveryWindowHours(24)
                .recoveryDeadline(LocalDateTime.now().plusHours(24))
                .hadAssociatedDocuments(documentCount > 0)
                .associatedDocumentsCount(documentCount)
                .build();
    }

    /**
     * Creates a failure deletion response
     */
    public static DeletionResponseDto failure(String message) {
        return DeletionResponseDto.builder()
                .success(false)
                .message(message)
                .recoverable(false)
                .build();
    }

    /**
     * Metadata about the deletion operation
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DeletionMetadata {
        
        /**
         * Reason for deletion
         */
        private String reason;

        /**
         * Whether this was a cascade deletion
         */
        private boolean cascadeDelete;

        /**
         * Number of related entities affected
         */
        private Integer relatedEntitiesAffected;

        /**
         * Estimated time for physical file cleanup (in hours)
         */
        private Integer physicalCleanupHours;

        /**
         * Whether user confirmation was required
         */
        private boolean userConfirmationRequired;

        /**
         * IP address of the user who performed the deletion
         */
        private String userIpAddress;

        /**
         * User agent of the client that performed the deletion
         */
        private String userAgent;
    }
}
