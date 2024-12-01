package ar.gov.mpd.concursobackend.contest.domain;

import java.time.LocalDate;

public class Contest {
    private Long id;
    private String title;
    private String category;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
    private String position;
    private String dependency;
    private Integer vacancies;

    public Contest(Long id, String title, String category, LocalDate startDate, LocalDate endDate, 
                  String status, String position, String dependency, Integer vacancies) {
        this.id = id;
        this.title = title;
        this.category = category;
        this.startDate = startDate;
        this.endDate = endDate;
        this.status = status;
        this.position = position;
        this.dependency = dependency;
        this.vacancies = vacancies;
    }

    // Getters
    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getCategory() { return category; }
    public LocalDate getStartDate() { return startDate; }
    public LocalDate getEndDate() { return endDate; }
    public String getStatus() { return status; }
    public String getPosition() { return position; }
    public String getDependency() { return dependency; }
    public Integer getVacancies() { return vacancies; }
}
