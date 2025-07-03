package ar.gov.mpd.concursobackend.experience.application.service;

import ar.gov.mpd.concursobackend.auth.infrastructure.database.entities.UserEntity;
import ar.gov.mpd.concursobackend.auth.infrastructure.database.repository.spring.IUserSpringRepository;
import ar.gov.mpd.concursobackend.document.application.service.DocumentService;
import ar.gov.mpd.concursobackend.experience.application.dto.ExperienceRequestDto;
import ar.gov.mpd.concursobackend.experience.application.dto.ExperienceResponseDto;
import ar.gov.mpd.concursobackend.experience.application.mapper.ExperienceMapper;
import ar.gov.mpd.concursobackend.experience.domain.model.Experience;
import ar.gov.mpd.concursobackend.experience.infrastructure.persistence.ExperienceEntityMapper;
import ar.gov.mpd.concursobackend.experience.infrastructure.persistence.ExperienceRepository;
import ar.gov.mpd.concursobackend.experience.infrastructure.persistence.WorkExperienceEntity;
import ar.gov.mpd.concursobackend.shared.domain.exception.ResourceNotFoundException;
import ar.gov.mpd.concursobackend.shared.infrastructure.service.CvDocumentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Implementation of the ExperienceService
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ExperienceServiceImpl implements ExperienceService {

    private final ExperienceRepository experienceRepository;
    private final IUserSpringRepository userRepository;
    private final ExperienceMapper experienceMapper;
    private final ExperienceEntityMapper entityMapper;
    private final DocumentService documentService;
    private final WorkExperienceDeletionService deletionService;
    private final CvDocumentService cvDocumentService;

    @Override
    @Transactional(readOnly = true)
    public List<ExperienceResponseDto> getAllExperiencesByUserId(UUID userId) {
        log.info("Getting all experiences for user: {}", userId);

        // Use findAllByUserId and filter manually to avoid issues with JPA soft delete queries
        List<WorkExperienceEntity> allExperienceEntities = experienceRepository.findAllByUserId(userId);
        List<WorkExperienceEntity> experienceEntities = allExperienceEntities.stream()
                .filter(entity -> entity.getIsDeleted() == null || !entity.getIsDeleted())
                .collect(Collectors.toList());

        List<Experience> experiences = entityMapper.toDomainList(experienceEntities);
        return experienceMapper.toResponseDtoList(experiences);
    }

    @Override
    @Transactional(readOnly = true)
    public ExperienceResponseDto getExperienceById(UUID id) {
        log.info("Getting experience with id: {}", id);

        WorkExperienceEntity experienceEntity = experienceRepository.findById(id)
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
        WorkExperienceEntity experienceEntity = entityMapper.toEntity(experience, userEntity);

        WorkExperienceEntity savedEntity = experienceRepository.save(experienceEntity);
        Experience savedExperience = entityMapper.toDomain(savedEntity);

        return experienceMapper.toResponseDto(savedExperience);
    }

    @Override
    @Transactional
    public ExperienceResponseDto updateExperience(UUID id, ExperienceRequestDto experienceDto) {
        log.info("Updating experience with id: {}", id);

        WorkExperienceEntity existingEntity = experienceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Experience not found with id: " + id));

        Experience existingExperience = entityMapper.toDomain(existingEntity);
        Experience updatedExperience = experienceMapper.updateDomainFromDto(existingExperience, experienceDto);

        WorkExperienceEntity updatedEntity = entityMapper.toEntity(updatedExperience, existingEntity.getUser());
        updatedEntity.setId(id); // Ensure ID is preserved
        updatedEntity.setSupportingDocumentUrl(existingEntity.getSupportingDocumentUrl()); // Preserve document URL

        WorkExperienceEntity savedEntity = experienceRepository.save(updatedEntity);
        Experience savedExperience = entityMapper.toDomain(savedEntity);

        return experienceMapper.toResponseDto(savedExperience);
    }

    @Override
    @Transactional
    public void deleteExperience(UUID id) {
        log.info("Deleting work experience with id: {}", id);

        try {
            // Use the simplified deletion service
            deletionService.deleteWorkExperience(id);
            log.info("Work experience with id: {} deleted successfully", id);

        } catch (Exception e) {
            log.error("Failed to delete work experience with id: {}: {}", id, e.getMessage(), e);
            throw e; // Re-throw to maintain existing API contract
        }
    }

    @Override
    @Transactional
    public ExperienceResponseDto uploadDocument(UUID id, InputStream inputStream, String filename) {
        log.info("Subiendo documento para experiencia con ID: {}", id);

        WorkExperienceEntity experienceEntity = experienceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Experience not found with id: " + id));

        log.info("Experiencia encontrada: {}, usuario: {}", experienceEntity.getId(),
                experienceEntity.getUser().getId());

        try {
            // Usar el nuevo CvDocumentService para almacenamiento organizado
            log.info("Usando CvDocumentService para almacenar documento de experiencia");

            String documentUrl = cvDocumentService.storeExperienceDocumentFromStream(
                    experienceEntity.getUser().getId(),
                    experienceEntity.getId(),
                    inputStream,
                    filename);

            if (documentUrl == null || documentUrl.isEmpty()) {
                log.error("ERROR: La URL del documento retornada por CvDocumentService es nula o vacía");
                throw new RuntimeException("Document URL is null or empty");
            }

            log.info("URL del documento generada: {}", documentUrl);

            // Update the experience with the document URL
            experienceEntity.setSupportingDocumentUrl(documentUrl);
            log.info("URL del documento establecida en la entidad de experiencia: {}", documentUrl);

            // Guardar la entidad con el nuevo URL del documento
            WorkExperienceEntity updatedEntity = experienceRepository.save(experienceEntity);
            log.info("Experiencia actualizada con la URL del documento");

            // Verificar que el documento se guardó correctamente
            if (updatedEntity.getSupportingDocumentUrl() == null
                    || !updatedEntity.getSupportingDocumentUrl().equals(documentUrl)) {
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