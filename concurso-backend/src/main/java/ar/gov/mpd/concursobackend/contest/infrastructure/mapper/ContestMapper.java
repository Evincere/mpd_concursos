package ar.gov.mpd.concursobackend.contest.infrastructure.mapper;

import ar.gov.mpd.concursobackend.contest.domain.Contest;
import ar.gov.mpd.concursobackend.contest.domain.ContestDate;
import ar.gov.mpd.concursobackend.contest.infrastructure.database.entities.ContestEntity;
import ar.gov.mpd.concursobackend.contest.infrastructure.database.entities.ContestDateEntity;
import ar.gov.mpd.concursobackend.contest.application.dto.ContestDTO;
import ar.gov.mpd.concursobackend.contest.application.dto.ContestDateDTO;
import ar.gov.mpd.concursobackend.contest.domain.enums.ContestStatus;
import ar.gov.mpd.concursobackend.contest.infrastructure.dto.ContestCreateRequest;
import ar.gov.mpd.concursobackend.contest.infrastructure.dto.ContestResponse;
import ar.gov.mpd.concursobackend.contest.infrastructure.dto.ContestUpdateRequest;

import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;
import java.util.ArrayList;
import java.time.LocalDateTime;

@Component
public class ContestMapper {

    public Contest toDomain(ContestEntity entity) {
        if (entity == null) {
            return null;
        }

        List<ContestDate> dates = new ArrayList<>();
        if (entity.getDates() != null) {
            dates = entity.getDates().stream()
                .map(this::toDomainDate)
                .collect(Collectors.toList());
        }

        return Contest.builder()
            .id(entity.getId())
            .title(entity.getTitle())
            .category(entity.getCategory())
            .class_(entity.getClass_())
            .functions(entity.getFunctions())
            .status(entity.getStatus() != null ? entity.getStatus().name() : null)
            .position(entity.getPosition())
            .dependency(entity.getDepartment())
            .startDate(entity.getStartDate())
            .endDate(entity.getEndDate())
            .basesUrl(entity.getBasesUrl())
            .descriptionUrl(entity.getDescriptionUrl())
            .dates(dates)
            .build();
    }

    public ContestEntity toEntity(Contest domain) {
        if (domain == null) return null;

        List<ContestDateEntity> dates = new ArrayList<>();
        if (domain.getDates() != null) {
            dates = domain.getDates().stream()
                .map(this::toEntityDate)
                .collect(Collectors.toList());
        }

        return ContestEntity.builder()
            .id(domain.getId())
            .title(domain.getTitle())
            .category(domain.getCategory())
            .class_(domain.getClass_())
            .functions(domain.getFunctions())
            .status(ContestStatus.valueOf(domain.getStatus()))
            .department(domain.getDependency())
            .position(domain.getPosition())
            .startDate(domain.getStartDate())
            .endDate(domain.getEndDate())
            .basesUrl(domain.getBasesUrl())
            .descriptionUrl(domain.getDescriptionUrl())
            .dates(dates)
            .build();
    }

    public ContestDTO toDTO(Contest domain) {
        if (domain == null) return null;

        List<ContestDateDTO> dates = domain.getDates().stream()
            .map(this::toDateDTO)
            .collect(Collectors.toList());

        return ContestDTO.builder()
            .id(domain.getId())
            .title(domain.getTitle())
            .category(domain.getCategory())
            .class_(domain.getClass_())
            .functions(domain.getFunctions())
            .status(domain.getStatus())
            .position(domain.getPosition())
            .dependency(domain.getDependency())
            .startDate(domain.getStartDate())
            .endDate(domain.getEndDate())
            .basesUrl(domain.getBasesUrl())
            .descriptionUrl(domain.getDescriptionUrl())
            .dates(dates)
            .build();
    }

    private ContestDate toDomainDate(ContestDateEntity dateEntity) {
        if (dateEntity == null) {
            return null;
        }
        return ContestDate.builder()
            .id(dateEntity.getId())
            .label(dateEntity.getLabel())
            .type(dateEntity.getType())
            .startDate(dateEntity.getStartDate())
            .endDate(dateEntity.getEndDate())
            .build();
    }

    private ContestDateEntity toEntityDate(ContestDate date) {
        if (date == null) {
            return null;
        }
        return ContestDateEntity.builder()
            .id(date.getId())
            .label(date.getLabel())
            .type(date.getType())
            .startDate(date.getStartDate())
            .endDate(date.getEndDate())
            .build();
    }

    private ContestDateDTO toDateDTO(ContestDate date) {
        if (date == null) {
            return null;
        }
        return ContestDateDTO.builder()
            .id(date.getId())
            .label(date.getLabel())
            .type(date.getType())
            .startDate(date.getStartDate())
            .endDate(date.getEndDate())
            .build();
    }

    // Métodos para los nuevos DTOs de administración

    /**
     * Convierte un Contest a ContestResponse
     */
    public ContestResponse toResponse(Contest contest) {
        if (contest == null) {
            return null;
        }

        return ContestResponse.builder()
                .id(contest.getId())
                .title(contest.getTitle())
                .description(contest.getFunctions()) // Usar functions como description
                .position(contest.getPosition())
                .category(contest.getCategory())
                .contestClass(contest.getClass_())
                .functions(contest.getFunctions())
                .department(contest.getDependency())
                .dependencia(contest.getDependency())
                .status(contest.getStatus())
                .startDate(contest.getStartDate())
                .endDate(contest.getEndDate())
                .termsUrl(contest.getBasesUrl())
                .profileUrl(contest.getDescriptionUrl())
                .createdAt(LocalDateTime.now()) // TODO: Agregar campos de auditoría al dominio
                .updatedAt(LocalDateTime.now())
                .createdBy("system") // TODO: Obtener del contexto de seguridad
                .updatedBy("system")
                .totalInscriptions(0) // TODO: Calcular desde inscripciones
                .isActive("ACTIVE".equals(contest.getStatus()))
                .allowsInscriptions("ACTIVE".equals(contest.getStatus()))
                .build();
    }

    /**
     * Convierte un ContestCreateRequest a Contest
     */
    public Contest fromCreateRequest(ContestCreateRequest request) {
        if (request == null) {
            return null;
        }

        return Contest.builder()
                .title(request.getTitle())
                .position(request.getPosition())
                .category(request.getCategory())
                .class_(request.getContestClass())
                .functions(request.getFunctions() != null ? request.getFunctions() : request.getDescription())
                .dependency(request.getDepartment())
                .status(request.getStatus())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .basesUrl(request.getTermsUrl())
                .descriptionUrl(request.getProfileUrl())
                .dates(new ArrayList<>())
                .build();
    }

    /**
     * Convierte un ContestUpdateRequest a Contest
     */
    public Contest fromUpdateRequest(ContestUpdateRequest request) {
        if (request == null) {
            return null;
        }

        return Contest.builder()
                .title(request.getTitle())
                .position(request.getPosition())
                .category(request.getCategory())
                .class_(request.getContestClass())
                .functions(request.getFunctions() != null ? request.getFunctions() : request.getDescription())
                .dependency(request.getDepartment())
                .status(request.getStatus())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .basesUrl(request.getTermsUrl())
                .descriptionUrl(request.getProfileUrl())
                .dates(new ArrayList<>())
                .build();
    }
}