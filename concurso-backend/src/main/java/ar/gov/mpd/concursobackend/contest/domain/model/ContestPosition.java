package ar.gov.mpd.concursobackend.contest.domain.model;

import lombok.*;

import java.util.UUID;

/**
 * Domain model for contest positions
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContestPosition {
    private UUID id;
    private UUID contestId;
    private String title;
    private String description;
    private String requirements;
    private String location;
    private String district;
    private int vacancies;
    private String salary;
    private String workSchedule;
}
