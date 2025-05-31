package ar.gov.mpd.concursobackend.auth.infrastructure.controller;

import ar.gov.mpd.concursobackend.auth.application.service.UserService;
import ar.gov.mpd.concursobackend.auth.domain.model.User;
import ar.gov.mpd.concursobackend.auth.domain.model.UserStatus;
import ar.gov.mpd.concursobackend.auth.infrastructure.dto.UserStatusChangeRequest;
import ar.gov.mpd.concursobackend.auth.infrastructure.dto.UserStatusResponse;
import ar.gov.mpd.concursobackend.shared.infrastructure.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Controlador para gestionar el estado de los usuarios
 */
@RestController
@RequestMapping({"/api/users", "/api/auth/users"})
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
@Slf4j
public class UserStatusController {

    private final UserService userService;
    private final SecurityUtils securityUtils;

    /**
     * Endpoint para cambiar el estado de un usuario
     * Solo accesible para administradores
     *
     * @param userId ID del usuario
     * @param request Datos del cambio de estado
     * @return Usuario actualizado
     */
    @PatchMapping("/{userId}/status")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<UserStatusResponse> changeUserStatus(
            @PathVariable UUID userId,
            @RequestBody UserStatusChangeRequest request) {

        log.info("Cambiando estado del usuario {} a {}", userId, request.getStatus());

        try {
            // Validar que el estado solicitado sea válido
            UserStatus newStatus;
            try {
                newStatus = UserStatus.valueOf(request.getStatus().toUpperCase());
            } catch (IllegalArgumentException e) {
                log.error("Estado inválido: {}", request.getStatus());
                return ResponseEntity.badRequest().build();
            }

            // Obtener el usuario actual
            User user = userService.getById(userId)
                    .orElseThrow(() -> {
                        log.error("Usuario no encontrado: {}", userId);
                        return new RuntimeException("Usuario no encontrado");
                    });

            // Cambiar el estado del usuario
            // Establecer el nuevo estado
            user.setStatus(newStatus);

            // Actualizar el usuario
            user = userService.updateUser(user);

            log.info("Estado del usuario {} cambiado a {} correctamente", userId, newStatus);

            // Mapear y devolver la respuesta
            UserStatusResponse response = new UserStatusResponse();
            response.setId(userId.toString());
            response.setUsername(user.getUsername().value());
            response.setStatus(newStatus.toString());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error al cambiar el estado del usuario {}: {}", userId, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}
