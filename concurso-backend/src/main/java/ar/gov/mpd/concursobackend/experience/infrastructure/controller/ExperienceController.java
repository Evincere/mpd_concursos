package ar.gov.mpd.concursobackend.experience.infrastructure.controller;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.List;
import java.util.UUID;

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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import ar.gov.mpd.concursobackend.experience.application.dto.ExperienceRequestDto;
import ar.gov.mpd.concursobackend.experience.application.dto.ExperienceResponseDto;
import ar.gov.mpd.concursobackend.experience.application.service.ExperienceService;
import ar.gov.mpd.concursobackend.shared.domain.exception.ResourceNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * REST controller for work experience resources
 */
@RestController
@RequestMapping("/api/experiencias")
@RequiredArgsConstructor
@CrossOrigin(origins = "${spring.mvc.cors.allowed-origins}")
@Slf4j
public class ExperienceController {

    private final ExperienceService experienceService;

    /**
     * Get all experiences for a user
     */
    @GetMapping("/usuario/{userId}")
    @PreAuthorize("hasRole('ROLE_USER')")
    public ResponseEntity<List<ExperienceResponseDto>> getAllExperiencesByUserId(@PathVariable UUID userId) {
        log.info("Request to get all experiences for user: {}", userId);
        List<ExperienceResponseDto> experienceList = experienceService.getAllExperiencesByUserId(userId);
        return ResponseEntity.ok(experienceList);
    }

    /**
     * Get a specific experience
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_USER')")
    public ResponseEntity<ExperienceResponseDto> getExperienceById(@PathVariable UUID id) {
        log.info("Request to get experience: {}", id);
        try {
            ExperienceResponseDto experience = experienceService.getExperienceById(id);
            return ResponseEntity.ok(experience);
        } catch (ResourceNotFoundException ex) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Create a new experience for a user
     */
    @PostMapping("/usuario/{userId}")
    @PreAuthorize("hasRole('ROLE_USER')")
    public ResponseEntity<ExperienceResponseDto> createExperience(
            @PathVariable UUID userId,
            @Valid @RequestBody ExperienceRequestDto experienceDto) {
        log.info("Request to create experience for user: {}", userId);
        ExperienceResponseDto createdExperience = experienceService.createExperience(userId, experienceDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdExperience);
    }

    /**
     * Update an existing experience
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_USER')")
    public ResponseEntity<ExperienceResponseDto> updateExperience(
            @PathVariable UUID id,
            @Valid @RequestBody ExperienceRequestDto experienceDto) {
        log.info("Request to update experience: {}", id);
        try {
            ExperienceResponseDto updatedExperience = experienceService.updateExperience(id, experienceDto);
            return ResponseEntity.ok(updatedExperience);
        } catch (ResourceNotFoundException ex) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Delete an experience
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_USER')")
    public ResponseEntity<Void> deleteExperience(@PathVariable UUID id) {
        log.info("Request to delete experience: {}", id);

        try {
            experienceService.deleteExperience(id);
            log.info("Experiencia con ID: {} eliminada exitosamente por el controlador", id);
            return ResponseEntity.noContent().build();
        } catch (ResourceNotFoundException ex) {
            log.warn("No se pudo eliminar la experiencia porque no existe: {}", id);
            return ResponseEntity.notFound().build();
        } catch (Exception ex) {
            log.error("Error inesperado al eliminar experiencia con ID: {}", id, ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Upload a document for an experience
     */
    @PostMapping(value = "/{id}/documento", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ROLE_USER')")
    public ResponseEntity<ExperienceResponseDto> uploadDocument(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file) {
        try {
            log.info("=========== INICIO uploadDocument ===========");
            log.info("Recibiendo solicitud para subir documento para experiencia con ID: {}", id);
            log.info("Nombre del archivo: {}, Tamaño: {} bytes, Tipo de contenido: {}, ¿Está vacío?: {}",
                    file.getOriginalFilename(), file.getSize(), file.getContentType(), file.isEmpty());

            if (file.isEmpty()) {
                log.error("Error: El archivo está vacío");
                return ResponseEntity.badRequest().build();
            }

            // Crear una copia del archivo en memoria para evitar problemas de streaming
            byte[] fileBytes = file.getBytes();
            log.info("Archivo copiado a memoria correctamente. Tamaño en bytes: {}", fileBytes.length);

            // Usar ByteArrayInputStream en lugar del InputStream original
            try (ByteArrayInputStream byteArrayInputStream = new ByteArrayInputStream(fileBytes)) {
                // Llamar al servicio para guardar el documento
                log.info("Llamando a experienceService.uploadDocument con ByteArrayInputStream...");
                ExperienceResponseDto updatedExperience = experienceService.uploadDocument(id, byteArrayInputStream,
                        file.getOriginalFilename());

                log.info("Documento procesado correctamente. URL del documento: {}",
                        updatedExperience.getDocumentUrl());
                log.info("=========== FIN uploadDocument ===========");

                return ResponseEntity.ok(updatedExperience);
            } catch (Exception e) {
                log.error("Error al procesar el documento: {}", e.getMessage(), e);
                throw e; // Re-lanzar la excepción para que sea manejada por el catch externo
            }
        } catch (ResourceNotFoundException ex) {
            log.error("Error: Experiencia no encontrada con ID: {}", id);
            return ResponseEntity.notFound().build();
        } catch (IOException ex) {
            log.error("Error de E/S al procesar el archivo para la experiencia con ID: {}", id, ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } catch (Exception ex) {
            log.error("Error inesperado al subir documento para experiencia con ID: {}", id, ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}