package ar.gov.mpd.concursobackend.auth.application.dto;

import ar.gov.mpd.concursobackend.auth.domain.model.UserStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UserStatusUpdateRequest {

    @NotNull(message = "El estado no puede ser nulo")
    private UserStatus status;
    
    private String reason;
} 