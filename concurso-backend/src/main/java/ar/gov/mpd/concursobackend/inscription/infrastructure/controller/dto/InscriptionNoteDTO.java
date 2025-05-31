package ar.gov.mpd.concursobackend.inscription.infrastructure.controller.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class InscriptionNoteDTO {
    private String id;
    private String inscriptionId;
    private String text;
    private String createdBy;
    private LocalDateTime createdAt;
}
