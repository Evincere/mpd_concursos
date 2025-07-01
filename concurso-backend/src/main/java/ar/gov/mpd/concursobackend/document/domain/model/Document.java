package ar.gov.mpd.concursobackend.document.domain.model;

import java.time.LocalDateTime;
import java.util.UUID;

import ar.gov.mpd.concursobackend.document.domain.valueObject.DocumentId;
import ar.gov.mpd.concursobackend.document.domain.valueObject.DocumentName;
import ar.gov.mpd.concursobackend.document.domain.valueObject.DocumentStatus;
import ar.gov.mpd.concursobackend.document.domain.valueObject.ProcessingStatus;
import lombok.Data;

@Data
public class Document {
    private DocumentId id;
    private UUID userId;
    private DocumentType documentType;
    private DocumentName fileName;
    private String contentType;
    private String filePath;
    private DocumentStatus status; // Estado de negocio (PENDING, APPROVED, REJECTED)
    private ProcessingStatus processingStatus; // Estado técnico (UPLOADING, PROCESSING, UPLOAD_COMPLETE, UPLOAD_FAILED)
    private String comments;
    private LocalDateTime uploadDate;
    private UUID validatedBy;
    private LocalDateTime validatedAt;
    private String rejectionReason;
    private String errorMessage; // Mensaje de error para processingStatus UPLOAD_FAILED

    public Document() {
        this.id = new DocumentId(UUID.randomUUID());
        this.processingStatus = ProcessingStatus.UPLOADING; // Estado técnico inicial
        this.uploadDate = LocalDateTime.now();
        // El status de negocio se asigna cuando el procesamiento se completa exitosamente
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
        document.setProcessingStatus(ProcessingStatus.UPLOAD_COMPLETE);
        document.setStatus(DocumentStatus.PENDING); // Listo para revisión administrativa
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

    // Métodos para manejo de estados de procesamiento
    public void startProcessing() {
        this.processingStatus = ProcessingStatus.PROCESSING;
    }

    public void completeProcessing() {
        this.processingStatus = ProcessingStatus.UPLOAD_COMPLETE;
        this.status = DocumentStatus.PENDING; // Listo para revisión administrativa
    }

    public void failProcessing(String errorMessage) {
        this.processingStatus = ProcessingStatus.UPLOAD_FAILED;
        this.errorMessage = errorMessage;
    }

    public boolean isProcessingComplete() {
        return this.processingStatus == ProcessingStatus.UPLOAD_COMPLETE;
    }

    public boolean isProcessingFailed() {
        return this.processingStatus == ProcessingStatus.UPLOAD_FAILED;
    }

    public boolean isReadyForAdminReview() {
        return this.processingStatus == ProcessingStatus.UPLOAD_COMPLETE &&
               this.status == DocumentStatus.PENDING;
    }
}