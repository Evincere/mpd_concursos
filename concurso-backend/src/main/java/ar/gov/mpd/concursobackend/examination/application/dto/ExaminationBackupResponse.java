package ar.gov.mpd.concursobackend.examination.application.dto;

import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;

@Value
@Builder
public class ExaminationBackupResponse {
    String answers;
    LocalDateTime timestamp;
} 