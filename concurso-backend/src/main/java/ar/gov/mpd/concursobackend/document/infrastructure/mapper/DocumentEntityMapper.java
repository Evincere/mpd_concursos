package ar.gov.mpd.concursobackend.document.infrastructure.mapper;

import ar.gov.mpd.concursobackend.document.domain.model.Document;
import ar.gov.mpd.concursobackend.document.domain.model.DocumentType;
import ar.gov.mpd.concursobackend.document.domain.valueObject.*;
import ar.gov.mpd.concursobackend.document.infrastructure.database.entities.DocumentEntity;
import ar.gov.mpd.concursobackend.document.infrastructure.database.entities.DocumentTypeEntity;
import org.springframework.stereotype.Component;

@Component
public class DocumentEntityMapper {

    public Document toDomain(DocumentEntity entity) {
        if (entity == null) {
            return null;
        }

        Document document = new Document();
        document.setId(new DocumentId(entity.getId()));
        document.setUserId(entity.getUserId());
        document.setDocumentType(toDomain(entity.getDocumentType()));
        document.setFileName(new DocumentName(entity.getFileName()));
        document.setContentType(entity.getContentType());
        document.setFilePath(entity.getFilePath());
        document.setStatus(mapStatus(entity.getStatus()));
        document.setProcessingStatus(mapProcessingStatus(entity.getProcessingStatus()));
        document.setComments(entity.getComments());
        document.setUploadDate(entity.getUploadDate());
        document.setValidatedBy(entity.getValidatedBy());
        document.setValidatedAt(entity.getValidatedAt());
        document.setRejectionReason(entity.getRejectionReason());
        document.setErrorMessage(entity.getErrorMessage());

        return document;
    }

    public DocumentType toDomain(DocumentTypeEntity entity) {
        if (entity == null) {
            return null;
        }

        DocumentType documentType = new DocumentType();
        documentType.setId(new DocumentTypeId(entity.getId()));
        documentType.setCode(entity.getCode());
        documentType.setName(entity.getName());
        documentType.setDescription(entity.getDescription());
        documentType.setRequired(entity.isRequired());
        documentType.setOrder(entity.getOrder());
        documentType.setParent(toDomain(entity.getParent()));
        documentType.setActive(entity.isActive());

        return documentType;
    }

    public DocumentEntity toEntity(Document domain) {
        if (domain == null) {
            return null;
        }

        DocumentEntity entity = new DocumentEntity();
        entity.setId(domain.getId().value());
        entity.setUserId(domain.getUserId());
        entity.setDocumentType(toEntity(domain.getDocumentType()));
        entity.setFileName(domain.getFileName().value());
        entity.setContentType(domain.getContentType());
        entity.setFilePath(domain.getFilePath());
        entity.setStatus(mapStatus(domain.getStatus()));
        entity.setProcessingStatus(mapProcessingStatus(domain.getProcessingStatus()));
        entity.setComments(domain.getComments());
        entity.setUploadDate(domain.getUploadDate());
        entity.setValidatedBy(domain.getValidatedBy());
        entity.setValidatedAt(domain.getValidatedAt());
        entity.setRejectionReason(domain.getRejectionReason());
        entity.setErrorMessage(domain.getErrorMessage());

        return entity;
    }

    public DocumentTypeEntity toEntity(DocumentType domain) {
        if (domain == null) {
            return null;
        }

        DocumentTypeEntity entity = new DocumentTypeEntity();
        entity.setId(domain.getId().value());
        entity.setCode(domain.getCode());
        entity.setName(domain.getName());
        entity.setDescription(domain.getDescription());
        entity.setRequired(domain.isRequired());
        entity.setOrder(domain.getOrder());
        entity.setParent(domain.getParent() != null ? toEntity(domain.getParent()) : null);
        entity.setActive(domain.isActive());

        return entity;
    }

    private DocumentStatus mapStatus(DocumentEntity.DocumentStatusEnum status) {
        if (status == null) {
            return null; // Permitir null para documentos en procesamiento
        }

        return switch (status) {
            case PENDING -> DocumentStatus.PENDING;
            case APPROVED -> DocumentStatus.APPROVED;
            case REJECTED -> DocumentStatus.REJECTED;
            case PROCESSING -> DocumentStatus.PROCESSING;
            case ERROR -> DocumentStatus.ERROR;
        };
    }

    private DocumentEntity.DocumentStatusEnum mapStatus(DocumentStatus status) {
        if (status == null) {
            return null; // Permitir null para documentos en procesamiento
        }

        return switch (status) {
            case PENDING -> DocumentEntity.DocumentStatusEnum.PENDING;
            case APPROVED -> DocumentEntity.DocumentStatusEnum.APPROVED;
            case REJECTED -> DocumentEntity.DocumentStatusEnum.REJECTED;
            case PROCESSING -> DocumentEntity.DocumentStatusEnum.PROCESSING;
            case ERROR -> DocumentEntity.DocumentStatusEnum.ERROR;
        };
    }

    private ProcessingStatus mapProcessingStatus(DocumentEntity.ProcessingStatusEnum processingStatus) {
        if (processingStatus == null) {
            return ProcessingStatus.UPLOADING; // Default para compatibilidad
        }

        return switch (processingStatus) {
            case UPLOADING -> ProcessingStatus.UPLOADING;
            case PROCESSING -> ProcessingStatus.PROCESSING;
            case UPLOAD_COMPLETE -> ProcessingStatus.UPLOAD_COMPLETE;
            case UPLOAD_FAILED -> ProcessingStatus.UPLOAD_FAILED;
        };
    }

    private DocumentEntity.ProcessingStatusEnum mapProcessingStatus(ProcessingStatus processingStatus) {
        if (processingStatus == null) {
            return DocumentEntity.ProcessingStatusEnum.UPLOADING; // Default
        }

        return switch (processingStatus) {
            case UPLOADING -> DocumentEntity.ProcessingStatusEnum.UPLOADING;
            case PROCESSING -> DocumentEntity.ProcessingStatusEnum.PROCESSING;
            case UPLOAD_COMPLETE -> DocumentEntity.ProcessingStatusEnum.UPLOAD_COMPLETE;
            case UPLOAD_FAILED -> DocumentEntity.ProcessingStatusEnum.UPLOAD_FAILED;
        };
    }
}