package ar.gov.mpd.concursobackend.education.infrastructure.controller;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
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

import ar.gov.mpd.concursobackend.education.application.dto.EducationRequestDto;
import ar.gov.mpd.concursobackend.education.application.dto.EducationResponseDto;
import ar.gov.mpd.concursobackend.education.application.service.EducationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Controlador REST para recursos de educación
 */
@RestController
@RequestMapping("/api/educacion")
@RequiredArgsConstructor
@Slf4j
public class EducationController {
    
    private final EducationService educationService;
    
    /**
     * Obtener todos los registros de educación para un usuario
     */
    @GetMapping("/usuario/{userId}")
    public ResponseEntity<List<EducationResponseDto>> getAllEducationByUserId(@PathVariable UUID userId) {
        log.info("Solicitud para obtener todos los registros de educación del usuario: {}", userId);
        List<EducationResponseDto> educationList = educationService.getAllEducationByUserId(userId);
        return ResponseEntity.ok(educationList);
    }
    
    /**
     * Obtener un registro de educación específico
     */
    @GetMapping("/{id}")
    public ResponseEntity<EducationResponseDto> getEducationById(@PathVariable UUID id) {
        log.info("Solicitud para obtener el registro de educación: {}", id);
        EducationResponseDto education = educationService.getEducationById(id);
        return ResponseEntity.ok(education);
    }
    
    /**
     * Crear un nuevo registro de educación para un usuario
     */
    @PostMapping("/usuario/{userId}")
    public ResponseEntity<EducationResponseDto> createEducation(
            @PathVariable UUID userId,
            @Valid @RequestBody EducationRequestDto educationDto) {
        log.info("Solicitud para crear un registro de educación para el usuario: {}", userId);
        EducationResponseDto createdEducation = educationService.createEducation(userId, educationDto);
        return new ResponseEntity<>(createdEducation, HttpStatus.CREATED);
    }
    
    /**
     * Actualizar un registro de educación existente
     */
    @PutMapping("/{id}")
    public ResponseEntity<EducationResponseDto> updateEducation(
            @PathVariable UUID id,
            @Valid @RequestBody EducationRequestDto educationDto) {
        log.info("Solicitud para actualizar el registro de educación: {}", id);
        EducationResponseDto updatedEducation = educationService.updateEducation(id, educationDto);
        return ResponseEntity.ok(updatedEducation);
    }
    
    /**
     * Eliminar un registro de educación
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEducation(@PathVariable UUID id) {
        log.info("Solicitud para eliminar el registro de educación: {}", id);
        educationService.deleteEducation(id);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Subir un documento para un registro de educación
     */
    @PostMapping(value = "/{id}/documento", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<EducationResponseDto> uploadDocument(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file) throws IOException {
        log.info("Solicitud para subir un documento para el registro de educación: {}", id);
        
        if (file.isEmpty()) {
            log.warn("Error al subir archivo vacío para el registro de educación: {}", id);
            return ResponseEntity.badRequest().build();
        }
        
        EducationResponseDto updatedEducation = educationService.uploadDocument(id, file.getInputStream(), file.getOriginalFilename());
        return ResponseEntity.ok(updatedEducation);
    }
} 