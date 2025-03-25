package ar.gov.mpd.concursobackend.document.infrastructure.rest;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Collections;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import ar.gov.mpd.concursobackend.document.application.service.DocumentService;
import ar.gov.mpd.concursobackend.experience.application.dto.ExperienceResponseDto;
import ar.gov.mpd.concursobackend.experience.application.service.ExperienceService;
import ar.gov.mpd.concursobackend.shared.infrastructure.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Controlador alternativo para manejar las rutas de documentos relacionados con
 * experiencias en caso de fallo del principal
 */
@RestController
@RequestMapping("/api/documentos/experiencias")
@RequiredArgsConstructor
@CrossOrigin(origins = "${spring.mvc.cors.allowed-origins}")
@Slf4j
public class ExperienceDocumentController {

    private final DocumentService documentService;
    private final ExperienceService experienceService;
    private final SecurityUtils securityUtils;

    @PostMapping(value = "/{experienciaId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ROLE_USER')")
    public ResponseEntity<Map<String, String>> uploadExperienceDocument(
            @PathVariable("experienciaId") String experienciaId,
            @RequestParam("file") MultipartFile file) {

        log.info("=== INICIO uploadExperienceDocument (ruta alternativa) ===");
        log.info("Recibiendo solicitud para subir documento de experiencia con ID: {}", experienciaId);
        log.info("Nombre del archivo: {}, tamaño: {} bytes, contentType: {}",
                file.getOriginalFilename(), file.getSize(), file.getContentType());

        try {
            if (file.isEmpty()) {
                log.warn("Error: El archivo está vacío");
                return ResponseEntity.badRequest().body(Collections.singletonMap("error", "El archivo está vacío"));
            }

            // Obtener el ID del usuario autenticado
            String userIdStr = securityUtils.getCurrentUserId();
            if (userIdStr == null) {
                log.error("Error: No se pudo obtener el ID del usuario actual");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Collections.singletonMap("error", "Usuario no autenticado"));
            }

            UUID userId = UUID.fromString(userIdStr);
            log.info("ID de usuario encontrado: {}", userId);

            // Validar ID de experiencia
            UUID experienciaUUID;
            try {
                experienciaUUID = UUID.fromString(experienciaId);
                log.info("ID de experiencia validado correctamente: {}", experienciaUUID);
            } catch (IllegalArgumentException e) {
                log.error("Error: ID de experiencia inválido: {}", experienciaId, e);
                return ResponseEntity.badRequest()
                        .body(Collections.singletonMap("error", "ID de experiencia inválido"));
            }

            try {
                log.info("Llamando a experienceService.uploadDocument para guardar el documento de experiencia");

                // Guardar el archivo como un array de bytes para evitar problemas de streams cerrados
                byte[] fileBytes = file.getBytes();
                log.info("Archivo convertido a bytes correctamente. Tamaño: {} bytes", fileBytes.length);

                // Usar ByteArrayInputStream para evitar problemas de streaming
                try (ByteArrayInputStream byteArrayInputStream = new ByteArrayInputStream(fileBytes)) {
                    log.info("Creado ByteArrayInputStream a partir de los bytes del archivo");
                    var updatedExperience = experienceService.uploadDocument(
                            experienciaUUID,
                            byteArrayInputStream,
                            file.getOriginalFilename());

                    String documentUrl = updatedExperience.getDocumentUrl();
                    log.info("Documento de experiencia subido y asociado correctamente. URL: {}", documentUrl);
                    log.info("=== FIN uploadExperienceDocument ===");

                    return ResponseEntity.ok(Collections.singletonMap("url", documentUrl));
                } catch (Exception e) {
                    log.error("Error específico al guardar documento de experiencia a través de experienceService: {}",
                            e.getMessage(), e);

                    // Intento alternativo con documentService
                    log.info("Intentando guardar el documento usando documentService como alternativa");

                    try (ByteArrayInputStream backupInputStream = new ByteArrayInputStream(fileBytes)) {
                        log.info("Creado ByteArrayInputStream alternativo a partir de los bytes del archivo");
                        String documentUrl = documentService.saveDocument(
                                backupInputStream,
                                file.getOriginalFilename(),
                                experienciaUUID,
                                userId);

                        log.info("Documento guardado correctamente con documentService. URL generada: {}", documentUrl);
                        log.info("=== FIN uploadExperienceDocument (alternativo) ===");

                        return ResponseEntity.ok(Collections.singletonMap("url", documentUrl));
                    } catch (Exception innerException) {
                        log.error("Error también en el método alternativo: {}", innerException.getMessage(),
                                innerException);
                        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                .body(Collections.singletonMap("error",
                                        "Error al guardar el documento (ambos métodos fallaron): "
                                                + innerException.getMessage()));
                    }
                }
            } catch (IOException e) {
                log.error("Error general al manejar el documento: {}", e.getMessage(), e);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Collections.singletonMap("error",
                                "Error general al manejar el documento: " + e.getMessage()));
            }

        } catch (Exception e) {
            // Capturamos cualquier excepción que pueda ocurrir, incluidas las de IO
            log.error("Error al procesar el archivo o en el proceso general: {}", e.getMessage());
            log.error("Detalles de la excepción:", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("error", "Error al procesar: " + e.getMessage()));
        } finally {
            log.info("=== FIN uploadExperienceDocument (en finally) ===");
        }
    }
}