package ar.gov.mpd.concursobackend.experience.infrastructure.controller;

import ar.gov.mpd.concursobackend.experience.application.dto.ExperienceRequestDto;
import ar.gov.mpd.concursobackend.experience.application.dto.ExperienceResponseDto;
import ar.gov.mpd.concursobackend.experience.application.service.ExperienceService;
import ar.gov.mpd.concursobackend.shared.application.dto.DeletionResponseDto;
import ar.gov.mpd.concursobackend.shared.domain.exception.ResourceNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.List;
import java.util.UUID;

/**
 * REST controller for work experience resources
 */
@RestController
@RequestMapping("/api/experiencias")
@RequiredArgsConstructor
@CrossOrigin(origins = "${app.cors.allowed-origins}")
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
     * Delete an experience (soft delete)
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_USER')")
    public ResponseEntity<DeletionResponseDto> deleteExperience(@PathVariable UUID id) {
        log.info("Request to delete experience: {}", id);

        try {
            experienceService.deleteExperience(id);

            DeletionResponseDto response = DeletionResponseDto.success(
                id,
                "WorkExperience",
                "Work experience deleted successfully. You can recover it within 24 hours."
            );

            log.info("Work experience with ID: {} deleted successfully", id);
            return ResponseEntity.ok(response);

        } catch (ResourceNotFoundException ex) {
            log.warn("Work experience not found for deletion: {}", id);
            DeletionResponseDto response = DeletionResponseDto.failure(
                "Work experience not found with id: " + id
            );
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);

        } catch (Exception ex) {
            log.error("Unexpected error deleting work experience with ID: {}", id, ex);
            DeletionResponseDto response = DeletionResponseDto.failure(
                "Failed to delete work experience: " + ex.getMessage()
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
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