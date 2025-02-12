package ar.gov.mpd.concursobackend.notification.infrastructure.persistence.entity;

import ar.gov.mpd.concursobackend.notification.domain.enums.NotificationStatus;
import ar.gov.mpd.concursobackend.notification.domain.enums.AcknowledgementLevel;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

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

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AcknowledgementLevel acknowledgementLevel;

    @Column
    private String signatureType;

    @Column
    private String signatureValue;

    @JdbcTypeCode(SqlTypes.JSON)
    private Map<String, String> signatureMetadata;

    @Version
    private Long version;
}
