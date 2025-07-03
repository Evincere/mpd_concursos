package ar.gov.mpd.concursobackend.audit.application.service;

import ar.gov.mpd.concursobackend.audit.domain.model.AuditEventType;
import ar.gov.mpd.concursobackend.audit.domain.model.AuditLog;
import ar.gov.mpd.concursobackend.audit.infrastructure.persistence.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logEvent(AuditEventType eventType, String username, String description, String outcome) {
        AuditLog auditLog = new AuditLog(eventType, username, description, outcome);
        auditLogRepository.save(auditLog);
    }
    
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logEvent(AuditLog log) {
        auditLogRepository.save(log);
    }
} 