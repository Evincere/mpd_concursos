package ar.gov.mpd.concursobackend.education.application.service;

import ar.gov.mpd.concursobackend.document.application.service.DocumentService;
import ar.gov.mpd.concursobackend.education.application.dto.EducationRequestDto;
import ar.gov.mpd.concursobackend.education.application.dto.EducationResponseDto;
import ar.gov.mpd.concursobackend.education.application.mapper.EducationMapper;
import ar.gov.mpd.concursobackend.education.domain.model.Education;
import ar.gov.mpd.concursobackend.education.domain.repository.EducationRepository;
import ar.gov.mpd.concursobackend.education.infrastructure.persistence.entity.EducationRecordEntity;
import ar.gov.mpd.concursobackend.education.infrastructure.persistence.repository.JpaEducationRepository;
import ar.gov.mpd.concursobackend.shared.exception.ResourceNotFoundException;
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
 * Education service implementation
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class EducationServiceImpl implements EducationService {

    private final EducationRepository educationRepository;
    private final JpaEducationRepository jpaEducationRepository;
    private final EducationMapper educationMapper;
    private final DocumentService documentService;
    private final CvDocumentService cvDocumentService;

    @Override
    @Transactional(readOnly = true)
    public List<EducationResponseDto> getAllEducationByUserId(UUID userId) {
        log.info("Getting all education records for user: {}", userId);
        List<Education> educationList = educationRepository.findAllByUserId(userId);
        return educationList.stream()
                .map(educationMapper::toResponseDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public EducationResponseDto getEducationById(UUID id) {
        log.info("Obteniendo registro de educación: {}", id);
        Education education = educationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Registro de educación no encontrado con id: " + id));
        return educationMapper.toResponseDto(education);
    }

    @Override
    public EducationResponseDto createEducation(UUID userId, EducationRequestDto educationDto) {
        log.info("Creating education record for user: {}", userId);
        Education education = educationMapper.toDomainEntity(educationDto, userId);

        Education savedEducation = educationRepository.save(education);
        log.info("Education record created with ID: {}", savedEducation.getId());
        return educationMapper.toResponseDto(savedEducation);
    }

    @Override
    public EducationResponseDto updateEducation(UUID id, EducationRequestDto educationDto) {
        log.info("Actualizando registro de educación: {}", id);

        Education existingEducation = educationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Registro de educación no encontrado con id: " + id));

        Education updatedEducation = educationMapper.updateEntityFromDto(existingEducation, educationDto);
        Education savedEducation = educationRepository.save(updatedEducation);

        log.info("Registro de educación actualizado: {}", savedEducation.getId());
        return educationMapper.toResponseDto(savedEducation);
    }

    @Override
    public void deleteEducation(UUID id) {
        log.info("Eliminando registro de educación: {}", id);

        if (!educationRepository.existsById(id)) {
            throw new ResourceNotFoundException("Registro de educación no encontrado con id: " + id);
        }

        educationRepository.deleteById(id);
        log.info("Registro de educación eliminado: {}", id);
    }

    @Override
    public EducationResponseDto uploadDocument(UUID id, InputStream inputStream, String filename) {
        log.info("Subiendo documento para el registro de educación: {}", id);

        // Buscar la entidad JPA directamente para obtener el userId de manera más robusta
        EducationRecordEntity educationEntity = educationRepository.findById(id)
                .map(education -> {
                    // Convertir de dominio a entidad para obtener acceso directo al UserEntity
                    return jpaEducationRepository.findById(education.getId())
                            .orElseThrow(() -> new ResourceNotFoundException("Entidad de educación no encontrada con id: " + id));
                })
                .orElseThrow(() -> new ResourceNotFoundException("Registro de educación no encontrado con id: " + id));

        log.info("Entidad de educación encontrada: {}, usuario: {}", educationEntity.getId(), educationEntity.getUserId());

        // Usar documentId como segundo UUID
        UUID documentId = UUID.randomUUID();
        log.info("ID de documento generado: {}", documentId);

        try {
            // Usar el nuevo CvDocumentService para almacenamiento organizado
            log.info("Usando CvDocumentService para almacenar documento de educación");

            String documentUrl = cvDocumentService.storeEducationDocumentFromStream(
                    educationEntity.getUserId(),
                    educationEntity.getId(),
                    inputStream,
                    filename);

            if (documentUrl == null || documentUrl.isEmpty()) {
                log.error("ERROR: La URL del documento retornada por CvDocumentService es nula o vacía");
                throw new RuntimeException("Document URL is null or empty");
            }

            log.info("URL del documento generada: {}", documentUrl);

            // Actualizar la entidad JPA directamente con la URL del documento
            educationEntity.setSupportingDocumentUrl(documentUrl);
            EducationRecordEntity savedEntity = jpaEducationRepository.save(educationEntity);

            log.info("Documento subido para el registro de educación: {}", savedEntity.getId());

            // Convertir la entidad actualizada de vuelta al dominio y luego al DTO
            Education updatedEducation = educationRepository.findById(savedEntity.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("No se pudo recuperar la educación actualizada"));

            return educationMapper.toResponseDto(updatedEducation);
        } catch (Exception e) {
            log.error("Error al procesar el documento: {}", e.getMessage(), e);
            throw new RuntimeException("Error processing document: " + e.getMessage(), e);
        }
    }
}