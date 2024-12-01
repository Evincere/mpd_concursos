package ar.gov.mpd.concursobackend.filter.application.usecase;

import ar.gov.mpd.concursobackend.contest.application.port.in.ContestQueryUseCase;
import ar.gov.mpd.concursobackend.contest.domain.port.ContestFilters;
import ar.gov.mpd.concursobackend.filter.application.dto.ContestFilterCommand;
import ar.gov.mpd.concursobackend.filter.application.dto.ContestResponse;
import ar.gov.mpd.concursobackend.filter.application.mapper.ContestMapper;
import ar.gov.mpd.concursobackend.filter.application.port.in.SearchContestUseCase;
import ar.gov.mpd.concursobackend.filter.domain.model.ContestFilter;
import ar.gov.mpd.concursobackend.filter.domain.model.enums.ContestStatus;
import ar.gov.mpd.concursobackend.filter.domain.model.valueobjects.DateRange;
import ar.gov.mpd.concursobackend.filter.domain.model.valueobjects.Department;
import ar.gov.mpd.concursobackend.filter.domain.model.valueobjects.Position;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
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
        ContestStatus status = command.getStatus() != null ? 
            ContestStatus.fromString(command.getStatus()) : null;
        
        DateRange dateRange = (command.getStartDate() != null || command.getEndDate() != null) ?
            new DateRange(command.getStartDate(), command.getEndDate()) : null;
        
        Department department = command.getDepartment() != null ? 
            new Department(command.getDepartment()) : null;
        
        Position position = command.getPosition() != null ? 
            new Position(command.getPosition()) : null;

        return new ContestFilter(status, dateRange, department, position);
    }

    /**
     * Mapea los filtros del módulo filter a los filtros del módulo contest
     */
    private ContestFilters mapToContestFilters(ContestFilter filter) {
        return new ContestFilters(
            mapStatus(filter.getStatus()),
            mapStartDate(filter.getDateRange()),
            mapEndDate(filter.getDateRange()),
            mapDepartmentToDependency(filter.getDepartment()),
            mapPosition(filter.getPosition())
        );
    }

    private String mapStatus(ContestStatus status) {
        return Optional.ofNullable(status)
                .map(ContestStatus::toString)
                .orElse(null);
    }

    private LocalDate mapStartDate(DateRange dateRange) {
        return Optional.ofNullable(dateRange)
                .map(DateRange::getStart)
                .orElse(null);
    }

    private LocalDate mapEndDate(DateRange dateRange) {
        return Optional.ofNullable(dateRange)
                .map(DateRange::getEnd)
                .orElse(null);
    }

    private String mapDepartmentToDependency(Department department) {
        return Optional.ofNullable(department)
                .map(Department::getValue)
                .orElse(null);
    }

    private String mapPosition(Position position) {
        return Optional.ofNullable(position)
                .map(Position::getValue)
                .orElse(null);
    }
}