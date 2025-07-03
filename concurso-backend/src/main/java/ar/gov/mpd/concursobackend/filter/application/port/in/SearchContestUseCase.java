package ar.gov.mpd.concursobackend.filter.application.port.in;

import ar.gov.mpd.concursobackend.contest.infrastructure.dto.ContestResponse;
import ar.gov.mpd.concursobackend.filter.application.dto.ContestFilterCommand;

import java.util.List;

public interface SearchContestUseCase {
    List<ContestResponse> searchContests(ContestFilterCommand filterCommand);
} 