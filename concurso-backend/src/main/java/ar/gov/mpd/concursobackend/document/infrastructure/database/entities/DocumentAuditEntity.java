package ar.gov.mpd.concursobackend.document.infrastructure.database.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entidad para auditoría de operaciones en documentos
 * Registra todas las acciones para trazabilidad completa
 */
@Entity
@Table(name = "document_audit", indexes = {
    @Index(name = "idx_document_audit_document_id", columnList = "document_id"),
    @Index(name = "idx_document_audit_user_id", columnList = "user_id"),
    @Index(name = "idx_document_audit_action_date", columnList = "action_date")
})
@Getter
@Setter
public class DocumentAuditEntity {

    @Id
    private UUID id;

    @NotNull
    @Column(name = "document_id")
    private UUID documentId;

    @NotNull
    @Column(name = "user_id")
    private UUID userId;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "action_type")
    private ActionType actionType;

    @Column(name = "old_file_path", length = 500)
    private String oldFilePath;

    @Column(name = "new_file_path", length = 500)
    private String newFilePath;

    @NotNull
    @Column(name = "action_date")
    private LocalDateTime actionDate;

    @Column(name = "action_by")
    private UUID actionBy;

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    @Column(name = "metadata", columnDefinition = "JSON")
    private String metadata;

    /**
     * Tipos de acciones auditables
     */
    public enum ActionType {
        CREATED,    // Documento creado
        UPDATED,    // Documento actualizado
        DELETED,    // Documento eliminado
        REPLACED,   // Documento reemplazado por nueva versión
        ARCHIVED,   // Documento archivado
        RESTORED    // Documento restaurado desde archivo
    }

    public DocumentAuditEntity() {
        this.id = UUID.randomUUID();
        this.actionDate = LocalDateTime.now();
    }

    public DocumentAuditEntity(UUID documentId, UUID userId, ActionType actionType, UUID actionBy) {
        this();
        this.documentId = documentId;
        this.userId = userId;
        this.actionType = actionType;
        this.actionBy = actionBy;
    }

    /**
     * Builder pattern para facilitar la creación
     */
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final DocumentAuditEntity entity = new DocumentAuditEntity();

        public Builder documentId(UUID documentId) {
            entity.setDocumentId(documentId);
            return this;
        }

        public Builder userId(UUID userId) {
            entity.setUserId(userId);
            return this;
        }

        public Builder actionType(ActionType actionType) {
            entity.setActionType(actionType);
            return this;
        }

        public Builder oldFilePath(String oldFilePath) {
            entity.setOldFilePath(oldFilePath);
            return this;
        }

        public Builder newFilePath(String newFilePath) {
            entity.setNewFilePath(newFilePath);
            return this;
        }

        public Builder actionBy(UUID actionBy) {
            entity.setActionBy(actionBy);
            return this;
        }

        public Builder reason(String reason) {
            entity.setReason(reason);
            return this;
        }

        public Builder metadata(String metadata) {
            entity.setMetadata(metadata);
            return this;
        }

        public DocumentAuditEntity build() {
            return entity;
        }
    }

    @Override
    public String toString() {
        return String.format("DocumentAudit{id=%s, documentId=%s, actionType=%s, actionDate=%s}", 
                id, documentId, actionType, actionDate);
    }
}
