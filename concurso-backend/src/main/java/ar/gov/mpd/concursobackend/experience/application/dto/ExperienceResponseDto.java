package ar.gov.mpd.concursobackend.experience.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

/**
 * DTO for work experience response
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExperienceResponseDto {

    private UUID id;

    private String company;

    private String position;

    private LocalDate startDate;

    private LocalDate endDate;

    private String description;

    private String comments;

    private String location;

    private String technologies;

    private String achievements;

    private String documentUrl;
}