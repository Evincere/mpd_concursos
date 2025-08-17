package ar.gov.mpd.concursobackend.postulation.infrastructure.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PostulationStatsDTO {
    private long total;
    private long completedWithDocs;
    private long validationPending;
    private long validationCompleted;
    private long validationRejected;
}
