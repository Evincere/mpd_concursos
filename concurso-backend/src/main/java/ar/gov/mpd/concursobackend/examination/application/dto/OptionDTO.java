package ar.gov.mpd.concursobackend.examination.application.dto;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class OptionDTO {
    private UUID id;
    private String text;
    private Integer order;
}
