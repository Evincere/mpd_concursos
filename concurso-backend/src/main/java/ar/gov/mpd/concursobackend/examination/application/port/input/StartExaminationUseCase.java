package ar.gov.mpd.concursobackend.examination.application.port.input;

import ar.gov.mpd.concursobackend.examination.domain.model.ExaminationSession;
import lombok.Builder;
import lombok.Value;

import java.util.UUID;


public interface StartExaminationUseCase {
    ExaminationSession startExamination(StartExaminationCommand command);

    @Value
    @Builder
    class StartExaminationCommand {
        UUID examinationId;
        UUID userId;
    }
} 