package ar.gov.mpd.concursobackend.filter.application.mapper;

import ar.gov.mpd.concursobackend.contest.domain.model.Contest;
import ar.gov.mpd.concursobackend.filter.application.dto.ContestResponse;
import org.springframework.stereotype.Component;

/**
 * Mapper para convertir entidades Contest del módulo contest a DTOs ContestResponse del módulo filter
 */
@Component
public class ContestFilterMapper {
    
    /**
     * Convierte un Contest del módulo contest a un ContestResponse
     * @param contest Entidad Contest del módulo contest
     * @return DTO ContestResponse con la información relevante para el módulo filter
     */
    public ContestResponse toResponse(Contest contest) {
        return ContestResponse.builder()
            .id(contest.getId())
            .status(contest.getStatus() != null ? contest.getStatus().name() : null)
            .startDate(contest.getStartDate() != null ? contest.getStartDate().toLocalDate() : null)
            .endDate(contest.getEndDate() != null ? contest.getEndDate().toLocalDate() : null)
            .department(contest.getDependency())  // Mapeamos dependency como department
            .position(contest.getLocation() != null ? contest.getLocation() : "No especificado")
            .build();
    }
}