package ar.gov.mpd.concursobackend.filter.application.port.out;

import java.util.List;

import ar.gov.mpd.concursobackend.filter.domain.model.Contest;
import ar.gov.mpd.concursobackend.filter.domain.model.ContestFilter;

public interface LoadContestPort {
    List<Contest> findByFilters(ContestFilter filter);
} 