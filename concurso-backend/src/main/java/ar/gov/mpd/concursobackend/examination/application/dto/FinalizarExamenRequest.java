package ar.gov.mpd.concursobackend.examination.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinalizarExamenRequest {
    private String examenId;
    private String usuarioId;
    private Map<String, Object> respuestas;
    private String motivo;
    private Long tiempoUtilizado;
}