package ar.gov.mpd.concursobackend.notification.domain.model;

import ar.gov.mpd.concursobackend.notification.domain.enums.NotificationStatus;
import ar.gov.mpd.concursobackend.notification.domain.enums.AcknowledgementLevel;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Getter
@Builder
public class Notification {
    private UUID id;
    private UUID recipientId;
    private String subject;
    private String content;
    private NotificationStatus status;
    private LocalDateTime sentAt;
    private LocalDateTime readAt;
    private LocalDateTime acknowledgedAt;
    private AcknowledgementLevel acknowledgementLevel;
    private String signatureType;
    private String signatureValue;
    private Map<String, String> signatureMetadata;
    private Long version;

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
            this.signatureType = signatureType;
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
        if (this.sentAt == null) {
            this.sentAt = LocalDateTime.now();
            this.status = NotificationStatus.SENT;
        }
    }
}
