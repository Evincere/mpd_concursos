package ar.gov.mpd.concursobackend.notification.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.util.UUID;

@Data
public class NotificationRequest {
    @NotNull(message = "El ID del destinatario no puede ser nulo")
    private UUID recipientId;

    @NotBlank(message = "El asunto no puede estar vacío")
    @Size(max = 200, message = "El asunto no puede exceder los 200 caracteres")
    private String subject;

    @NotBlank(message = "El contenido no puede estar vacío")
    @Size(max = 5000, message = "El contenido no puede exceder los 5000 caracteres")
    private String content;
}
