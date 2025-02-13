package ar.gov.mpd.concursobackend.inscription.application.dto;

import java.time.LocalDateTime;
import java.util.UUID;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class InscriptionDetailResponse {
    UUID id;
    Long contestId;
    String userId;
    String estado;
    LocalDateTime fechaPostulacion;
    ConcursoDTO concurso;

    @Value
    @Builder
    public static class ConcursoDTO {
        Long id;
        String titulo;
        String cargo;
        String dependencia;
        String estado;
        LocalDateTime fechaInicio;
        LocalDateTime fechaFin;
    }
} 