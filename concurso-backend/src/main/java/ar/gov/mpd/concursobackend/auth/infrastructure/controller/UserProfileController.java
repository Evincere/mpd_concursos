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
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
@Slf4j
public class UserProfileController {

        private final UserService userService;
        private final SecurityUtils securityUtils;
        private final UserProfileMapper mapper;

        @GetMapping("/profile")
        @PreAuthorize("hasRole('ROLE_USER')")
        public ResponseEntity<UserProfileResponse> getProfile() {
                String username = securityUtils.getCurrentUsername();
                log.debug("Obteniendo perfil para usuario: {}", username);

                User user = userService.getByUsername(new UserUsername(username))
                                .orElseThrow(() -> new IllegalStateException("Usuario no encontrado"));

                log.debug("Usuario encontrado: {}", user);

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
                                .experiencias(mapper.toExperienciaDtoList(user.getExperiencias()))
                                .educacion(mapper.toEducacionDtoList(user.getEducacion()))
                                .habilidades(mapper.toHabilidadDtoList(user.getHabilidades()))
                                .build();

                log.debug("Respuesta construida: {}", response);
                return ResponseEntity.ok(response);
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