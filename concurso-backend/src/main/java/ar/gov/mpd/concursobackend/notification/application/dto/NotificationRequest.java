package ar.gov.mpd.concursobackend.notification.application.dto;

import ar.gov.mpd.concursobackend.notification.domain.enums.AcknowledgementLevel;
import ar.gov.mpd.concursobackend.notification.domain.enums.NotificationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.Builder;

@Data
@Builder
public class NotificationRequest {
    @NotBlank(message = "El nombre de usuario del destinatario no puede estar vacío")
    private String recipientUsername;

    @NotBlank(message = "El asunto no puede estar vacío")
    @Size(max = 200, message = "El asunto no puede exceder los 200 caracteres")
    private String subject;

    @NotBlank(message = "El contenido no puede estar vacío")
    @Size(max = 5000, message = "El contenido no puede exceder los 5000 caracteres")
    private String content;

    @NotNull(message = "El tipo de notificación es requerido")
    private NotificationType type;

    @NotNull(message = "El nivel de acuse es requerido")
    @Builder.Default
    private AcknowledgementLevel acknowledgementLevel = AcknowledgementLevel.NONE;
}
