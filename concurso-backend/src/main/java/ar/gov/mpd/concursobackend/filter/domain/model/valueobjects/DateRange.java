package ar.gov.mpd.concursobackend.filter.domain.model.valueobjects;

import ar.gov.mpd.concursobackend.filter.domain.model.exceptions.InvalidDateRangeException;
import lombok.Value;
import java.time.LocalDate;

@Value
public class DateRange {
    LocalDate startDate;
    LocalDate endDate;

    public DateRange(LocalDate startDate, LocalDate endDate) {
        validateDateRange(startDate, endDate);
        this.startDate = startDate;
        this.endDate = endDate;
    }

    private void validateDateRange(LocalDate startDate, LocalDate endDate) {
        if (startDate != null && endDate != null && startDate.isAfter(endDate)) {
            throw new InvalidDateRangeException("La fecha de inicio no puede ser posterior a la fecha de fin");
        }
    }
}