package ar.gov.mpd.concursobackend.document.application.mapper;

import ar.gov.mpd.concursobackend.document.application.dto.DocumentDto;
import ar.gov.mpd.concursobackend.document.application.dto.DocumentTypeDto;
import ar.gov.mpd.concursobackend.document.domain.model.Document;
import ar.gov.mpd.concursobackend.document.domain.model.DocumentType;
import ar.gov.mpd.concursobackend.document.domain.valueObject.DocumentId;
import ar.gov.mpd.concursobackend.document.domain.valueObject.DocumentName;
import ar.gov.mpd.concursobackend.document.domain.valueObject.DocumentStatus;
import ar.gov.mpd.concursobackend.document.domain.valueObject.DocumentTypeId;
import ar.gov.mpd.concursobackend.document.infrastructure.database.entities.DocumentEntity;
import ar.gov.mpd.concursobackend.document.infrastructure.database.entities.DocumentTypeEntity;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class DocumentMapper {

    public DocumentDto toDto(Document document) {
        if (document == null) {
            return null;
        }

        return DocumentDto.builder()
                .id(document.getId().value().toString())
                .tipoDocumentoId(document.getDocumentType().getId().value().toString())
                .tipoDocumento(toTypeDto(document.getDocumentType()))
                .nombreArchivo(document.getFileName().value())
                .contentType(document.getContentType())
                .estado(document.getStatus().name())
                .comentarios(document.getComments())
                .fechaCarga(document.getUploadDate())
                .validadoPor(document.getValidatedBy() != null ? document.getValidatedBy().toString() : null)
                .fechaValidacion(document.getValidatedAt())
                .motivoRechazo(document.getRejectionReason())
                .build();
    }

    public DocumentTypeDto toTypeDto(DocumentType documentType) {
        if (documentType == null) {
            return null;
        }

        return DocumentTypeDto.builder()
                .id(documentType.getId().value().toString())
                .code(documentType.getCode())
                .nombre(documentType.getName())
                .descripcion(documentType.getDescription())
                .requerido(documentType.isRequired())
                .orden(documentType.getOrder())
                .parentId(documentType.getParent() != null ? documentType.getParent().getId().value().toString() : null)
                .activo(documentType.isActive())
                .build();
    }

    public Document toDomain(DocumentEntity entity) {
        if (entity == null) {
            return null;
        }

        Document domain = new Document();
        domain.setId(new DocumentId(entity.getId()));
        domain.setDocumentType(toDomain(entity.getDocumentType()));
        domain.setFileName(new DocumentName(entity.getFileName()));
        domain.setContentType(entity.getContentType());
        domain.setStatus(DocumentStatus.valueOf(entity.getStatus().name()));
        domain.setComments(entity.getComments());
        domain.setUploadDate(entity.getUploadDate());
        domain.setValidatedBy(entity.getValidatedBy());
        domain.setValidatedAt(entity.getValidatedAt());
        domain.setRejectionReason(entity.getRejectionReason());
        return domain;
    }

    public DocumentEntity toEntity(Document domain) {
        if (domain == null) {
            return null;
        }

        DocumentEntity entity = new DocumentEntity();
        entity.setId(domain.getId().value());
        entity.setDocumentType(toEntity(domain.getDocumentType()));
        entity.setFileName(domain.getFileName().value());
        entity.setContentType(domain.getContentType());
        entity.setStatus(DocumentEntity.DocumentStatusEnum.valueOf(domain.getStatus().name()));
        entity.setComments(domain.getComments());
        entity.setUploadDate(domain.getUploadDate());
        entity.setValidatedBy(domain.getValidatedBy());
        entity.setValidatedAt(domain.getValidatedAt());
        entity.setRejectionReason(domain.getRejectionReason());
        return entity;
    }

    public DocumentType toDomain(DocumentTypeEntity entity) {
        if (entity == null) {
            return null;
        }

        return new DocumentType(
                entity.getCode(),
                entity.getName(),
                entity.getDescription(),
                entity.isRequired(),
                entity.getOrder(),
                entity.getParent() != null ? toDomain(entity.getParent()) : null,
                entity.isActive()
        );
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

    public List<DocumentDto> toDtoList(List<Document> documents) {
        if (documents == null) {
            return List.of();
        }

        return documents.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<DocumentTypeDto> toTypeDtoList(List<DocumentType> documentTypes) {
        if (documentTypes == null) {
            return List.of();
        }

        return documentTypes.stream()
                .map(this::toTypeDto)
                .collect(Collectors.toList());
    }
}