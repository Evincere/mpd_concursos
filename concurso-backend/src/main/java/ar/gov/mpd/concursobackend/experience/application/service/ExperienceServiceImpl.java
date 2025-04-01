package ar.gov.mpd.concursobackend.experience.application.service;

import java.io.InputStream;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ar.gov.mpd.concursobackend.auth.infrastructure.database.entities.UserEntity;
import ar.gov.mpd.concursobackend.auth.infrastructure.database.repository.UserRepository;
import ar.gov.mpd.concursobackend.document.application.service.DocumentService;
import ar.gov.mpd.concursobackend.experience.application.dto.ExperienceRequestDto;
import ar.gov.mpd.concursobackend.experience.application.dto.ExperienceResponseDto;
import ar.gov.mpd.concursobackend.experience.application.mapper.ExperienceMapper;
import ar.gov.mpd.concursobackend.experience.domain.model.Experience;
import ar.gov.mpd.concursobackend.experience.infrastructure.persistence.ExperienceEntity;
import ar.gov.mpd.concursobackend.experience.infrastructure.persistence.ExperienceEntityMapper;
import ar.gov.mpd.concursobackend.experience.infrastructure.persistence.ExperienceRepository;
import ar.gov.mpd.concursobackend.shared.domain.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Implementation of the ExperienceService
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ExperienceServiceImpl implements ExperienceService {

    private final ExperienceRepository experienceRepository;
    private final UserRepository userRepository;
    private final ExperienceMapper experienceMapper;
    private final ExperienceEntityMapper entityMapper;
    private final DocumentService documentService;

    @Override
    @Transactional(readOnly = true)
    public List<ExperienceResponseDto> getAllExperiencesByUserId(UUID userId) {
        log.info("Getting all experiences for user: {}", userId);

        UserEntity userEntity = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        List<ExperienceEntity> experienceEntities = experienceRepository.findByUser(userEntity);
        List<Experience> experiences = entityMapper.toDomainList(experienceEntities);

        return experienceMapper.toResponseDtoList(experiences);
    }

    @Override
    @Transactional(readOnly = true)
    public ExperienceResponseDto getExperienceById(UUID id) {
        log.info("Getting experience with id: {}", id);

        ExperienceEntity experienceEntity = experienceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Experience not found with id: " + id));

        Experience experience = entityMapper.toDomain(experienceEntity);

        return experienceMapper.toResponseDto(experience);
    }

    @Override
    @Transactional
    public ExperienceResponseDto createExperience(UUID userId, ExperienceRequestDto experienceDto) {
        log.info("Creating new experience for user: {}", userId);

        UserEntity userEntity = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        Experience experience = experienceMapper.toDomain(experienceDto, userId);
        ExperienceEntity experienceEntity = entityMapper.toEntity(experience, userEntity);

        ExperienceEntity savedEntity = experienceRepository.save(experienceEntity);
        Experience savedExperience = entityMapper.toDomain(savedEntity);

        return experienceMapper.toResponseDto(savedExperience);
    }

    @Override
    @Transactional
    public ExperienceResponseDto updateExperience(UUID id, ExperienceRequestDto experienceDto) {
        log.info("Updating experience with id: {}", id);

        ExperienceEntity existingEntity = experienceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Experience not found with id: " + id));

        Experience existingExperience = entityMapper.toDomain(existingEntity);
        Experience updatedExperience = experienceMapper.updateDomainFromDto(existingExperience, experienceDto);

        ExperienceEntity updatedEntity = entityMapper.toEntity(updatedExperience, existingEntity.getUser());
        updatedEntity.setId(id); // Ensure ID is preserved
        updatedEntity.setDocumentUrl(existingEntity.getDocumentUrl()); // Preserve document URL

        ExperienceEntity savedEntity = experienceRepository.save(updatedEntity);
        Experience savedExperience = entityMapper.toDomain(savedEntity);

        return experienceMapper.toResponseDto(savedExperience);
    }

    @Override
    @Transactional
    public void deleteExperience(UUID id) {
        log.info("Iniciando proceso de eliminación de experiencia con id: {}", id);

        if (!experienceRepository.existsById(id)) {
            log.warn("Experiencia no encontrada con id: {}", id);
            throw new ResourceNotFoundException("Experience not found with id: " + id);
        }

        // Obtener la entidad antes de eliminarla para verificar datos
        ExperienceEntity experienceEntity = experienceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Experience not found with id: " + id));

        log.info("Eliminando experiencia con id: {}, empresa: {}, cargo: {}",
                id, experienceEntity.getCompany(), experienceEntity.getPosition());

        try {
            // Verificar si hay un documento asociado y eliminarlo si existe
            if (experienceEntity.getDocumentUrl() != null && !experienceEntity.getDocumentUrl().isEmpty()) {
                try {
                    // Extraer el ID del documento de la URL (formato: /api/documentos/{id}/file)
                    String documentUrl = experienceEntity.getDocumentUrl();
                    if (documentUrl.contains("/documentos/") && documentUrl.contains("/file")) {
                        String documentIdStr = documentUrl.substring(
                                documentUrl.indexOf("/documentos/") + "/documentos/".length(),
                                documentUrl.lastIndexOf("/file"));
                        try {
                            UUID documentId = UUID.fromString(documentIdStr);
                            log.info("Intentando eliminar documento asociado con ID: {}", documentId);
                            // Aquí podrías llamar al servicio de documentos para eliminar el archivo
                            // documentService.deleteDocument(documentId);
                        } catch (IllegalArgumentException e) {
                            log.warn("No se pudo extraer un UUID válido de la URL del documento: {}", documentUrl);
                        }
                    }
                } catch (Exception e) {
                    log.warn("Error al intentar eliminar el documento asociado: {}", e.getMessage());
                    // Continuamos con la eliminación de la experiencia aunque falle la eliminación
                    // del documento
                }
            }

            // Primer intento: usar el método delete normal
            try {
                experienceRepository.delete(experienceEntity);
                experienceRepository.flush(); // Forzar la sincronización con la base de datos
            } catch (Exception e) {
                log.warn("Falló el método delete estándar: {}", e.getMessage());
                // No relanzar la excepción, intentaremos con JPQL
            }

            // Verificar si se eliminó
            if (experienceRepository.existsById(id)) {
                log.warn("La experiencia sigue existiendo después del primer intento. Intentando con JPQL...");

                // Segundo intento: usar JPQL para eliminar directamente
                int deleted = experienceRepository.deleteExperienceDirectly(id);
                log.info("Registros eliminados usando JPQL: {}", deleted);

                // Si JPQL no funcionó, intentar con SQL nativo
                if (deleted == 0 && experienceRepository.existsById(id)) {
                    log.warn("JPQL no eliminó la experiencia. Último intento con SQL nativo...");
                    deleted = experienceRepository.deleteExperienceWithNativeQuery(id);
                    log.info("Registros eliminados usando SQL nativo: {}", deleted);
                }
            }

            // Verificación final
            boolean stillExists = experienceRepository.existsById(id);
            if (stillExists) {
                log.error("La experiencia con ID: {} sigue existiendo después de intentar eliminarla", id);
                throw new RuntimeException("No se pudo eliminar la experiencia con ID: " + id);
            } else {
                log.info("Experiencia eliminada correctamente con id: {}", id);
            }
        } catch (Exception e) {
            log.error("Error al eliminar experiencia con id: {}", id, e);
            throw new RuntimeException("Error deleting experience: " + e.getMessage(), e);
        }
    }

    @Override
    @Transactional
    public ExperienceResponseDto uploadDocument(UUID id, InputStream inputStream, String filename) {
        log.info("Subiendo documento para experiencia con ID: {}", id);

        ExperienceEntity experienceEntity = experienceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Experience not found with id: " + id));

        log.info("Experiencia encontrada: {}, usuario: {}", experienceEntity.getId(),
                experienceEntity.getUser().getId());

        // Generate a document ID
        UUID documentId = UUID.randomUUID();
        log.info("ID de documento generado: {}", documentId);

        try {
            // Usar documentService.saveDocument que maneja tanto el almacenamiento físico
            // como los metadatos
            log.info("Llamando a documentService.saveDocument");
            String documentUrl = documentService.saveDocument(
                    inputStream,
                    filename,
                    documentId,
                    experienceEntity.getUser().getId());

            if (documentUrl == null || documentUrl.isEmpty()) {
                log.error("ERROR: La URL del documento retornada por saveDocument es nula o vacía");
                throw new RuntimeException("Document URL is null or empty");
            }

            log.info("URL del documento generada: {}", documentUrl);

            // Update the experience with the document URL
            experienceEntity.setDocumentUrl(documentUrl);
            log.info("URL del documento establecida en la entidad de experiencia: {}", documentUrl);

            // Guardar la entidad con el nuevo URL del documento
            ExperienceEntity updatedEntity = experienceRepository.save(experienceEntity);
            log.info("Experiencia actualizada con la URL del documento");

            // Verificar que el documento se guardó correctamente
            if (updatedEntity.getDocumentUrl() == null || !updatedEntity.getDocumentUrl().equals(documentUrl)) {
                log.error("ERROR: La URL del documento no se guardó correctamente en la experiencia");
                throw new RuntimeException("Failed to save document URL in experience");
            }

            // Convert back to domain model and response DTO
            Experience updatedExperience = entityMapper.toDomain(updatedEntity);
            ExperienceResponseDto responseDto = experienceMapper.toResponseDto(updatedExperience);

            log.info("Proceso de carga de documento completado exitosamente");
            return responseDto;

        } catch (Exception e) {
            log.error("Error al procesar el documento: {}", e.getMessage(), e);
            throw new RuntimeException("Error processing document: " + e.getMessage(), e);
        }
    }
}