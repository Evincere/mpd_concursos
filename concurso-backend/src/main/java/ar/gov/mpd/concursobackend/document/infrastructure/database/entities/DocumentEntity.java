package ar.gov.mpd.concursobackend.document.infrastructure.database.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "documents")
@Getter
@Setter
public class DocumentEntity {

    @Id
    @Column(name = "id", columnDefinition = "BINARY(16)")
    private UUID id;

    @NotNull
    @Column(name = "user_id")
    private UUID userId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "document_type_id")
    private DocumentTypeEntity documentType;

    @NotNull
    @Column(name = "file_name")
    private String fileName;

    @NotNull
    @Column(name = "content_type")
    private String contentType;

    @Column(name = "file_path")
    private String filePath; // Nullable durante el procesamiento en cola

    @Enumerated(EnumType.STRING)
    private DocumentStatusEnum status; // Puede ser null durante el procesamiento

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "processing_status")
    private ProcessingStatusEnum processingStatus;

    @Column(name = "comments")
    private String comments;

    @NotNull
    @Column(name = "upload_date")
    private LocalDateTime uploadDate;

    @Column(name = "validated_by")
    private UUID validatedBy;

    @Column(name = "validated_at")
    private LocalDateTime validatedAt;

    @Column(name = "rejection_reason")
    private String rejectionReason;

    @Column(name = "error_message")
    private String errorMessage;

    // Campos para manejo de duplicidad y archivado
    @Column(name = "is_archived", nullable = false, columnDefinition = "BOOLEAN DEFAULT FALSE")
    private Boolean isArchived = false;

    @Column(name = "archived_at")
    private LocalDateTime archivedAt;

    @Column(name = "archived_by")
    private UUID archivedBy;

    @Version
    @Column(name = "version")
    private int version = 1;

    // Setter personalizado para manejar NULL en isArchived
    public void setIsArchived(Boolean isArchived) {
        this.isArchived = (isArchived != null) ? isArchived : false;
    }

    public Boolean getIsArchived() {
        return this.isArchived != null ? this.isArchived : false;
    }

    public enum DocumentStatusEnum {
        PENDING, APPROVED, REJECTED, PROCESSING, ERROR
    }

    public enum ProcessingStatusEnum {
        UPLOADING, PROCESSING, UPLOAD_COMPLETE, UPLOAD_FAILED
    }
}