package ar.gov.mpd.concursobackend.notification.infrastructure.persistence.entity;

import ar.gov.mpd.concursobackend.notification.domain.enums.NotificationStatus;
import ar.gov.mpd.concursobackend.notification.domain.enums.AcknowledgementLevel;
import ar.gov.mpd.concursobackend.notification.domain.enums.SignatureType;
import ar.gov.mpd.concursobackend.notification.infrastructure.persistence.converter.JsonMapConverter;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.Map;
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

    @Column(name = "recipient_id", nullable = false)
    private UUID recipientId;

    @Column(nullable = false)
    private String subject;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationStatus status;

    @Column(name = "sent_at", nullable = false)
    private LocalDateTime sentAt;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @Column(name = "acknowledged_at")
    private LocalDateTime acknowledgedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "acknowledgement_level", nullable = false)
    private AcknowledgementLevel acknowledgementLevel;

    @Enumerated(EnumType.STRING)
    @Column(name = "signature_type")
    private SignatureType signatureType;

    @Column(name = "signature_value")
    private String signatureValue;

    @Column(name = "signature_metadata")
    @Convert(converter = JsonMapConverter.class)
    private Map<String, String> signatureMetadata;

    @Version
    private Long version;
}
