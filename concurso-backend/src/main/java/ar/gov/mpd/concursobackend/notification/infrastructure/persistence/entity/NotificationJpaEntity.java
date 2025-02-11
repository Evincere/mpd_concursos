package ar.gov.mpd.concursobackend.notification.infrastructure.persistence.entity;

import ar.gov.mpd.concursobackend.notification.domain.enums.NotificationStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID recipientId;

    @Column(nullable = false, length = 200)
    private String subject;

    @Column(nullable = false, length = 5000)
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationStatus status;

    @Column(nullable = false)
    private LocalDateTime sentAt;

    @Column
    private LocalDateTime readAt;

    @Column
    private LocalDateTime acknowledgedAt;

    @Column
    private String acknowledgementSignature;

    @Version
    private Long version;
}
