package ar.gov.mpd.concursobackend.notification.domain.model;

import ar.gov.mpd.concursobackend.notification.domain.enums.NotificationStatus;
import ar.gov.mpd.concursobackend.notification.domain.valueobjects.NotificationId;
import ar.gov.mpd.concursobackend.notification.domain.valueobjects.NotificationContent;
import ar.gov.mpd.concursobackend.notification.domain.valueobjects.NotificationSubject;
import ar.gov.mpd.concursobackend.auth.domain.model.User;
import lombok.Getter;
import java.time.LocalDateTime;

@Getter
public class Notification {
    private final NotificationId id;
    private final User recipient;
    private final NotificationSubject subject;
    private final NotificationContent content;
    private NotificationStatus status;
    private LocalDateTime sentAt;
    private LocalDateTime readAt;
    private LocalDateTime acknowledgedAt;
    private String acknowledgementSignature;

    public Notification(NotificationId id, User recipient, NotificationSubject subject, 
                       NotificationContent content) {
        this.id = id;
        this.recipient = recipient;
        this.subject = subject;
        this.content = content;
        this.status = NotificationStatus.PENDING;
    }

    public void send() {
        if (this.status != NotificationStatus.PENDING) {
            throw new IllegalStateException("La notificación ya ha sido enviada");
        }
        this.status = NotificationStatus.SENT;
        this.sentAt = LocalDateTime.now();
    }

    public void markAsRead() {
        if (this.status != NotificationStatus.SENT) {
            throw new IllegalStateException("La notificación debe estar enviada para marcarla como leída");
        }
        this.status = NotificationStatus.READ;
        this.readAt = LocalDateTime.now();
    }

    public void acknowledge(String signature) {
        if (this.status != NotificationStatus.READ) {
            throw new IllegalStateException("La notificación debe estar leída para acusarla");
        }
        if (signature == null || signature.trim().isEmpty()) {
            throw new IllegalArgumentException("La firma no puede estar vacía");
        }
        this.status = NotificationStatus.ACKNOWLEDGED;
        this.acknowledgedAt = LocalDateTime.now();
        this.acknowledgementSignature = signature;
    }
}
