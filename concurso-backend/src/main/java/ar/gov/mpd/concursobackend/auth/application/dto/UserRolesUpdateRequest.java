package ar.gov.mpd.concursobackend.auth.application.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class UserRolesUpdateRequest {

    @NotEmpty(message = "La lista de roles no puede estar vacía")
    private List<String> roles;
} 