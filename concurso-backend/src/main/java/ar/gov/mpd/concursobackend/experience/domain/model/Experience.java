package ar.gov.mpd.concursobackend.experience.domain.model;

import java.time.LocalDate;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Domain model for work experience
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Experience {

    private UUID id;

    private UUID userId;

    private String company;

    private String position;

    private LocalDate startDate;

    private LocalDate endDate;

    private String description;

    private String comments;

    private String documentUrl;
}