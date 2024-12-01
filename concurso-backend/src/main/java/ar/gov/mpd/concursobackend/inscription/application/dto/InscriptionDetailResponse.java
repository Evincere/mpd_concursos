package ar.gov.mpd.concursobackend.inscription.application.dto;

import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class InscriptionDetailResponse {
    private Long id;
    private Long contestId;
    private String userId;
    private String estado;
    private LocalDateTime fechaPostulacion;
    private ConcursoDTO concurso;

    @Data
    @Builder
    public static class ConcursoDTO {
        private Long id;
        private String titulo;
        private String cargo;
        private String dependencia;
        private String estado;
        private LocalDateTime fechaInicio;
        private LocalDateTime fechaFin;
    }
} 