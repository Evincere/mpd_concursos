package ar.gov.mpd.concursobackend.auth.infrastructure.controller;

import ar.gov.mpd.concursobackend.auth.application.dto.UserProfileResponse;
import ar.gov.mpd.concursobackend.auth.application.dto.UserProfileUpdateRequest;
import ar.gov.mpd.concursobackend.auth.application.mapper.UserProfileMapper;
import ar.gov.mpd.concursobackend.auth.application.service.ProfileImageService;
import ar.gov.mpd.concursobackend.auth.application.service.UserService;
import ar.gov.mpd.concursobackend.auth.domain.model.User;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserCuit;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserDni;
import ar.gov.mpd.concursobackend.auth.domain.valueObject.user.UserUsername;
import ar.gov.mpd.concursobackend.experience.application.dto.ExperienceResponseDto;
import ar.gov.mpd.concursobackend.experience.application.service.ExperienceService;
import ar.gov.mpd.concursobackend.shared.infrastructure.security.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/users/profile")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:4200", "https://vps-4778464-x.dattaweb.com"})
@Slf4j
public class UserProfileController {

        private final UserService userService;
        private final SecurityUtils securityUtils;
        private final UserProfileMapper mapper;
        private final ExperienceService experienceService;
        private final ProfileImageService profileImageService;

        @GetMapping
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
                                .cuit(user.getCuit() != null ? user.getCuit().value() : null)
                                .firstName(user.getFirstName())
                                .lastName(user.getLastName())
                                .telefono(user.getTelefono())
                                .direccion(user.getDireccion())
                                .profileImageUrl(user.getProfileImageUrl() != null ? user.getProfileImageUrl().getUrlOrNull() : null)
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

        @PutMapping
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
                                .cuit(updatedUser.getCuit() != null ? updatedUser.getCuit().value() : null)
                                .firstName(updatedUser.getFirstName())
                                .lastName(updatedUser.getLastName())
                                .telefono(updatedUser.getTelefono())
                                .direccion(updatedUser.getDireccion())
                                .profileImageUrl(updatedUser.getProfileImageUrl() != null ? updatedUser.getProfileImageUrl().getUrlOrNull() : null)
                                .experiencias(mapper.toExperienciaDtoList(updatedUser.getExperiencias()))
                                .educacion(mapper.toEducacionDtoList(updatedUser.getEducacion()))
                                .habilidades(mapper.toHabilidadDtoList(updatedUser.getHabilidades()))
                                .build();

                return ResponseEntity.ok(response);
        }

        /**
         * Sube una nueva imagen de perfil para el usuario autenticado
         *
         * @param file Archivo de imagen a subir
         * @return URL de la imagen subida
         */
        @PostMapping(value = "/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
        @PreAuthorize("hasRole('ROLE_USER')")
        public ResponseEntity<?> uploadProfileImage(@RequestParam("image") MultipartFile file) {
                try {
                        String username = securityUtils.getCurrentUsername();
                        log.info("Subiendo imagen de perfil para usuario: {}", username);

                        String imageUrl = profileImageService.uploadProfileImage(username, file);

                        return ResponseEntity.ok(java.util.Map.of(
                                "success", true,
                                "message", "Imagen de perfil subida exitosamente",
                                "imageUrl", imageUrl
                        ));

                } catch (IllegalArgumentException e) {
                        log.warn("Error de validación al subir imagen: {}", e.getMessage());
                        return ResponseEntity.badRequest().body(java.util.Map.of(
                                "success", false,
                                "error", e.getMessage()
                        ));
                } catch (Exception e) {
                        log.error("Error interno al subir imagen de perfil", e);
                        return ResponseEntity.internalServerError().body(java.util.Map.of(
                                "success", false,
                                "error", "Error interno del servidor"
                        ));
                }
        }

        /**
         * Elimina la imagen de perfil del usuario autenticado
         *
         * @return Confirmación de eliminación
         */
        @DeleteMapping("/image")
        @PreAuthorize("hasRole('ROLE_USER')")
        public ResponseEntity<?> deleteProfileImage() {
                try {
                        String username = securityUtils.getCurrentUsername();
                        log.info("Eliminando imagen de perfil para usuario: {}", username);

                        profileImageService.deleteProfileImage(username);

                        return ResponseEntity.ok(java.util.Map.of(
                                "success", true,
                                "message", "Imagen de perfil eliminada exitosamente"
                        ));

                } catch (IllegalArgumentException e) {
                        log.warn("Error al eliminar imagen: {}", e.getMessage());
                        return ResponseEntity.badRequest().body(java.util.Map.of(
                                "success", false,
                                "error", e.getMessage()
                        ));
                } catch (Exception e) {
                        log.error("Error interno al eliminar imagen de perfil", e);
                        return ResponseEntity.internalServerError().body(java.util.Map.of(
                                "success", false,
                                "error", "Error interno del servidor"
                        ));
                }
        }
}