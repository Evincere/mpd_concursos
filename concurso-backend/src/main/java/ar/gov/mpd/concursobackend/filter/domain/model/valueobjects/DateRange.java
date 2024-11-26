package ar.gov.mpd.concursobackend.filter.domain.model.valueobjects;

import ar.gov.mpd.concursobackend.filter.domain.model.exceptions.InvalidDateRangeException;
import lombok.Value;
import java.time.LocalDate;

@Value
public class DateRange {
    LocalDate start;
    LocalDate end;

    public DateRange(LocalDate start, LocalDate end) {
        validateDateRange(start, end);
        this.start = start;
        this.end = end;
    }

    private void validateDateRange(LocalDate start, LocalDate end) {
        if (start != null && end != null && start.isAfter(end)) {
            throw new InvalidDateRangeException("La fecha de inicio no puede ser posterior a la fecha de fin");
        }
    }

    public LocalDate getStart() {
        return start;
    }

    public LocalDate getEnd() {
        return end;
    }
} 