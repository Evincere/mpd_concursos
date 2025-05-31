package ar.gov.mpd.concursobackend.inscription.infrastructure.controller.dto;

import java.util.List;
import java.util.Map;

public class InscriptionReportResponseDTO {
    private List<Map<String, Object>> data;

    public InscriptionReportResponseDTO(List<Map<String, Object>> data) {
        this.data = data;
    }

    public List<Map<String, Object>> getData() {
        return data;
    }

    public void setData(List<Map<String, Object>> data) {
        this.data = data;
    }
} 