package ar.gov.mpd.concursobackend.notification.domain.model;

import ar.gov.mpd.concursobackend.notification.domain.enums.NotificationStatus;
import ar.gov.mpd.concursobackend.notification.domain.enums.AcknowledgementLevel;
import ar.gov.mpd.concursobackend.notification.domain.enums.SignatureType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Getter
@Builder
public class Notification {
    private final UUID id;
    private final UUID recipientId;
    private final String subject;
    private final String content;
    private NotificationStatus status;
    private final LocalDateTime sentAt;
    private LocalDateTime readAt;
    private LocalDateTime acknowledgedAt;
    private final AcknowledgementLevel acknowledgementLevel;
    private SignatureType signatureType;
    private String signatureValue;
    private Map<String, String> signatureMetadata;
    @Builder.Default
    private Long version = 0L;

    @Builder
    public Notification(UUID id, UUID recipientId, String subject, String content,
            NotificationStatus status, LocalDateTime sentAt, LocalDateTime readAt,
            LocalDateTime acknowledgedAt, AcknowledgementLevel acknowledgementLevel,
            SignatureType signatureType, String signatureValue,
            Map<String, String> signatureMetadata, Long version) {
        this.id = id;
        this.recipientId = recipientId;
        this.subject = subject;
        this.content = content;
        this.status = status != null ? status : NotificationStatus.PENDING;
        this.sentAt = sentAt != null ? sentAt : LocalDateTime.now();
        this.readAt = readAt;
        this.acknowledgedAt = acknowledgedAt;
        this.acknowledgementLevel = acknowledgementLevel;
        this.signatureType = signatureType;
        this.signatureValue = signatureValue;
        this.signatureMetadata = signatureMetadata;
        this.version = version != null ? version : 0L;
    }

    public void markAsRead() {
        if (this.readAt == null) {
            this.readAt = LocalDateTime.now();
            if (this.status == NotificationStatus.PENDING || this.status == NotificationStatus.SENT) {
                this.status = NotificationStatus.READ;
            }
        }
    }

    public void acknowledge(String signatureType, String signatureValue, Map<String, String> metadata) {
        if (this.acknowledgedAt == null) {
            validateAcknowledgement(signatureType, signatureValue);
            this.acknowledgedAt = LocalDateTime.now();
            this.signatureType = SignatureType.valueOf(signatureType);
            this.signatureValue = signatureValue;
            this.signatureMetadata = metadata;
            this.status = NotificationStatus.ACKNOWLEDGED;
        }
    }

    private void validateAcknowledgement(String signatureType, String signatureValue) {
        if (acknowledgementLevel == AcknowledgementLevel.NONE) {
            throw new IllegalStateException("Esta notificación no requiere acuse de recibo");
        }

        if (acknowledgementLevel == AcknowledgementLevel.SIGNATURE_BASIC ||
                acknowledgementLevel == AcknowledgementLevel.SIGNATURE_ADVANCED) {
            if (signatureType == null || signatureValue == null) {
                throw new IllegalArgumentException("Se requiere firma para este nivel de acuse");
            }
        }
    }

    public void send() {
        if (this.status == NotificationStatus.PENDING) {
            this.status = NotificationStatus.SENT;
        }
    }
}
