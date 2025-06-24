package ar.gov.mpd.concursobackend.audit.domain.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

/**
 * Entidad de dominio para el registro de auditoría
 *
 * @author Augment Agent
 * @version 1.0
 */
@Entity
@Table(name = "audit_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false)
    private AuditEventType eventType;

    @Column(name = "username", length = 100)
    private String username;

    @Column(name = "description", length = 1000)
    private String description;

    @Column(name = "outcome", length = 500)
    private String outcome;

    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(name = "session_id", length = 100)
    private String sessionId;

    /**
     * Constructor para crear un log de auditoría básico
     */
    public AuditLog(AuditEventType eventType, String username, String description, String outcome) {
        this.eventType = eventType;
        this.username = username;
        this.description = description;
        this.outcome = outcome;
        this.timestamp = LocalDateTime.now();
    }

    /**
     * Constructor para crear un log de auditoría con información adicional
     */
    public AuditLog(AuditEventType eventType, String username, String description, String outcome,
                   String ipAddress, String userAgent, String sessionId) {
        this(eventType, username, description, outcome);
        this.ipAddress = ipAddress;
        this.userAgent = userAgent;
        this.sessionId = sessionId;
    }

    @PrePersist
    protected void onCreate() {
        if (timestamp == null) {
            timestamp = LocalDateTime.now();
        }
    }
}