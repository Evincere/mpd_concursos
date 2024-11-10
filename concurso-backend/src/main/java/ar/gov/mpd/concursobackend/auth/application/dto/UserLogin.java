package ar.gov.mpd.concursobackend.auth.application.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UserLogin {
    @NotBlank(message = "El nombre de usuario es obligatorio")
    private String username;

    @NotBlank(message = "La contraseña es obligatoria")
    private String password;
} 