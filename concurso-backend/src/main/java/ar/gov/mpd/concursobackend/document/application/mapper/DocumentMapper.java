package ar.gov.mpd.concursobackend.document.application.mapper;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import ar.gov.mpd.concursobackend.document.application.dto.DocumentDto;
import ar.gov.mpd.concursobackend.document.application.dto.DocumentTypeDto;
import ar.gov.mpd.concursobackend.document.domain.model.Document;
import ar.gov.mpd.concursobackend.document.domain.model.DocumentType;

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