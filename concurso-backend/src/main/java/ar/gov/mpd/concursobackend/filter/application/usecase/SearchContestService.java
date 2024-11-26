package ar.gov.mpd.concursobackend.filter.application.usecase;

import ar.gov.mpd.concursobackend.filter.application.dto.ContestFilterCommand;
import ar.gov.mpd.concursobackend.filter.application.port.in.SearchContestUseCase;
import ar.gov.mpd.concursobackend.filter.application.port.out.LoadContestPort;
import ar.gov.mpd.concursobackend.filter.domain.model.ContestFilter;
import ar.gov.mpd.concursobackend.filter.domain.model.enums.ContestStatus;
import ar.gov.mpd.concursobackend.filter.domain.model.valueobjects.DateRange;
import ar.gov.mpd.concursobackend.filter.domain.model.valueobjects.Department;
import ar.gov.mpd.concursobackend.filter.domain.model.valueobjects.Position;
import ar.gov.mpd.concursobackend.filter.domain.model.Contest;
import ar.gov.mpd.concursobackend.filter.application.dto.ContestResponse;
import ar.gov.mpd.concursobackend.filter.application.mapper.ContestMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class SearchContestService implements SearchContestUseCase {
    private final LoadContestPort loadContestPort;
    private final ContestMapper contestMapper;

    public SearchContestService(LoadContestPort loadContestPort, ContestMapper contestMapper) {
        this.loadContestPort = loadContestPort;
        this.contestMapper = contestMapper;
    }

    @Override
    public List<ContestResponse> searchContests(ContestFilterCommand command) {
        ContestFilter filter = createFilterFromCommand(command);
        List<Contest> contests = loadContestPort.findByFilters(filter);
        return contests.stream()
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
} 