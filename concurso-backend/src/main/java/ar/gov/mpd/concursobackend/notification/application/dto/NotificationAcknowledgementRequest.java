package ar.gov.mpd.concursobackend.notification.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.Map;
import java.util.UUID;

@Data
public class NotificationAcknowledgementRequest {
    @NotNull(message = "El ID de la notificación no puede ser nulo")
    private UUID notificationId;

    @NotBlank(message = "El tipo de firma no puede estar vacío")
    private String signatureType; // PIN, DIGITAL_CERT, BIOMETRIC, DECLARATION

    @NotBlank(message = "El valor de la firma no puede estar vacío")
    private String signatureValue;

    private String declaration; // Para tipo DECLARATION

    private Map<String, String> metadata; // Datos adicionales según el tipo de firma
}
