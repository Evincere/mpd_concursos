package ar.gov.mpd.concursobackend.education.application.service;

import java.io.InputStream;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ar.gov.mpd.concursobackend.education.application.dto.EducationRequestDto;
import ar.gov.mpd.concursobackend.education.application.dto.EducationResponseDto;
import ar.gov.mpd.concursobackend.education.application.mapper.EducationMapper;
import ar.gov.mpd.concursobackend.education.domain.model.Education;
import ar.gov.mpd.concursobackend.education.domain.repository.EducationRepository;
import ar.gov.mpd.concursobackend.document.application.service.DocumentService;
import ar.gov.mpd.concursobackend.shared.infrastructure.service.CvDocumentService;
import ar.gov.mpd.concursobackend.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Education service implementation
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class EducationServiceImpl implements EducationService {

    private final EducationRepository educationRepository;
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

        Education education = educationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Registro de educación no encontrado con id: " + id));

        // Usar documentId como segundo UUID
        UUID documentId = UUID.randomUUID();
        log.info("ID de documento generado: {}", documentId);

        try {
            // Usar el nuevo CvDocumentService para almacenamiento organizado
            log.info("Usando CvDocumentService para almacenar documento de educación");

            String documentUrl = cvDocumentService.storeEducationDocumentFromStream(
                    education.getUserId(),
                    education.getId(),
                    inputStream,
                    filename);

            if (documentUrl == null || documentUrl.isEmpty()) {
                log.error("ERROR: La URL del documento retornada por CvDocumentService es nula o vacía");
                throw new RuntimeException("Document URL is null or empty");
            }

            log.info("URL del documento generada: {}", documentUrl);

            // Actualizar el registro de educación con la URL del documento
            education.setDocumentUrl(documentUrl);
            Education savedEducation = educationRepository.save(education);

            log.info("Documento subido para el registro de educación: {}", savedEducation.getId());
            return educationMapper.toResponseDto(savedEducation);
        } catch (Exception e) {
            log.error("Error al procesar el documento: {}", e.getMessage(), e);
            throw new RuntimeException("Error processing document: " + e.getMessage(), e);
        }
    }
}