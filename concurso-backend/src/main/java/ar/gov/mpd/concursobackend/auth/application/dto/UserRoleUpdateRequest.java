package ar.gov.mpd.concursobackend.auth.application.dto;

import ar.gov.mpd.concursobackend.auth.domain.enums.RoleEnum;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UserRoleUpdateRequest {
    @NotBlank(message = "El nombre de usuario es obligatorio")
    private String username;

    @NotNull(message = "El rol es obligatorio")
    private RoleEnum role;
}