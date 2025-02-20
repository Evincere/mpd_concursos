package ar.gov.mpd.concursobackend.examination.domain.model;

import ar.gov.mpd.concursobackend.examination.domain.enums.SecurityViolationType;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class SecurityValidation {
    boolean valid;
    String message;
    SecurityViolationType violationType;
} 