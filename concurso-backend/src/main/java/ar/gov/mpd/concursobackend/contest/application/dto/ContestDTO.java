package ar.gov.mpd.concursobackend.contest.application.dto;

import java.time.LocalDate;
import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ContestDTO {
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
    private List<ContestDateDTO> dates;

    public ContestDTO(Long id, String title, String category, String class_, String functions,
                     String status, String position, String dependency, LocalDate startDate,
                     LocalDate endDate, String basesUrl, String descriptionUrl, List<ContestDateDTO> dates) {
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
} 