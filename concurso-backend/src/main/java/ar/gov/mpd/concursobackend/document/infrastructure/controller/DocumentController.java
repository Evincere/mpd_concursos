package ar.gov.mpd.concursobackend.document.infrastructure.controller;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import ar.gov.mpd.concursobackend.document.application.dto.DocumentDto;
import ar.gov.mpd.concursobackend.document.application.dto.DocumentResponse;
import ar.gov.mpd.concursobackend.document.application.dto.DocumentTypeDto;
import ar.gov.mpd.concursobackend.document.application.dto.DocumentUploadRequest;
import ar.gov.mpd.concursobackend.document.application.service.DocumentService;
import ar.gov.mpd.concursobackend.document.application.service.DocumentTypeService;
import ar.gov.mpd.concursobackend.shared.infrastructure.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/documentos")
@RequiredArgsConstructor
@CrossOrigin(origins = "${spring.mvc.cors.allowed-origins}")
@Slf4j
public class DocumentController {

    private final DocumentService documentService;
    private final DocumentTypeService documentTypeService;
    private final SecurityUtils securityUtils;

    @GetMapping("/tipos")
    @PreAuthorize("hasRole('ROLE_USER')")
    public ResponseEntity<List<DocumentTypeDto>> getDocumentTypes() {
        return ResponseEntity.ok(documentTypeService.getAllDocumentTypes());
    }

    @GetMapping("/usuario")
    @PreAuthorize("hasRole('ROLE_USER')")
    public ResponseEntity<List<DocumentDto>> getUserDocuments() {
        UUID userId = UUID.fromString(securityUtils.getCurrentUserId());
        return ResponseEntity.ok(documentService.getUserDocuments(userId));
    }

    @PostMapping("/upload")
    @PreAuthorize("hasRole('ROLE_USER')")
    public ResponseEntity<DocumentResponse> uploadDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam("tipoDocumentoId") String documentTypeId,
            @RequestParam(value = "comentarios", required = false) String comments) {

        try {
            DocumentUploadRequest request = DocumentUploadRequest.builder()
                    .documentTypeId(documentTypeId)
                    .fileName(file.getOriginalFilename())
                    .contentType(file.getContentType())
                    .comments(comments)
                    .build();

            UUID userId = UUID.fromString(securityUtils.getCurrentUserId());
            DocumentResponse response = documentService.uploadDocument(
                    request,
                    file.getInputStream(),
                    userId);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IOException e) {
            log.error("Error uploading document", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}/file")
    @PreAuthorize("hasRole('ROLE_USER')")
    public ResponseEntity<InputStreamResource> getDocumentFile(@PathVariable("id") String documentId) {
        try {
            UUID userId = UUID.fromString(securityUtils.getCurrentUserId());
            DocumentDto document = documentService.getDocumentMetadata(documentId, userId);
            InputStreamResource resource = new InputStreamResource(
                    documentService.getDocumentFile(documentId, userId));

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + document.getNombreArchivo() + "\"")
                    .contentType(MediaType.parseMediaType(document.getContentType()))
                    .body(resource);
        } catch (Exception e) {
            log.error("Error getting document file", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_USER')")
    public ResponseEntity<Void> deleteDocument(@PathVariable("id") String documentId) {
        UUID userId = UUID.fromString(securityUtils.getCurrentUserId());
        documentService.deleteDocument(documentId, userId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<DocumentDto> updateDocumentStatus(
            @PathVariable("id") String documentId,
            @RequestParam("estado") String status) {

        return ResponseEntity.ok(documentService.updateDocumentStatus(documentId, status));
    }
}