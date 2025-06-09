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

        // Obtener información del usuario que realiza la acción para auditoría
        String currentUserId = securityUtils.getCurrentUserId();
        String currentUsername = securityUtils.getCurrentUsername();

        log.info("Usuario {} (ID: {}) cambiando estado del usuario {} a {}",
                currentUsername, currentUserId, userId, request.getStatus());

        try {
            // Validar que el estado solicitado sea válido
            UserStatus newStatus;
            try {
                newStatus = UserStatus.valueOf(request.getStatus().toUpperCase());
            } catch (IllegalArgumentException e) {
                log.error("Estado inválido: {} solicitado por usuario {}", request.getStatus(), currentUsername);
                return ResponseEntity.badRequest().build();
            }

            // Validación de seguridad: evitar que un usuario cambie su propio estado
            if (currentUserId != null && currentUserId.equals(userId.toString())) {
                log.warn("Usuario {} intentó cambiar su propio estado - operación denegada", currentUsername);
                return ResponseEntity.status(403).build(); // Forbidden
            }

            // Obtener el usuario objetivo
            User targetUser = userService.getById(userId)
                    .orElseThrow(() -> {
                        log.error("Usuario objetivo no encontrado: {} (solicitado por {})", userId, currentUsername);
                        return new RuntimeException("Usuario no encontrado");
                    });

            // Registrar el estado anterior para auditoría
            UserStatus previousStatus = targetUser.getStatus();
            log.info("Cambiando estado del usuario {} de {} a {} (acción realizada por {})",
                    targetUser.getUsername().value(), previousStatus, newStatus, currentUsername);

            // Establecer el nuevo estado
            targetUser.setStatus(newStatus);

            // Actualizar el usuario
            targetUser = userService.updateUser(targetUser);

            log.info("Estado del usuario {} cambiado exitosamente de {} a {} por el administrador {}",
                    targetUser.getUsername().value(), previousStatus, newStatus, currentUsername);

            // Mapear y devolver la respuesta
            UserStatusResponse response = new UserStatusResponse();
            response.setId(userId.toString());
            response.setUsername(targetUser.getUsername().value());
            response.setStatus(newStatus.toString());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error al cambiar el estado del usuario {} (solicitado por {}): {}",
                    userId, currentUsername, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}
