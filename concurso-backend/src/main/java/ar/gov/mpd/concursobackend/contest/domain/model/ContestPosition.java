package ar.gov.mpd.concursobackend.contest.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

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
