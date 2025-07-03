package ar.gov.mpd.concursobackend.auth.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO para actualizar un usuario existente desde el panel de administración
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserRequest {
    private String firstName;
    private String lastName;
    private String email;
    private String dni;
    private String cuit;
    private List<String> roles;
    private Boolean enabled;
    private String telefono;
    private String direccion;
}
