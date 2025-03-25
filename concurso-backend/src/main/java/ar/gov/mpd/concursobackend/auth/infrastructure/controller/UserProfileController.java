package ar.gov.mpd.concursobackend.auth.infrastructure.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import ar.gov.mpd.concursobackend.auth.application.dto.UserProfileResponse;
import ar.gov.mpd.concursobackend.auth.application.dto.UserProfileUpdateRequest;
import ar.gov.mpd.concursobackend.auth.application.mapper.UserProfileMapper;
import ar.gov.mpd.concursobackend.auth.application.service.UserService;
import ar.gov.mpd.concursobackend.auth.domain.model.User;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserUsername;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserDni;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserCuit;
import ar.gov.mpd.concursobackend.shared.infrastructure.security.SecurityUtils;
import ar.gov.mpd.concursobackend.experience.application.service.ExperienceService;
import ar.gov.mpd.concursobackend.experience.application.dto.ExperienceResponseDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
@Slf4j
public class UserProfileController {

        private final UserService userService;
        private final SecurityUtils securityUtils;
        private final UserProfileMapper mapper;
        private final ExperienceService experienceService;

        @GetMapping("/profile")
        @PreAuthorize("hasRole('ROLE_USER')")
        public ResponseEntity<UserProfileResponse> getProfile() {
                String username = securityUtils.getCurrentUsername();
                log.debug("Obteniendo perfil para usuario: {}", username);

                User user = userService.getByUsername(new UserUsername(username))
                                .orElseThrow(() -> new IllegalStateException("Usuario no encontrado"));

                log.debug("Usuario encontrado: {}", user);

                // Obtener experiencias de la nueva tabla 'experience'
                List<ExperienceResponseDto> newExperiences = experienceService
                                .getAllExperiencesByUserId(user.getId().value());
                log.debug("Experiencias obtenidas de la tabla 'experience': {}", newExperiences.size());

                // Sustituir las experiencias antiguas por las nuevas
                List<ar.gov.mpd.concursobackend.auth.application.dto.ExperienciaDto> experienciasConvertidas = convertirNuevasExperiencias(
                                newExperiences);

                UserProfileResponse response = UserProfileResponse.builder()
                                .id(user.getId().value().toString())
                                .username(user.getUsername().value())
                                .email(user.getEmail().value())
                                .dni(user.getDni().value())
                                .cuit(user.getCuit().value())
                                .firstName(user.getFirstName())
                                .lastName(user.getLastName())
                                .telefono(user.getTelefono())
                                .direccion(user.getDireccion())
                                .experiencias(experienciasConvertidas)
                                .educacion(mapper.toEducacionDtoList(user.getEducacion()))
                                .habilidades(mapper.toHabilidadDtoList(user.getHabilidades()))
                                .build();

                log.debug("Respuesta construida: {}", response);
                return ResponseEntity.ok(response);
        }

        /**
         * Convierte las experiencias del nuevo formato al formato del DTO de perfil
         */
        private List<ar.gov.mpd.concursobackend.auth.application.dto.ExperienciaDto> convertirNuevasExperiencias(
                        List<ExperienceResponseDto> newExperiences) {

                List<ar.gov.mpd.concursobackend.auth.application.dto.ExperienciaDto> result = new ArrayList<>();

                for (ExperienceResponseDto exp : newExperiences) {
                        ar.gov.mpd.concursobackend.auth.application.dto.ExperienciaDto dto = ar.gov.mpd.concursobackend.auth.application.dto.ExperienciaDto
                                        .builder()
                                        .empresa(exp.getCompany())
                                        .cargo(exp.getPosition())
                                        .fechaInicio(exp.getStartDate() != null ? exp.getStartDate().toString() : null)
                                        .fechaFin(exp.getEndDate() != null ? exp.getEndDate().toString() : null)
                                        .descripcion(exp.getDescription())
                                        .comentario(exp.getComments())
                                        .build();
                        result.add(dto);
                }

                return result;
        }

        @PutMapping("/profile")
        @PreAuthorize("hasRole('ROLE_USER')")
        public ResponseEntity<UserProfileResponse> updateProfile(@Valid @RequestBody UserProfileUpdateRequest request) {
                String username = securityUtils.getCurrentUsername();
                log.debug("Actualizando perfil para usuario: {}", username);

                User user = userService.getByUsername(new UserUsername(username))
                                .orElseThrow(() -> new IllegalStateException("Usuario no encontrado"));

                user.setFirstName(request.getFirstName());
                user.setLastName(request.getLastName());
                user.setDni(new UserDni(request.getDni()));
                user.setCuit(new UserCuit(request.getCuit()));
                user.setTelefono(request.getTelefono());
                user.setDireccion(request.getDireccion());
                user.setExperiencias(mapper.toExperienciaList(request.getExperiencias()));
                user.setEducacion(mapper.toEducacionList(request.getEducacion()));
                user.setHabilidades(mapper.toHabilidadList(request.getHabilidades()));

                User updatedUser = userService.updateProfile(user);
                log.debug("Usuario actualizado: {}", updatedUser);

                UserProfileResponse response = UserProfileResponse.builder()
                                .id(updatedUser.getId().value().toString())
                                .username(updatedUser.getUsername().value())
                                .email(updatedUser.getEmail().value())
                                .dni(updatedUser.getDni().value())
                                .cuit(updatedUser.getCuit().value())
                                .firstName(updatedUser.getFirstName())
                                .lastName(updatedUser.getLastName())
                                .telefono(updatedUser.getTelefono())
                                .direccion(updatedUser.getDireccion())
                                .experiencias(mapper.toExperienciaDtoList(updatedUser.getExperiencias()))
                                .educacion(mapper.toEducacionDtoList(updatedUser.getEducacion()))
                                .habilidades(mapper.toHabilidadDtoList(updatedUser.getHabilidades()))
                                .build();

                return ResponseEntity.ok(response);
        }
}