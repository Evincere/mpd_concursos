package ar.gov.mpd.concursobackend.contest.application;

import ar.gov.mpd.concursobackend.contest.infrastructure.database.entities.ContestRequirementEntity;
import ar.gov.mpd.concursobackend.contest.infrastructure.database.entities.ContestEntity;
import ar.gov.mpd.concursobackend.contest.infrastructure.database.repository.ContestRequirementJpaRepository;
import ar.gov.mpd.concursobackend.contest.infrastructure.database.repository.ContestJpaRepository;
import ar.gov.mpd.concursobackend.contest.infrastructure.dto.ContestRequirementCreateRequest;
import ar.gov.mpd.concursobackend.contest.infrastructure.dto.ContestRequirementUpdateRequest;
import ar.gov.mpd.concursobackend.contest.application.dto.ContestRequirementDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ContestRequirementService {

    private final ContestRequirementJpaRepository requirementRepository;
    private final ContestJpaRepository contestRepository;

    /**
     * Obtiene todos los requisitos de un concurso
     */
    @Transactional(readOnly = true)
    public List<ContestRequirementDTO> getContestRequirements(Long contestId) {
        List<ContestRequirementEntity> requirements = requirementRepository.findByContestIdOrderByPriorityAsc(contestId);
        return requirements.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene un requisito específico por ID
     */
    @Transactional(readOnly = true)
    public Optional<ContestRequirementDTO> getRequirementById(Long requirementId) {
        return requirementRepository.findById(requirementId)
                .map(this::toDTO);
    }

    /**
     * Obtiene requisitos por categoría
     */
    @Transactional(readOnly = true)
    public List<ContestRequirementDTO> getRequirementsByCategory(Long contestId, String category) {
        List<ContestRequirementEntity> requirements = requirementRepository.findByContestIdAndCategory(contestId, category);
        return requirements.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene solo los requisitos obligatorios
     */
    @Transactional(readOnly = true)
    public List<ContestRequirementDTO> getRequiredRequirements(Long contestId) {
        List<ContestRequirementEntity> requirements = requirementRepository.findByContestIdAndRequiredTrue(contestId);
        return requirements.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Crea un nuevo requisito para un concurso
     */
    public ContestRequirementDTO createRequirement(Long contestId, ContestRequirementCreateRequest request) {
        // Verificar que el concurso existe
        ContestEntity contest = contestRepository.findById(contestId)
                .orElseThrow(() -> new IllegalArgumentException("Concurso no encontrado con ID: " + contestId));

        // Verificar que no existe un requisito con la misma descripción
        if (requirementRepository.existsByContestIdAndDescription(contestId, request.getDescription())) {
            throw new IllegalArgumentException("Ya existe un requisito con la misma descripción para este concurso");
        }

        // Crear la entidad
        ContestRequirementEntity requirementEntity = ContestRequirementEntity.builder()
                .contest(contest)
                .description(request.getDescription())
                .category(request.getCategory())
                .required(request.getRequired())
                .priority(request.getPriority())
                .documentType(request.getDocumentType())
                .build();

        // Guardar
        ContestRequirementEntity savedRequirement = requirementRepository.save(requirementEntity);
        return toDTO(savedRequirement);
    }

    /**
     * Actualiza un requisito existente
     */
    public ContestRequirementDTO updateRequirement(Long requirementId, ContestRequirementUpdateRequest request) {
        ContestRequirementEntity existingRequirement = requirementRepository.findById(requirementId)
                .orElseThrow(() -> new IllegalArgumentException("Requisito no encontrado con ID: " + requirementId));

        // Verificar que no existe otro requisito con la misma descripción (excluyendo el actual)
        if (requirementRepository.existsByContestIdAndDescription(
                existingRequirement.getContest().getId(), request.getDescription())) {
            // Verificar si es el mismo requisito que estamos actualizando
            List<ContestRequirementEntity> existingRequirements = requirementRepository.findByContestIdAndDescription(
                    existingRequirement.getContest().getId(), request.getDescription());
            boolean isDuplicate = existingRequirements.stream()
                    .anyMatch(req -> !req.getId().equals(requirementId));

            if (isDuplicate) {
                throw new IllegalArgumentException("Ya existe otro requisito con la misma descripción para este concurso");
            }
        }

        // Actualizar campos
        existingRequirement.setDescription(request.getDescription());
        existingRequirement.setCategory(request.getCategory());
        existingRequirement.setRequired(request.getRequired());
        existingRequirement.setPriority(request.getPriority());
        existingRequirement.setDocumentType(request.getDocumentType());

        // Guardar
        ContestRequirementEntity updatedRequirement = requirementRepository.save(existingRequirement);
        return toDTO(updatedRequirement);
    }

    /**
     * Elimina un requisito
     */
    public void deleteRequirement(Long requirementId) {
        if (!requirementRepository.existsById(requirementId)) {
            throw new IllegalArgumentException("Requisito no encontrado con ID: " + requirementId);
        }
        requirementRepository.deleteById(requirementId);
    }

    /**
     * Obtiene las categorías disponibles para un concurso
     */
    @Transactional(readOnly = true)
    public List<String> getAvailableCategories(Long contestId) {
        return requirementRepository.findDistinctCategoriesByContestId(contestId);
    }

    /**
     * Obtiene los tipos de documento disponibles para un concurso
     */
    @Transactional(readOnly = true)
    public List<String> getAvailableDocumentTypes(Long contestId) {
        return requirementRepository.findDistinctDocumentTypesByContestId(contestId);
    }

    /**
     * Convierte una entidad a DTO
     */
    private ContestRequirementDTO toDTO(ContestRequirementEntity entity) {
        return ContestRequirementDTO.builder()
                .id(entity.getId())
                .description(entity.getDescription())
                .category(entity.getCategory())
                .required(entity.getRequired())
                .priority(entity.getPriority())
                .documentType(entity.getDocumentType())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
