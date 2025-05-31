package ar.gov.mpd.concursobackend.auth.application.dto;

import java.time.LocalDate;

import lombok.Data;
import ar.gov.mpd.concursobackend.auth.application.validation.PasswordMatches;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;

@Data
@PasswordMatches
public class UserCreateDto {
    @NotBlank(message = "El nombre de usuario es obligatorio")
    @Size(min = 4, max = 50, message = "El nombre de usuario debe tener entre 4 y 50 caracteres")
    private String username;

    @NotBlank(message = "La contraseña es obligatoria")
    @Size(min = 6, message = "La contraseña debe tener al menos 6 caracteres")
    private String password;

    @NotBlank(message = "La contraseña de confirmación es obligatoria")
    private String confirmPassword;

    @NotBlank(message = "El email es obligatorio")
    @Email(message = "El formato del email no es válido")
    private String email;

    @NotBlank(message = "El nombre es obligatorio")
    @Size(min = 3, max = 50, message = "El nombre debe tener entre 3 y 50 caracteres")
    private String firstName;

    @NotBlank(message = "El apellido es obligatorio")
    @Size(min = 3, max = 50, message = "El apellido debe tener entre 3 y 50 caracteres")
    private String lastName;

    @NotBlank(message = "El DNI es obligatorio")
    @Pattern(regexp = "\\d{8}", message = "El DNI debe tener 8 dígitos")
    private String dni;

    @Pattern(regexp = "\\d{11}", message = "El CUIT debe tener 11 dígitos")
    private String cuit;

    @Past(message = "La fecha de nacimiento debe ser pasada")
    private LocalDate birthDate;

    private String country;

    private String province;

    private String municipality;

    private String legalAddress;

    private String residentialAddress;

    private String telefono;

    // Para mantener compatibilidad con el código existente
    public String getNombre() {
        return firstName;
    }

    public void setNombre(String nombre) {
        this.firstName = nombre;
    }

    public String getApellido() {
        return lastName;
    }

    public void setApellido(String apellido) {
        this.lastName = apellido;
    }
}
