package ar.gov.mpd.concursobackend.postulation.infrastructure.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PostulationDTO {
    private String id;
    private PostulationUserDTO user;
    private PostulationInscriptionDTO inscription;
    private PostulationContestDTO contest;
    private PostulationDocumentsDTO documents;
    private String validationStatus; // 'PENDING' | 'PARTIAL' | 'COMPLETED' | 'REJECTED'
    private String priority; // 'HIGH' | 'MEDIUM' | 'LOW'
    private int completionPercentage;
}
