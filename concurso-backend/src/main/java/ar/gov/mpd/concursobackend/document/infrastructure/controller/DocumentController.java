package ar.gov.mpd.concursobackend.document.infrastructure.controller;

import ar.gov.mpd.concursobackend.document.application.dto.*;
import ar.gov.mpd.concursobackend.document.application.service.DocumentService;
import ar.gov.mpd.concursobackend.document.application.service.DocumentTypeService;
import ar.gov.mpd.concursobackend.document.application.service.DocumentValidationService;
import ar.gov.mpd.concursobackend.document.domain.exception.DocumentException;
import ar.gov.mpd.concursobackend.shared.infrastructure.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/documentos")
@RequiredArgsConstructor
@CrossOrigin(origins = "${app.cors.allowed-origins}")
@Slf4j
public class DocumentController {

    private final DocumentService documentService;
    private final DocumentTypeService documentTypeService;
    private final DocumentValidationService documentValidationService;
    private final SecurityUtils securityUtils;

    @GetMapping("/tipos")
    @PreAuthorize("hasRole('ROLE_USER')")
    public ResponseEntity<List<DocumentTypeDto>> getDocumentTypes() {
        log.debug("REST request to get all active document types");
        return ResponseEntity.ok(documentTypeService.getAllActiveDocumentTypes());
    }

    @GetMapping("/usuario")
    @PreAuthorize("hasRole('ROLE_USER')")
    public ResponseEntity<List<DocumentDto>> getUserDocuments() {
        log.debug("🔍 [DocumentController] Solicitando documentos del usuario");

        String currentUserIdStr = securityUtils.getCurrentUserId();
        log.debug("🔍 [DocumentController] ID del usuario obtenido: {}", currentUserIdStr);

        if (currentUserIdStr == null) {
            log.error("❌ [DocumentController] No se pudo obtener el ID del usuario actual");
            return ResponseEntity.badRequest().build();
        }

        UUID userId = UUID.fromString(currentUserIdStr);
        log.debug("🔍 [DocumentController] UUID del usuario: {}", userId);

        List<DocumentDto> documents = documentService.getUserDocuments(userId);
        log.debug("✅ [DocumentController] Documentos encontrados: {}", documents.size());

        if (!documents.isEmpty()) {
            log.debug("📄 [DocumentController] Primer documento: {}", documents.get(0));
        }

        return ResponseEntity.ok(documents);
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
            log.info("=== INICIO UPLOAD DOCUMENTO ===");
            log.info("Archivo: {}, Tamaño: {} bytes", file.getOriginalFilename(), file.getSize());
            log.info("Tipo documento ID: {}", documentTypeId);
            log.info("Comentarios: {}", comments);
            log.info("Referencia ID: {}", referenciaId);
            log.info("Tipo referencia: {}", tipoReferencia);
            log.debug("Recibiendo solicitud para subir documento. Type: {}, Ref: {}, RefType: {}",
                    documentTypeId, referenciaId, tipoReferencia);

            // CRITICAL FIX: Validar que el archivo no esté vacío
            if (file.isEmpty()) {
                log.error("El archivo está vacío");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(DocumentResponse.builder()
                                .id("")
                                .mensaje("El archivo está vacío")
                                .build());
            }

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
            // Validar que no exista documento previo del mismo tipo para el usuario
            if (documentService.userHasDocumentOfType(userId, documentTypeId)) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(DocumentResponse.builder()
                                .id("")
                                .mensaje("Ya existe un documento de este tipo para el usuario. Elimine el documento anterior antes de cargar uno nuevo.")
                                .build());
            }
            DocumentResponse response = documentService.uploadDocument(
                    request,
                    file.getInputStream(),
                    userId);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IOException e) {
            log.error("Error uploading document - IOException", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(DocumentResponse.builder()
                            .id("")
                            .mensaje("Error de E/O al procesar el archivo: " + e.getMessage())
                            .build());
        } catch (DocumentException e) {
            log.error("Error uploading document - DocumentException", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(DocumentResponse.builder()
                            .id("")
                            .mensaje("Error en el documento: " + e.getMessage())
                            .build());
        } catch (ObjectOptimisticLockingFailureException e) {
            log.warn("Document upload failed due to optimistic locking conflict: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(DocumentResponse.builder()
                            .id("")
                            .mensaje("El documento está siendo procesado por otra operación. Por favor, inténtelo nuevamente.")
                            .build());
        } catch (Exception e) {
            log.error("Error inesperado al subir documento", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(DocumentResponse.builder()
                            .id("")
                            .mensaje("Error interno del servidor: " + e.getMessage())
                            .build());
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
        log.debug("🔍 [DocumentController] Solicitando archivo de documento: {}", documentId);

        try {
            // Obtener ID del usuario actual
            String currentUserIdStr = securityUtils.getCurrentUserId();
            if (currentUserIdStr == null) {
                log.error("❌ [DocumentController] No se pudo obtener el ID del usuario actual");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            UUID userId = UUID.fromString(currentUserIdStr);
            log.debug("🔍 [DocumentController] ID del usuario obtenido: {}", userId);

            // Obtener metadatos del documento
            DocumentDto document = documentService.getDocumentMetadata(documentId, userId);
            log.debug("🔍 [DocumentController] Metadatos del documento obtenidos: {}", document.getNombreArchivo());

            // Obtener el archivo
            InputStream fileStream = documentService.getDocumentFile(documentId, userId);
            InputStreamResource resource = new InputStreamResource(fileStream);
            log.debug("✅ [DocumentController] Archivo del documento obtenido exitosamente");

            // Usar 'inline' para permitir visualización en el navegador
            // en lugar de 'attachment' que fuerza descarga
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "inline; filename=\"" + document.getNombreArchivo() + "\"")
                    .contentType(MediaType.parseMediaType(document.getContentType()))
                    .body(resource);

        } catch (IllegalArgumentException e) {
            log.error("❌ [DocumentController] ID de documento inválido: {}", documentId, e);
            return ResponseEntity.badRequest().build();
        } catch (DocumentException e) {
            log.error("❌ [DocumentController] Error de documento: {}", e.getMessage(), e);
            if (e.getMessage().contains("not found")) {
                return ResponseEntity.notFound().build();
            } else if (e.getMessage().contains("does not belong")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            } else {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
            }
        } catch (IOException e) {
            log.error("❌ [DocumentController] Error de E/S al leer archivo: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } catch (Exception e) {
            log.error("❌ [DocumentController] Error inesperado al obtener archivo de documento: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_USER')")
    public ResponseEntity<DocumentResponse> updateDocument(
            @PathVariable("id") String documentId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "tipoDocumentoId", required = false) String tipoDocumentoId,
            @RequestParam(value = "comentarios", required = false) String comentarios) {

        try {
            String userIdString = securityUtils.getCurrentUserId();
            log.info("=== DEBUG: userIdString obtenido de SecurityUtils: '{}'", userIdString);
            UUID userId = UUID.fromString(userIdString);
            log.info("=== DEBUG: UUID generado: '{}'", userId);
            log.info("=== DEBUG: Llamando a documentService.uploadDocument con userId: '{}'", userId);

            // Crear request para actualización
            DocumentUploadRequest request = DocumentUploadRequest.builder()
                    .fileName(file.getOriginalFilename())
                    .contentType(file.getContentType())
                    .documentTypeId(tipoDocumentoId)
                    .comments(comentarios)
                    .build();

            DocumentResponse response = documentService.updateDocument(documentId, request, file.getInputStream(), userId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error updating document", e);
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

    /**
     * Valida un documento antes de subirlo
     *
     * @param file Archivo a validar
     * @return Resultado de la validación
     */
    @PostMapping("/validate")
    @PreAuthorize("hasRole('ROLE_USER')")
    public ResponseEntity<DocumentValidationResult> validateDocument(
            @RequestParam("file") MultipartFile file) {

        log.debug("REST request to validate document: {}", file.getOriginalFilename());

        try {
            DocumentValidationResult result = documentValidationService.validateFile(file);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error validating document", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}