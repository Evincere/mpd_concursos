package ar.gov.mpd.concursobackend.filter.application.mapper;

import org.springframework.stereotype.Component;

import ar.gov.mpd.concursobackend.filter.application.dto.ContestResponse;
import ar.gov.mpd.concursobackend.filter.domain.model.Contest;
@Component
public class ContestMapper {
    public ContestResponse toResponse(Contest contest) {
        return ContestResponse.builder()
            .id(contest.getId().getValue())
            .status(contest.getStatus().toString())
            .startDate(contest.getDateRange().getStart())
            .endDate(contest.getDateRange().getEnd())
            .department(contest.getDepartment().getValue())
            .position(contest.getPosition().getValue())
            .build();
    }
} 