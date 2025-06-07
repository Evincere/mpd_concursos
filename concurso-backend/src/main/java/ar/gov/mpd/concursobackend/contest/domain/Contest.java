package ar.gov.mpd.concursobackend.contest.domain;

import ar.gov.mpd.concursobackend.contest.domain.enums.ContestStatus;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import lombok.Builder;
import lombok.Data;

/**
 * MODELO LEGACY - TEMPORAL
 * Este modelo se mantiene temporalmente para compatibilidad durante la migración.
 * TODO: Migrar gradualmente al modelo principal Contest.java en /model/
 */
@Data
@Builder
public class Contest {
    private Long id;
    private String title;
    private String category;
    private String class_;
    private String functions;
    private ContestStatus status;
    private String position;
    private String dependency;
    private LocalDate startDate;
    private LocalDate endDate;
    private String basesUrl;
    private String descriptionUrl;
    private List<ContestDate> dates;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Contest(Long id, String title, String category, String class_, String functions,
                  ContestStatus status, String position, String dependency, LocalDate startDate,
                  LocalDate endDate, String basesUrl, String descriptionUrl, List<ContestDate> dates,
                  LocalDateTime createdAt, LocalDateTime updatedAt) {
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
        this.createdAt = createdAt != null ? createdAt : LocalDateTime.now();
        this.updatedAt = updatedAt != null ? updatedAt : LocalDateTime.now();
    }

    // Getters
    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getCategory() { return category; }
    public String getClass_() { return class_; }
    public String getFunctions() { return functions; }
    public ContestStatus getStatus() { return status; }
    public String getPosition() { return position; }
    public String getDependency() { return dependency; }
    public LocalDate getStartDate() { return startDate; }
    public LocalDate getEndDate() { return endDate; }
    public String getBasesUrl() { return basesUrl; }
    public String getDescriptionUrl() { return descriptionUrl; }
    public List<ContestDate> getDates() { return dates; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setTitle(String title) { this.title = title; }
    public void setCategory(String category) { this.category = category; }
    public void setClass_(String class_) { this.class_ = class_; }
    public void setFunctions(String functions) { this.functions = functions; }
    public void setStatus(ContestStatus status) { this.status = status; }
    public void setPosition(String position) { this.position = position; }
    public void setDependency(String dependency) { this.dependency = dependency; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
    public void setBasesUrl(String basesUrl) { this.basesUrl = basesUrl; }
    public void setDescriptionUrl(String descriptionUrl) { this.descriptionUrl = descriptionUrl; }
    public void setDates(List<ContestDate> dates) { this.dates = dates; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
