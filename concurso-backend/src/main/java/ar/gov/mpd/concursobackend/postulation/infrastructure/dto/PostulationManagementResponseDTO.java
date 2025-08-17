package ar.gov.mpd.concursobackend.postulation.infrastructure.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PostulationManagementResponseDTO {
    private boolean success;
    private List<PostulationDTO> postulations;
    private PostulationStatsDTO stats;
    private String message;
}
