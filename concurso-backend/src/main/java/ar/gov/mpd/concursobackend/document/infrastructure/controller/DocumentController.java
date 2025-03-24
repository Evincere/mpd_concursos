package ar.gov.mpd.concursobackend.document.infrastructure.controller;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
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
            @RequestParam(value = "tipoDocumentoId", required = false) String documentTypeId,
            @RequestParam(value = "comentarios", required = false) String comments,
            @RequestParam(value = "referenciaId", required = false) String referenciaId,
            @RequestParam(value = "tipoReferencia", required = false) String tipoReferencia) {

        try {
            log.debug("Recibiendo solicitud para subir documento. Type: {}, Ref: {}, RefType: {}",
                    documentTypeId, referenciaId, tipoReferencia);

            // Si es un documento de experiencia laboral
            if (tipoReferencia != null && tipoReferencia.equals("EXPERIENCIA") && referenciaId != null) {
                try {
                    UUID userId = UUID.fromString(securityUtils.getCurrentUserId());
                    UUID experienciaUUID = UUID.fromString(referenciaId);

                    log.debug("Procesando documento de experiencia laboral. userId: {}, experienciaId: {}",
                            userId, experienciaUUID);

                    // Usar el método saveDocument para documentos de experiencia
                    String documentUrl = documentService.saveDocument(
                            file.getInputStream(),
                            file.getOriginalFilename(),
                            experienciaUUID,
                            userId);

                    log.debug("Documento de experiencia guardado correctamente. URL: {}", documentUrl);

                    DocumentResponse response = DocumentResponse.builder()
                            .id(UUID.randomUUID().toString()) // ID temporal para mantener compatibilidad de respuesta
                            .mensaje("Documento de experiencia cargado correctamente")
                            .documento(DocumentDto.builder()
                                    .nombreArchivo(file.getOriginalFilename())
                                    .contentType(file.getContentType())
                                    .estado("UPLOADED")
                                    .comentarios("Documento de experiencia laboral")
                                    .fechaCarga(LocalDateTime.now())
                                    .build())
                            .build();

                    return ResponseEntity.status(HttpStatus.CREATED).body(response);
                } catch (Exception e) {
                    log.error("Error al procesar documento de experiencia", e);
                    throw e; // Re-lanzar para el catch externo
                }
            }

            // Procesamiento normal para otros tipos de documentos
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
        } catch (Exception e) {
            log.error("Error inesperado al subir documento", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/experiencias/{experienciaId}/documento")
    @PreAuthorize("hasRole('ROLE_USER')")
    public ResponseEntity<Map<String, String>> uploadExperienceDocument(
            @PathVariable("experienciaId") String experienciaId,
            @RequestParam("file") MultipartFile file) {

        try {
            log.info("Recibiendo solicitud para subir documento de experiencia con ID: {}", experienciaId);

            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Collections.singletonMap("error", "El archivo está vacío"));
            }

            // Obtener el ID del usuario autenticado
            String userIdStr = securityUtils.getCurrentUserId();
            if (userIdStr == null) {
                log.error("No se pudo obtener el ID del usuario actual");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Collections.singletonMap("error", "Usuario no autenticado"));
            }

            UUID userId = UUID.fromString(userIdStr);
            log.info("ID de usuario encontrado: {}", userId);

            String documentUrl = documentService.saveDocument(
                    file.getInputStream(),
                    file.getOriginalFilename(),
                    UUID.fromString(experienciaId),
                    userId);

            log.info("Documento de experiencia subido correctamente: {}", documentUrl);

            return ResponseEntity.ok(Collections.singletonMap("url", documentUrl));
        } catch (IOException e) {
            log.error("Error al procesar el archivo: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("error", "Error al procesar el archivo: " + e.getMessage()));
        } catch (Exception e) {
            log.error("Error inesperado al subir documento de experiencia: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("error", "Error inesperado: " + e.getMessage()));
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