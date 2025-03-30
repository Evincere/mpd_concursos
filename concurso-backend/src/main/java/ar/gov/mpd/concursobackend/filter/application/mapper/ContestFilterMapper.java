package ar.gov.mpd.concursobackend.filter.application.mapper;

import org.springframework.stereotype.Component;
import ar.gov.mpd.concursobackend.contest.domain.Contest;
import ar.gov.mpd.concursobackend.filter.application.dto.ContestResponse;

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
            .status(contest.getStatus())
            .startDate(contest.getStartDate())
            .endDate(contest.getEndDate())
            .department(contest.getDependency())  // Mapeamos dependency como department
            .position(contest.getPosition())
            .build();
    }
}