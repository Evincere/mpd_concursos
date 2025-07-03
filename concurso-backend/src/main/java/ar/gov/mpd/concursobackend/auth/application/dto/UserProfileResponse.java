package ar.gov.mpd.concursobackend.auth.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {
    private String id;
    private String username;
    private String email;
    private String dni;
    private String cuit;
    private String firstName;
    private String lastName;
    private String telefono;
    private String direccion;
    private String profileImageUrl;
    private List<ExperienciaDto> experiencias;
    private List<EducacionDto> educacion;
    private List<HabilidadDto> habilidades;

    // Campos adicionales para el panel de administración
    private Set<String> roles;
    private LocalDateTime createdAt;
    private String status;
    private boolean enabled;
}