package ar.gov.mpd.concursobackend.inscription.infrastructure.rest;

import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionDetailResponse;
import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionDetailsResponse;
import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionDataUpdateRequest;
import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionRequest;
import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionResponse;
import ar.gov.mpd.concursobackend.inscription.application.mapper.InscriptionMapper;
import ar.gov.mpd.concursobackend.inscription.application.port.in.CancelInscriptionUseCase;
import ar.gov.mpd.concursobackend.inscription.application.port.in.CreateInscriptionUseCase;
import ar.gov.mpd.concursobackend.inscription.application.port.in.FindInscriptionsUseCase;
import ar.gov.mpd.concursobackend.inscription.application.port.in.GetInscriptionDetailsUseCase;
import ar.gov.mpd.concursobackend.inscription.application.port.in.UpdateInscriptionDataUseCase;
import ar.gov.mpd.concursobackend.inscription.application.port.in.UpdateInscriptionStatusUseCase;
import ar.gov.mpd.concursobackend.inscription.application.port.out.LoadInscriptionPort;
import ar.gov.mpd.concursobackend.inscription.application.service.InscriptionValidationService;
import ar.gov.mpd.concursobackend.inscription.domain.model.Inscription;
import ar.gov.mpd.concursobackend.shared.infrastructure.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * REST controller for managing inscriptions
 */
@RestController
@RequestMapping({"/api/inscriptions", "/api/inscripciones"})
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:4200", "https://vps-4778464-x.dattaweb.com"}, allowCredentials = "true")
@Slf4j
public class InscriptionController {
    private final CreateInscriptionUseCase createInscriptionUseCase;
    private final FindInscriptionsUseCase findInscriptionsUseCase;
    private final CancelInscriptionUseCase cancelInscriptionUseCase;
    private final UpdateInscriptionStatusUseCase updateInscriptionStatusUseCase;
    private final GetInscriptionDetailsUseCase getInscriptionDetailsUseCase;
    private final UpdateInscriptionDataUseCase updateInscriptionDataUseCase;
    private final SecurityUtils securityUtils;
    private final LoadInscriptionPort loadInscriptionPort;
    private final InscriptionMapper inscriptionMapper;
    private final InscriptionValidationService validationService;

    /**
     * Creates a new inscription for the current user
     */
    @PostMapping
    @PreAuthorize("hasRole('ROLE_USER')")
    public ResponseEntity<InscriptionDetailResponse> createInscription(@RequestBody InscriptionRequest request) {
        String currentUserId = securityUtils.getCurrentUserId();
        if (currentUserId == null) {
            throw new IllegalStateException("No authenticated user found");
        }

        request.setUserId(UUID.fromString(currentUserId));
        log.debug("Creating inscription for user {} in contest {}", currentUserId, request.getContestId());

        try {
            InscriptionDetailResponse response = createInscriptionUseCase.createInscription(request);
            log.info("Successfully created inscription for user {} in contest {}", currentUserId, request.getContestId());
            return ResponseEntity.ok(response);
        } catch (IllegalStateException e) {
            log.error("Business rule violation when creating inscription for user {} in contest {}: {}",
                    currentUserId, request.getContestId(), e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        } catch (IllegalArgumentException e) {
            log.error("Validation error when creating inscription for user {} in contest {}: {}",
                    currentUserId, request.getContestId(), e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Unexpected error when creating inscription for user {} in contest {}: {}",
                    currentUserId, request.getContestId(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Gets all inscriptions for the current user - alias endpoint
     */
    @GetMapping("/me")
    @PreAuthorize("hasRole('ROLE_USER')")
    public ResponseEntity<Page<InscriptionResponse>> getMyInscriptionsAlias(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "inscriptionDate") String sort,
            @RequestParam(defaultValue = "DESC") String direction) {
        return getUserInscriptions(page, size, sort, direction);
    }

    /**
     * Gets all inscriptions for the current user
     */
    @GetMapping("/user")
    @PreAuthorize("hasRole('ROLE_USER')")
    public ResponseEntity<Page<InscriptionResponse>> getUserInscriptions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "inscriptionDate") String sort,
            @RequestParam(defaultValue = "DESC") String direction) {

        String currentUserId = securityUtils.getCurrentUserId();
        if (currentUserId == null) {
            throw new IllegalStateException("No authenticated user found");
        }

        log.debug("Getting inscriptions for user {}", currentUserId);

        var pageRequest = PageRequest.of(
                page,
                size,
                Sort.Direction.valueOf(direction),
                sort);

        Page<InscriptionResponse> inscriptions = findInscriptionsUseCase.findAllPaged(
            pageRequest, UUID.fromString(currentUserId));

        return ResponseEntity.ok(inscriptions);
    }

    /**
     * Gets all inscriptions for a contest (admin only)
     */
    @GetMapping("/contest/{contestId}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<Page<InscriptionResponse>> getContestInscriptions(
            @PathVariable Long contestId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "inscriptionDate") String sort,
            @RequestParam(defaultValue = "DESC") String direction) {

        log.debug("Getting inscriptions for contest {}", contestId);

        // This method is not implemented in the current interface
        // In a real implementation, you would add a method to FindInscriptionsUseCase to get inscriptions by contest ID
        // For now, we'll return an empty page
        log.warn("Method findByContestId is not implemented in FindInscriptionsUseCase");

        return ResponseEntity.ok(Page.empty());
    }

    /**
     * Gets details of a specific inscription
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_USER', 'ROLE_ADMIN')")
    public ResponseEntity<InscriptionDetailResponse> getInscriptionDetails(@PathVariable UUID id) {
        log.debug("Getting details for inscription {}", id);
        InscriptionDetailResponse inscription = findInscriptionsUseCase.findById(id);
        return ResponseEntity.ok(inscription);
    }

    /**
     * Checks if a user is inscribed in a contest
     */
    @GetMapping("/status/{contestId}")
    @PreAuthorize("hasRole('ROLE_USER')")
    public ResponseEntity<Boolean> getInscriptionStatus(@PathVariable Long contestId) {
        String currentUserId = securityUtils.getCurrentUserId();
        if (currentUserId == null) {
            throw new IllegalStateException("No authenticated user found");
        }

        try {
            Boolean inscribed = findInscriptionsUseCase.findInscriptionStatus(contestId, currentUserId);
            return ResponseEntity.ok(inscribed);
        } catch (IllegalArgumentException e) {
            log.error("Validation error when checking inscription: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Gets detailed inscription status for a user in a contest
     */
    @GetMapping("/user/contest/{contestId}")
    @PreAuthorize("hasRole('ROLE_USER')")
    public ResponseEntity<Map<String, Object>> getUserInscriptionForContest(@PathVariable Long contestId) {
        String currentUserId = securityUtils.getCurrentUserId();
        if (currentUserId == null) {
            throw new IllegalStateException("No authenticated user found");
        }

        try {
            log.debug("Getting inscription details for user {} in contest {}", currentUserId, contestId);
            Optional<Inscription> inscription = loadInscriptionPort.findByContestIdAndUserId(contestId, UUID.fromString(currentUserId));

            if (inscription.isPresent()) {
                Inscription inscriptionData = inscription.get();
                Map<String, Object> response = new HashMap<>();

                // Mapear el estado de la inscripción al formato esperado por el frontend
                response.put("status", inscriptionData.getState().toString());

                // Agregar fechas importantes
                if (inscriptionData.getLastUpdated() != null) {
                    response.put("updatedAt", inscriptionData.getLastUpdated().toString());
                }
                if (inscriptionData.getCreatedAt() != null) {
                    response.put("createdAt", inscriptionData.getCreatedAt().toString());
                }

                // Agregar información adicional si está disponible
                if (inscriptionData.getCurrentStep() != null) {
                    response.put("currentStep", inscriptionData.getCurrentStep().toString());
                }

                // Agregar ID de la inscripción y del concurso
                response.put("id", inscriptionData.getId().toString());
                response.put("contestId", inscriptionData.getContestId().getValue());
                response.put("userId", currentUserId);

                log.debug("Found inscription with status {}", inscriptionData.getState());
                return ResponseEntity.ok(response);
            } else {
                log.debug("No inscription found for user {} in contest {}", currentUserId, contestId);
                return ResponseEntity.notFound().build();
            }
        } catch (IllegalArgumentException e) {
            log.error("Validation error when getting inscription details: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Error getting inscription details: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Gets detailed inscription status for a specific user in a contest (for use by frontend)
     */
    @GetMapping("/user/{userId}/contest/{contestId}")
    @PreAuthorize("hasRole('ROLE_USER')")
    public ResponseEntity<InscriptionResponse> getUserInscriptionByUserIdAndContestId(
            @PathVariable UUID userId,
            @PathVariable Long contestId) {

        String currentUserId = securityUtils.getCurrentUserId();
        if (currentUserId == null) {
            throw new IllegalStateException("No authenticated user found");
        }

        // Verificar que el usuario actual es el mismo que se está solicitando o es un administrador
        boolean isSameUser = currentUserId.equals(userId.toString());

        // Obtener la autenticación actual para verificar roles
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = authentication != null &&
                          authentication.getAuthorities().stream()
                              .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!isAdmin && !isSameUser) {
            log.warn("User {} attempted to access inscription of user {} for contest {}",
                    currentUserId, userId, contestId);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        try {
            log.debug("Getting inscription details for user {} in contest {}", userId, contestId);
            Optional<Inscription> inscription = loadInscriptionPort.findByContestIdAndUserId(contestId, userId);

            if (inscription.isPresent()) {
                Inscription inscriptionData = inscription.get();
                InscriptionResponse response = inscriptionMapper.toResponse(inscriptionData);

                log.debug("Found inscription with status {}", inscriptionData.getState());
                return ResponseEntity.ok(response);
            } else {
                log.debug("No inscription found for user {} in contest {}", userId, contestId);
                return ResponseEntity.notFound().build();
            }
        } catch (IllegalArgumentException e) {
            log.error("Validation error when getting inscription details: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Error getting inscription details: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Gets inscription status for a specific user in a contest - optimized endpoint for frontend
     */
    @GetMapping("/user/{userId}/contest/{contestId}/status")
    @PreAuthorize("hasRole('ROLE_USER')")
    public ResponseEntity<Map<String, Object>> getUserInscriptionStatus(
            @PathVariable UUID userId,
            @PathVariable Long contestId) {

        String currentUserId = securityUtils.getCurrentUserId();
        if (currentUserId == null) {
            throw new IllegalStateException("No authenticated user found");
        }

        // Verificar que el usuario actual es el mismo que se está solicitando o es un administrador
        boolean isSameUser = currentUserId.equals(userId.toString());

        // Obtener la autenticación actual para verificar roles
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = authentication != null &&
                          authentication.getAuthorities().stream()
                              .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!isAdmin && !isSameUser) {
            log.warn("User {} attempted to access inscription status of user {} for contest {}",
                    currentUserId, userId, contestId);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        try {
            log.debug("Getting inscription status for user {} in contest {}", userId, contestId);
            Optional<Inscription> inscription = loadInscriptionPort.findByContestIdAndUserId(contestId, userId);

            if (inscription.isPresent()) {
                Inscription inscriptionData = inscription.get();

                // Return simplified status response
                Map<String, Object> statusResponse = Map.of(
                    "hasInscription", true,
                    "status", inscriptionData.getState().toString(),
                    "inscriptionId", inscriptionData.getId(),
                    "contestId", contestId,
                    "userId", userId
                );

                log.debug("Found inscription with status {}", inscriptionData.getState());
                return ResponseEntity.ok(statusResponse);
            } else {
                log.debug("No inscription found for user {} in contest {}", userId, contestId);

                // Return no inscription status
                Map<String, Object> statusResponse = Map.of(
                    "hasInscription", false,
                    "status", "ACTIVE",
                    "contestId", contestId,
                    "userId", userId
                );

                return ResponseEntity.ok(statusResponse);
            }
        } catch (IllegalArgumentException e) {
            log.error("Validation error when getting inscription status: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Error getting inscription status: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Gets all inscriptions for a specific user
     */
    @GetMapping("/user/{userId}")
    @PreAuthorize("hasRole('ROLE_USER') or hasRole('ROLE_ADMIN')")
    public ResponseEntity<Page<InscriptionResponse>> getUserInscriptions(
            @PathVariable UUID userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "inscriptionDate") String sort,
            @RequestParam(defaultValue = "DESC") String direction) {

        try {
            log.debug("Getting inscriptions for user {}", userId);

            // Verificar permisos: solo el propio usuario o un administrador puede ver sus inscripciones
            String currentUserId = securityUtils.getCurrentUserId();
            if (currentUserId == null) {
                throw new IllegalStateException("No authenticated user found");
            }

            // Verificar si el usuario actual es el mismo que se está solicitando o es un administrador
            boolean isSameUser = currentUserId.equals(userId.toString());

            // Obtener la autenticación actual para verificar roles
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            boolean isAdmin = authentication != null &&
                              authentication.getAuthorities().stream()
                                  .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

            if (!isAdmin && !isSameUser) {
                log.warn("User {} attempted to access inscriptions of user {}", currentUserId, userId);
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            // Crear objeto PageRequest con la ordenación
            Sort.Direction sortDirection = Sort.Direction.fromString(direction);
            PageRequest pageRequest = PageRequest.of(page, size, Sort.by(sortDirection, sort));

            // Obtener inscripciones del usuario
            Page<Inscription> inscriptions = loadInscriptionPort.findAllByUserId(userId, pageRequest);

            // Mapear a DTOs de respuesta
            Page<InscriptionResponse> response = inscriptions.map(inscriptionMapper::toResponse);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.error("Validation error when getting user inscriptions: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Error getting user inscriptions: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Gets all inscriptions for the current user
     */
    @GetMapping("/by-user/{userId}")
    @PreAuthorize("hasRole('ROLE_USER')")
    public ResponseEntity<Page<InscriptionResponse>> getCurrentUserInscriptions(
            @PathVariable UUID userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "inscriptionDate") String sort,
            @RequestParam(defaultValue = "DESC") String direction) {

        try {
            // Verificar que el usuario actual es el mismo que se está solicitando
            String currentUserId = securityUtils.getCurrentUserId();
            if (currentUserId == null) {
                throw new IllegalStateException("No authenticated user found");
            }

            if (!currentUserId.equals(userId.toString())) {
                log.warn("User {} attempted to access inscriptions of user {}", currentUserId, userId);
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            // Crear objeto PageRequest con la ordenación
            Sort.Direction sortDirection = Sort.Direction.fromString(direction);
            PageRequest pageRequest = PageRequest.of(page, size, Sort.by(sortDirection, sort));

            // Obtener inscripciones del usuario
            Page<Inscription> inscriptions = loadInscriptionPort.findAllByUserId(userId, pageRequest);

            // Mapear a DTOs de respuesta
            Page<InscriptionResponse> response = inscriptions.map(inscriptionMapper::toResponse);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.error("Validation error when getting current user inscriptions: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Error getting current user inscriptions: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Cancels an inscription (PATCH endpoint)
     */
    @PatchMapping("/{id}/cancel")
    @PreAuthorize("hasRole('ROLE_USER')")
    public ResponseEntity<Void> cancelInscriptionPatch(@PathVariable UUID id) {
        return cancelInscriptionInternal(id);
    }

    /**
     * Cancels an inscription (DELETE endpoint for backward compatibility)
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_USER')")
    public ResponseEntity<Void> cancelInscriptionDelete(@PathVariable UUID id) {
        return cancelInscriptionInternal(id);
    }

    /**
     * ✅ ENDPOINT DE VALIDACIÓN: Verifica si una inscripción puede ser cancelada
     * Útil para el frontend para mostrar/ocultar botones y mostrar mensajes específicos
     */
    @GetMapping("/{id}/can-cancel")
    @PreAuthorize("hasRole('ROLE_USER')")
    public ResponseEntity<CancellationValidationResponse> canCancelInscription(@PathVariable UUID id) {
        try {
            InscriptionValidationService.CancellationValidationResult result =
                validationService.validateCancellation(id);

            CancellationValidationResponse response = new CancellationValidationResponse(
                result.isValid(),
                result.getErrorCode(),
                result.getUserMessage()
            );

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error validating cancellation for inscription {}: {}", id, e.getMessage());
            CancellationValidationResponse response = new CancellationValidationResponse(
                false, "SYSTEM_ERROR", "Error interno del sistema"
            );
            return ResponseEntity.ok(response);
        }
    }

    /**
     * ✅ MÉTODO SIMPLIFICADO: Manejo de cancelación sin validaciones duplicadas
     * Las validaciones de seguridad y reglas de negocio se manejan en el servicio
     */
    private ResponseEntity<Void> cancelInscriptionInternal(UUID id) {
        try {
            // ✅ DELEGACIÓN COMPLETA: El servicio maneja todas las validaciones
            cancelInscriptionUseCase.cancel(id);
            log.info("Inscription {} cancelled successfully", id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            // ✅ MANEJO SIMPLIFICADO: GlobalExceptionHandler maneja excepciones específicas
            log.error("Error cancelling inscription {}: {}", id, e.getMessage());
            throw e; // Propagar para que GlobalExceptionHandler lo maneje
        }
    }

    /**
     * ✅ DTO DE RESPUESTA: Información de validación para el frontend
     */
    public static class CancellationValidationResponse {
        private final boolean canCancel;
        private final String errorCode;
        private final String message;

        public CancellationValidationResponse(boolean canCancel, String errorCode, String message) {
            this.canCancel = canCancel;
            this.errorCode = errorCode;
            this.message = message;
        }

        public boolean isCanCancel() { return canCancel; }
        public String getErrorCode() { return errorCode; }
        public String getMessage() { return message; }
    }

    /**
     * Updates the status of an inscription (admin only)
     */
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<Void> updateStatus(@PathVariable UUID id, @RequestParam String status) {
        try {
            updateInscriptionStatusUseCase.updateStatus(id, status);
            log.info("Admin updated inscription {} to status {}", id, status);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            log.error("Validation error when updating inscription status: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * ✅ SOLUCIÓN: Obtiene los detalles específicos de una inscripción
     * Incluye centro de vida y circunscripciones seleccionadas
     */
    @GetMapping("/{id}/details")
    @PreAuthorize("hasAnyRole('ROLE_USER', 'ROLE_ADMIN')")
    public ResponseEntity<InscriptionDetailsResponse> getInscriptionDetailsSpecific(@PathVariable UUID id) {
        try {
            log.debug("Getting specific details for inscription {}", id);
            InscriptionDetailsResponse details = getInscriptionDetailsUseCase.getInscriptionDetails(id);
            return ResponseEntity.ok(details);
        } catch (IllegalArgumentException e) {
            log.error("Validation error when getting inscription details: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Error getting inscription details: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * ✅ SOLUCIÓN: Actualiza los datos específicos de una inscripción
     * Permite actualizar centro de vida y circunscripciones seleccionadas
     */
    @PatchMapping("/{id}/data")
    @PreAuthorize("hasRole('ROLE_USER')")
    public ResponseEntity<Void> updateInscriptionData(
            @PathVariable UUID id, 
            @RequestBody InscriptionDataUpdateRequest request) {
        try {
            log.debug("Updating inscription data for {}: {}", id, request);
            updateInscriptionDataUseCase.updateInscriptionData(id, request);
            log.info("Inscription data updated successfully for {}", id);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            log.error("Validation error when updating inscription data: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (IllegalStateException e) {
            log.error("State error when updating inscription data: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        } catch (Exception e) {
            log.error("Error updating inscription data: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
