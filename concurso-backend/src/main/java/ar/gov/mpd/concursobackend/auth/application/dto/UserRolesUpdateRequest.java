package ar.gov.mpd.concursobackend.auth.application.dto;

import java.util.List;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

@Data
public class UserRolesUpdateRequest {

    @NotEmpty(message = "La lista de roles no puede estar vacía")
    private List<String> roles;
} 