package ar.gov.mpd.concursobackend.postulation.infrastructure.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PostulationInscriptionDTO {
    private String id;
    private String state;
    private String centroDeVida;
    private String createdAt;
}
