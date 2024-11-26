package ar.gov.mpd.concursobackend.filter.application.port.in;

import java.util.List;

import ar.gov.mpd.concursobackend.filter.application.dto.ContestFilterCommand;
import ar.gov.mpd.concursobackend.filter.application.dto.ContestResponse;

public interface SearchContestUseCase {
    List<ContestResponse> searchContests(ContestFilterCommand filterCommand);
} 