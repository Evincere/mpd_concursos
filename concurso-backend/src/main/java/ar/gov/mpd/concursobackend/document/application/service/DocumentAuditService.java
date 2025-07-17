package ar.gov.mpd.concursobackend.document.application.service;

import ar.gov.mpd.concursobackend.document.domain.model.Document;
import ar.gov.mpd.concursobackend.document.infrastructure.database.entities.DocumentAuditEntity;
import ar.gov.mpd.concursobackend.document.infrastructure.database.repository.spring.IDocumentAuditSpringRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Servicio para auditoría de operaciones en documentos
 * Registra todas las acciones para trazabilidad completa
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentAuditService {

    private final IDocumentAuditSpringRepository auditRepository;
    private final ObjectMapper objectMapper;

    /**
     * Registra la creación de un nuevo documento
     */
    @Transactional
    public void recordCreation(Document document, UUID actionBy) {
        log.debug("Registrando creación de documento: {}", document.getId().value());

        try {
            DocumentAuditEntity audit = DocumentAuditEntity.builder()
                    .documentId(document.getId().value())
                    .userId(document.getUserId())
                    .actionType(DocumentAuditEntity.ActionType.CREATED)
                    .newFilePath(document.getFilePath())
                    .actionBy(actionBy)
                    .reason("Documento creado")
                    .metadata(createMetadata(document))
                    .build();

            auditRepository.save(audit);
            log.debug("Auditoría de creación registrada exitosamente para documento: {}", document.getId().value());

        } catch (Exception e) {
            log.error("Error registrando auditoría de creación para documento: {}", document.getId().value(), e);
            // No relanzamos la excepción para no afectar el flujo principal
        }
    }

    /**
     * Registra la eliminación de un documento
     */
    @Transactional
    public void recordDeletion(Document document, UUID actionBy, String reason) {
        log.debug("Registrando eliminación de documento: {}", document.getId().value());
        
        DocumentAuditEntity audit = new DocumentAuditEntity();
        audit.setId(UUID.randomUUID());
        audit.setDocumentId(document.getId().value());
        audit.setUserId(document.getUserId());
        audit.setActionType(DocumentAuditEntity.ActionType.DELETED);
        audit.setOldFilePath(document.getFilePath());
        audit.setActionDate(LocalDateTime.now());
        audit.setActionBy(actionBy);
        audit.setReason(reason != null ? reason : "Documento eliminado");
        
        auditRepository.save(audit);
    }

    /**
     * Registra la actualización de un documento
     */
    @Transactional
    public void recordUpdate(Document document, String oldFilePath, UUID actionBy, String reason) {
        log.debug("Registrando actualización de documento: {}", document.getId().value());
        
        DocumentAuditEntity audit = new DocumentAuditEntity();
        audit.setId(UUID.randomUUID());
        audit.setDocumentId(document.getId().value());
        audit.setUserId(document.getUserId());
        audit.setActionType(DocumentAuditEntity.ActionType.UPDATED);
        audit.setOldFilePath(oldFilePath);
        audit.setNewFilePath(document.getFilePath());
        audit.setActionDate(LocalDateTime.now());
        audit.setActionBy(actionBy);
        audit.setReason(reason != null ? reason : "Documento actualizado");
        
        auditRepository.save(audit);
    }

    /**
     * Crea metadata JSON para auditoría
     */
    private String createMetadata(Document document) {
        try {
            var metadata = new java.util.HashMap<String, Object>();
            metadata.put("fileName", document.getFileName() != null ? document.getFileName().toString() : null);
            metadata.put("filePath", document.getFilePath());
            metadata.put("documentType", document.getDocumentType() != null ? document.getDocumentType().toString() : null);
            metadata.put("status", document.getStatus() != null ? document.getStatus().toString() : null);
            metadata.put("processingStatus", document.getProcessingStatus() != null ? document.getProcessingStatus().toString() : null);
            metadata.put("version", document.getVersion());
            metadata.put("isArchived", document.isArchived());
            metadata.put("timestamp", LocalDateTime.now().toString());

            return objectMapper.writeValueAsString(metadata);
        } catch (Exception e) {
            log.warn("Error creando metadata para documento: {}", document.getId().value(), e);
            return "{}";
        }
    }
}
