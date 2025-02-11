package ar.gov.mpd.concursobackend.notification.domain.model;

import ar.gov.mpd.concursobackend.notification.domain.enums.NotificationStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
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
    private String acknowledgementSignature;
    private Long version;

    public void markAsRead() {
        if (this.readAt == null) {
            this.readAt = LocalDateTime.now();
            if (this.status == NotificationStatus.PENDING || this.status == NotificationStatus.SENT) {
                this.status = NotificationStatus.READ;
            }
        }
    }

    public void acknowledge(String signature) {
        if (this.acknowledgedAt == null) {
            this.acknowledgedAt = LocalDateTime.now();
            this.acknowledgementSignature = signature;
            this.status = NotificationStatus.ACKNOWLEDGED;
        }
    }

    public void send() {
        if (this.sentAt == null) {
            this.sentAt = LocalDateTime.now();
            this.status = NotificationStatus.SENT;
        }
    }
}
