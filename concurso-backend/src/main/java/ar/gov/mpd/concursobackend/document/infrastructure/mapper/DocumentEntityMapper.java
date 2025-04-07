package ar.gov.mpd.concursobackend.document.infrastructure.mapper;

import org.springframework.stereotype.Component;

import ar.gov.mpd.concursobackend.document.domain.model.Document;
import ar.gov.mpd.concursobackend.document.domain.model.DocumentType;
import ar.gov.mpd.concursobackend.document.domain.valueObject.DocumentId;
import ar.gov.mpd.concursobackend.document.domain.valueObject.DocumentName;
import ar.gov.mpd.concursobackend.document.domain.valueObject.DocumentStatus;
import ar.gov.mpd.concursobackend.document.domain.valueObject.DocumentTypeId;
import ar.gov.mpd.concursobackend.document.infrastructure.database.entities.DocumentEntity;
import ar.gov.mpd.concursobackend.document.infrastructure.database.entities.DocumentTypeEntity;

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
        document.setComments(entity.getComments());
        document.setUploadDate(entity.getUploadDate());
        document.setValidatedBy(entity.getValidatedBy());
        document.setValidatedAt(entity.getValidatedAt());
        document.setRejectionReason(entity.getRejectionReason());

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
        entity.setComments(domain.getComments());
        entity.setUploadDate(domain.getUploadDate());
        entity.setValidatedBy(domain.getValidatedBy());
        entity.setValidatedAt(domain.getValidatedAt());
        entity.setRejectionReason(domain.getRejectionReason());

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
            return DocumentStatus.PENDING;
        }

        return switch (status) {
            case PENDING -> DocumentStatus.PENDING;
            case APPROVED -> DocumentStatus.APPROVED;
            case REJECTED -> DocumentStatus.REJECTED;
        };
    }

    private DocumentEntity.DocumentStatusEnum mapStatus(DocumentStatus status) {
        if (status == null) {
            return DocumentEntity.DocumentStatusEnum.PENDING;
        }

        return switch (status) {
            case PENDING -> DocumentEntity.DocumentStatusEnum.PENDING;
            case APPROVED -> DocumentEntity.DocumentStatusEnum.APPROVED;
            case REJECTED -> DocumentEntity.DocumentStatusEnum.REJECTED;
        };
    }
}