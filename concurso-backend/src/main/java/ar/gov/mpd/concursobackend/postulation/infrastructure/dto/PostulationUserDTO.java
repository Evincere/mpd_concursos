package ar.gov.mpd.concursobackend.postulation.infrastructure.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PostulationUserDTO {
    private String dni;
    private String fullName;
    private String email;
}
