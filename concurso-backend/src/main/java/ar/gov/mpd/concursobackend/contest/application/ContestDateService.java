package ar.gov.mpd.concursobackend.contest.application;

import ar.gov.mpd.concursobackend.contest.application.dto.ContestDateDTO;
import ar.gov.mpd.concursobackend.contest.infrastructure.database.entities.ContestDateEntity;
import ar.gov.mpd.concursobackend.contest.infrastructure.database.entities.ContestEntity;
import ar.gov.mpd.concursobackend.contest.infrastructure.database.repository.ContestDateJpaRepository;
import ar.gov.mpd.concursobackend.contest.infrastructure.database.repository.ContestJpaRepository;
import ar.gov.mpd.concursobackend.contest.infrastructure.dto.ContestDateCreateRequest;
import ar.gov.mpd.concursobackend.contest.infrastructure.dto.ContestDateUpdateRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ContestDateService {

    private final ContestDateJpaRepository contestDateRepository;
    private final ContestJpaRepository contestRepository;

    /**
     * Obtiene todas las fechas de un concurso
     */
    @Transactional(readOnly = true)
    public List<ContestDateDTO> getContestDates(Long contestId) {
        List<ContestDateEntity> dates = contestDateRepository.findByContestId(contestId);
        return dates.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene todas las fechas importantes de todos los concursos
     */
    @Transactional(readOnly = true)
    public List<ContestDateDTO> getAllContestDates() {
        List<ContestDateEntity> dates = contestDateRepository.findAll();
        return dates.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene todas las fechas importantes de todos los concursos en un rango de fechas
     */
    @Transactional(readOnly = true)
    public List<ContestDateDTO> getAllContestDatesInRange(LocalDate startDate, LocalDate endDate) {
        List<ContestDateEntity> dates = contestDateRepository.findAllInDateRange(startDate, endDate);
        return dates.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene una fecha específica por ID
     */
    @Transactional(readOnly = true)
    public Optional<ContestDateDTO> getContestDateById(Long dateId) {
        return contestDateRepository.findById(dateId)
                .map(this::toDTO);
    }

    /**
     * Crea una nueva fecha para un concurso
     */
    public ContestDateDTO createContestDate(Long contestId, ContestDateCreateRequest request) {
        // Verificar que el concurso existe
        ContestEntity contest = contestRepository.findById(contestId)
                .orElseThrow(() -> new IllegalArgumentException("Concurso no encontrado con ID: " + contestId));

        // Validar fechas
        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new IllegalArgumentException("La fecha de fin no puede ser anterior a la fecha de inicio");
        }

        // Crear la entidad
        ContestDateEntity dateEntity = ContestDateEntity.builder()
                .contest(contest)
                .label(request.getLabel())
                .type(request.getType())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .build();

        // Guardar
        ContestDateEntity savedDate = contestDateRepository.save(dateEntity);
        return toDTO(savedDate);
    }

    /**
     * Actualiza una fecha existente
     */
    public ContestDateDTO updateContestDate(Long dateId, ContestDateUpdateRequest request) {
        ContestDateEntity existingDate = contestDateRepository.findById(dateId)
                .orElseThrow(() -> new IllegalArgumentException("Fecha no encontrada con ID: " + dateId));

        // Validar fechas
        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new IllegalArgumentException("La fecha de fin no puede ser anterior a la fecha de inicio");
        }

        // Actualizar campos
        existingDate.setLabel(request.getLabel());
        existingDate.setType(request.getType());
        existingDate.setStartDate(request.getStartDate());
        existingDate.setEndDate(request.getEndDate());

        // Guardar
        ContestDateEntity updatedDate = contestDateRepository.save(existingDate);
        return toDTO(updatedDate);
    }

    /**
     * Elimina una fecha
     */
    public void deleteContestDate(Long dateId) {
        if (!contestDateRepository.existsById(dateId)) {
            throw new IllegalArgumentException("Fecha no encontrada con ID: " + dateId);
        }
        contestDateRepository.deleteById(dateId);
    }

    /**
     * Convierte una entidad a DTO
     */
    private ContestDateDTO toDTO(ContestDateEntity entity) {
        return ContestDateDTO.builder()
                .id(entity.getId())
                .label(entity.getLabel())
                .type(entity.getType())
                .startDate(entity.getStartDate())
                .endDate(entity.getEndDate())
                .build();
    }
}
