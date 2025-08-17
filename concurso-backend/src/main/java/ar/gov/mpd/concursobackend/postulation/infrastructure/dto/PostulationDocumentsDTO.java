package ar.gov.mpd.concursobackend.postulation.infrastructure.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PostulationDocumentsDTO {
    private int total;
    private int pending;
    private int approved;
    private int rejected;
    private int required;
    private List<String> types;
}
