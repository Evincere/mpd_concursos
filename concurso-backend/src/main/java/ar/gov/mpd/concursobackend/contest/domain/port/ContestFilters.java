package ar.gov.mpd.concursobackend.contest.domain.port;

import java.time.LocalDate;

public class ContestFilters {
    private String status;
    private LocalDate startDate;
    private LocalDate endDate;
    private String dependency;
    private String position;

    public ContestFilters(String status, LocalDate startDate, LocalDate endDate, String dependency, String position) {
        this.status = status;
        this.startDate = startDate;
        this.endDate = endDate;
        this.dependency = dependency;
        this.position = position;
    }

    // Getters
    public String getStatus() { return status; }
    public LocalDate getStartDate() { return startDate; }
    public LocalDate getEndDate() { return endDate; }
    public String getDependency() { return dependency; }
    public String getPosition() { return position; }
}
