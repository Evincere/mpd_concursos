package ar.gov.mpd.concursobackend.audit.infrastructure.persistence;

import ar.gov.mpd.concursobackend.audit.domain.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
} 