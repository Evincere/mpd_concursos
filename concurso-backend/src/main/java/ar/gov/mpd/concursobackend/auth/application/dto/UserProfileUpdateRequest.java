package ar.gov.mpd.concursobackend.auth.application.dto;

import java.util.List;

import ar.gov.mpd.concursobackend.auth.application.dto.ExperienciaDto;
import ar.gov.mpd.concursobackend.auth.application.dto.EducacionDto;
import ar.gov.mpd.concursobackend.auth.application.dto.HabilidadDto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileUpdateRequest {
    @NotBlank(message = "El nombre es requerido")
    private String firstName;

    @NotBlank(message = "El apellido es requerido")
    private String lastName;

    @NotBlank(message = "El DNI es requerido")
    @Pattern(regexp = "^\\d{7,8}$", message = "El DNI debe tener 7 u 8 dígitos")
    private String dni;

    @NotBlank(message = "El CUIT es requerido")
    @Pattern(regexp = "^\\d{11}$", message = "El CUIT debe tener 11 dígitos")
    private String cuit;

    private String telefono;
    private String direccion;
    private List<ExperienciaDto> experiencias;
    private List<EducacionDto> educacion;
    private List<HabilidadDto> habilidades;
}