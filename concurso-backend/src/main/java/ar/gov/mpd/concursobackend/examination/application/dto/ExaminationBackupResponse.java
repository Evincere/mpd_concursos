package ar.gov.mpd.concursobackend.examination.application.dto;

import lombok.Data;
import lombok.Builder;

@Data
@Builder
public class ExaminationBackupResponse {
    private Long examinationId;
    private String answers;  // JSON string con las respuestas
    private Long timestamp;
} 