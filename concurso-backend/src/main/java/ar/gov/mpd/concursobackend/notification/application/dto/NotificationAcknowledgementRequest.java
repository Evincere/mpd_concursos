package ar.gov.mpd.concursobackend.notification.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.UUID;

@Data
public class NotificationAcknowledgementRequest {
    @NotNull(message = "El ID de la notificación no puede ser nulo")
    private UUID notificationId;

    @NotBlank(message = "La firma no puede estar vacía")
    private String signature;
}
