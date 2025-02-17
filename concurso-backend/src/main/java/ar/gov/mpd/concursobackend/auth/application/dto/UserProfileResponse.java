package ar.gov.mpd.concursobackend.auth.application.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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
    private List<ExperienciaDto> experiencias;
    private List<EducacionDto> educacion;
    private List<HabilidadDto> habilidades;
}