package ar.gov.mpd.concursobackend.filter.application.usecase;

import ar.gov.mpd.concursobackend.contest.application.port.in.ContestQueryUseCase;
import ar.gov.mpd.concursobackend.contest.domain.port.ContestFilters;
import ar.gov.mpd.concursobackend.filter.application.dto.ContestFilterCommand;
import ar.gov.mpd.concursobackend.filter.application.dto.ContestResponse;
import ar.gov.mpd.concursobackend.filter.application.mapper.ContestMapper;
import ar.gov.mpd.concursobackend.filter.application.port.in.SearchContestUseCase;
import ar.gov.mpd.concursobackend.filter.domain.model.ContestFilter;
import ar.gov.mpd.concursobackend.contest.domain.enums.ContestStatus;
import ar.gov.mpd.concursobackend.filter.domain.model.valueobjects.DateRange;
import ar.gov.mpd.concursobackend.filter.domain.model.valueobjects.Department;
import ar.gov.mpd.concursobackend.filter.domain.model.valueobjects.Position;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Servicio que implementa la búsqueda de concursos aplicando filtros
 */
@Service
@Transactional(readOnly = true)
public class SearchContestService implements SearchContestUseCase {
    private final ContestQueryUseCase contestQueryUseCase;
    private final ContestMapper contestMapper;

    public SearchContestService(ContestQueryUseCase contestQueryUseCase, ContestMapper contestMapper) {
        this.contestQueryUseCase = contestQueryUseCase;
        this.contestMapper = contestMapper;
    }

    @Override
    public List<ContestResponse> searchContests(ContestFilterCommand command) {
        ContestFilter filter = createFilterFromCommand(command);
        ContestFilters contestFilters = mapToContestFilters(filter);
        return contestQueryUseCase.findByFilters(contestFilters).stream()
                .map(contestMapper::toResponse)
                .collect(Collectors.toList());
    }

    private ContestFilter createFilterFromCommand(ContestFilterCommand command) {
        ContestStatus status = null;
        if (command.getStatus() != null && !command.getStatus().trim().isEmpty()) {
            status = ContestStatus.fromString(command.getStatus());
        }
        
        DateRange dateRange = null;
        if (command.getStartDate() != null || command.getEndDate() != null) {
            dateRange = new DateRange(command.getStartDate(), command.getEndDate());
        }
        
        Department department = null;
        if (command.getDepartment() != null && !command.getDepartment().trim().isEmpty()) {
            department = new Department(command.getDepartment());
        }
        
        Position position = null;
        if (command.getPosition() != null && !command.getPosition().trim().isEmpty()) {
            position = new Position(command.getPosition());
        }
        
        return new ContestFilter(status, dateRange, department, position);
    }

    private ContestFilters mapToContestFilters(ContestFilter filter) {
        return ContestFilters.builder()
                .status(Optional.ofNullable(filter.getStatus())
                        .map(ContestStatus::toString)
                        .orElse(null))
                .startDate(Optional.ofNullable(filter.getDateRange())
                        .map(DateRange::getStartDate)
                        .orElse(null))
                .endDate(Optional.ofNullable(filter.getDateRange())
                        .map(DateRange::getEndDate)
                        .orElse(null))
                .dependency(Optional.ofNullable(filter.getDepartment())
                        .map(Department::getValue)
                        .orElse(null))
                .position(Optional.ofNullable(filter.getPosition())
                        .map(Position::getValue)
                        .orElse(null))
                .build();
    }
}