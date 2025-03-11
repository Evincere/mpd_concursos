package ar.gov.mpd.concursobackend.document.application.service;

import java.io.InputStream;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ar.gov.mpd.concursobackend.document.application.dto.DocumentDto;
import ar.gov.mpd.concursobackend.document.application.dto.DocumentResponse;
import ar.gov.mpd.concursobackend.document.application.dto.DocumentUploadRequest;
import ar.gov.mpd.concursobackend.document.application.mapper.DocumentMapper;
import ar.gov.mpd.concursobackend.document.domain.exception.DocumentException;
import ar.gov.mpd.concursobackend.document.domain.model.Document;
import ar.gov.mpd.concursobackend.document.domain.model.DocumentType;
import ar.gov.mpd.concursobackend.document.domain.port.IDocumentRepository;
import ar.gov.mpd.concursobackend.document.domain.port.IDocumentStorageService;
import ar.gov.mpd.concursobackend.document.domain.port.IDocumentTypeRepository;
import ar.gov.mpd.concursobackend.document.domain.valueObject.DocumentId;
import ar.gov.mpd.concursobackend.document.domain.valueObject.DocumentName;
import ar.gov.mpd.concursobackend.document.domain.valueObject.DocumentStatus;
import ar.gov.mpd.concursobackend.document.domain.valueObject.DocumentTypeId;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentService {

    private final IDocumentRepository documentRepository;
    private final IDocumentTypeRepository documentTypeRepository;
    private final IDocumentStorageService documentStorageService;
    private final DocumentMapper documentMapper;

    @Transactional
    public DocumentResponse uploadDocument(DocumentUploadRequest request, InputStream fileContent, UUID userId) {
        log.debug("Uploading document for user: {}", userId);

        DocumentType documentType = documentTypeRepository
                .findById(new DocumentTypeId(UUID.fromString(request.getDocumentTypeId())))
                .orElseThrow(() -> new DocumentException("Document type not found"));

        Document document = Document.create(
                userId,
                documentType,
                new DocumentName(request.getFileName()),
                request.getContentType(),
                null,
                request.getComments());

        // Store the file
        String filePath = documentStorageService.storeFile(fileContent, request.getFileName(), userId,
                document.getId().value());
        document.setFilePath(filePath);

        // Save document metadata
        Document savedDocument = documentRepository.save(document);
        log.debug("Document saved: {}", savedDocument);

        return DocumentResponse.builder()
                .id(savedDocument.getId().value().toString())
                .mensaje("Document uploaded successfully")
                .documento(documentMapper.toDto(savedDocument))
                .build();
    }

    @Transactional(readOnly = true)
    public List<DocumentDto> getUserDocuments(UUID userId) {
        log.debug("Getting documents for user: {}", userId);

        List<Document> documents = documentRepository.findByUserId(userId);
        return documentMapper.toDtoList(documents);
    }

    @Transactional(readOnly = true)
    public DocumentDto getDocumentMetadata(String documentId, UUID userId) {
        log.debug("Getting document metadata: {} for user: {}", documentId, userId);

        Document document = documentRepository.findById(new DocumentId(UUID.fromString(documentId)))
                .orElseThrow(() -> new DocumentException("Document not found"));

        // Verify the document belongs to the user
        if (!document.getUserId().equals(userId)) {
            throw new DocumentException("Document does not belong to the user");
        }

        return documentMapper.toDto(document);
    }

    @Transactional(readOnly = true)
    public InputStream getDocumentFile(String documentId, UUID userId) {
        log.debug("Getting document file: {} for user: {}", documentId, userId);

        Document document = documentRepository.findById(new DocumentId(UUID.fromString(documentId)))
                .orElseThrow(() -> new DocumentException("Document not found"));

        // Verify the document belongs to the user
        if (!document.getUserId().equals(userId)) {
            throw new DocumentException("Document does not belong to the user");
        }

        return documentStorageService.getFile(document.getFilePath());
    }

    @Transactional
    public void deleteDocument(String documentId, UUID userId) {
        log.debug("Deleting document: {} for user: {}", documentId, userId);

        Document document = documentRepository.findById(new DocumentId(UUID.fromString(documentId)))
                .orElseThrow(() -> new DocumentException("Document not found"));

        // Verify the document belongs to the user
        if (!document.getUserId().equals(userId)) {
            throw new DocumentException("Document does not belong to the user");
        }

        // Delete the file
        documentStorageService.deleteFile(document.getFilePath());

        // Delete the document metadata
        documentRepository.deleteById(document.getId());
    }

    @Transactional
    public DocumentDto updateDocumentStatus(String documentId, String status) {
        log.debug("Updating document status: {} to: {}", documentId, status);

        Document document = documentRepository.findById(new DocumentId(UUID.fromString(documentId)))
                .orElseThrow(() -> new DocumentException("Document not found"));

        document.setStatus(DocumentStatus.valueOf(status.toUpperCase()));
        Document updatedDocument = documentRepository.save(document);

        return documentMapper.toDto(updatedDocument);
    }
}