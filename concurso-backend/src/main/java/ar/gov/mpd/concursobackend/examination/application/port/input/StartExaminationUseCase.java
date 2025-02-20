package ar.gov.mpd.concursobackend.examination.application.port.input;

import lombok.Builder;
import lombok.Value;
import java.util.UUID;

import ar.gov.mpd.concursobackend.examination.domain.model.ExaminationSession;


public interface StartExaminationUseCase {
    ExaminationSession startExamination(StartExaminationCommand command);

    @Value
    @Builder
    class StartExaminationCommand {
        UUID examinationId;
        UUID userId;
    }
} 