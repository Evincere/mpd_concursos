package ar.gov.mpd.concursobackend.notification.infrastructure.rest;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class TestNotificationRequest {
    @NotBlank(message = "El asunto no puede estar vacío")
    @Size(max = 200, message = "El asunto no puede exceder los 200 caracteres")
    private String subject;

    @NotBlank(message = "El contenido no puede estar vacío")
    @Size(max = 5000, message = "El contenido no puede exceder los 5000 caracteres")
    private String content;
}
