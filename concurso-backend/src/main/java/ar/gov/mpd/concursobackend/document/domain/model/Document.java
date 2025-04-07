package ar.gov.mpd.concursobackend.document.domain.model;

import java.time.LocalDateTime;
import java.util.UUID;

import ar.gov.mpd.concursobackend.document.domain.valueObject.DocumentId;
import ar.gov.mpd.concursobackend.document.domain.valueObject.DocumentName;
import ar.gov.mpd.concursobackend.document.domain.valueObject.DocumentStatus;
import lombok.Data;

@Data
public class Document {
    private DocumentId id;
    private UUID userId;
    private DocumentType documentType;
    private DocumentName fileName;
    private String contentType;
    private String filePath;
    private DocumentStatus status;
    private String comments;
    private LocalDateTime uploadDate;
    private UUID validatedBy;
    private LocalDateTime validatedAt;
    private String rejectionReason;

    public Document() {
        this.id = new DocumentId(UUID.randomUUID());
        this.status = DocumentStatus.PENDING;
        this.uploadDate = LocalDateTime.now();
    }

    public static Document create(UUID userId, DocumentType documentType, DocumentName fileName,
            String contentType, String filePath, String comments) {
        Document document = new Document();
        document.setUserId(userId);
        document.setDocumentType(documentType);
        document.setFileName(fileName);
        document.setContentType(contentType);
        document.setFilePath(filePath);
        document.setComments(comments);
        return document;
    }

    public void approve(UUID adminId) {
        this.setStatus(DocumentStatus.APPROVED);
        this.validatedBy = adminId;
        this.validatedAt = LocalDateTime.now();
        this.rejectionReason = null;
    }

    public void reject(UUID adminId, String reason) {
        this.setStatus(DocumentStatus.REJECTED);
        this.validatedBy = adminId;
        this.validatedAt = LocalDateTime.now();
        this.rejectionReason = reason;
    }
}