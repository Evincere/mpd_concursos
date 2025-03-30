package ar.gov.mpd.concursobackend.contest.domain;

import java.time.LocalDate;
import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class Contest {
    private Long id;
    private String title;
    private String category;
    private String class_;
    private String functions;
    private String status;
    private String position;
    private String dependency;
    private LocalDate startDate;
    private LocalDate endDate;
    private String basesUrl;
    private String descriptionUrl;
    private List<ContestDate> dates;

    public Contest(Long id, String title, String category, String class_, String functions,
                  String status, String position, String dependency, LocalDate startDate,
                  LocalDate endDate, String basesUrl, String descriptionUrl, List<ContestDate> dates) {
        this.id = id;
        this.title = title;
        this.category = category;
        this.class_ = class_;
        this.functions = functions;
        this.status = status;
        this.position = position;
        this.dependency = dependency;
        this.startDate = startDate;
        this.endDate = endDate;
        this.basesUrl = basesUrl;
        this.descriptionUrl = descriptionUrl;
        this.dates = dates;
    }

    // Getters
    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getCategory() { return category; }
    public String getClass_() { return class_; }
    public String getFunctions() { return functions; }
    public String getStatus() { return status; }
    public String getPosition() { return position; }
    public String getDependency() { return dependency; }
    public LocalDate getStartDate() { return startDate; }
    public LocalDate getEndDate() { return endDate; }
    public String getBasesUrl() { return basesUrl; }
    public String getDescriptionUrl() { return descriptionUrl; }
    public List<ContestDate> getDates() { return dates; }
}
