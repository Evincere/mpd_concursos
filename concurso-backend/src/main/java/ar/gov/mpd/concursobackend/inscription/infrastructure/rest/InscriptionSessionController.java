package ar.gov.mpd.concursobackend.inscription.infrastructure.rest;

import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionSessionRequest;
import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionSessionResponse;
import ar.gov.mpd.concursobackend.inscription.application.port.in.DeleteInscriptionSessionUseCase;
import ar.gov.mpd.concursobackend.inscription.application.port.in.GetInscriptionSessionUseCase;
import ar.gov.mpd.concursobackend.inscription.application.port.in.SaveInscriptionSessionUseCase;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import java.util.List;
import java.util.UUID;

/**
 * Controlador REST para sesiones de inscripción
 * TEMPORALMENTE DESHABILITADO PARA DEBUGGING
 */
// @RestController
// @RequestMapping("/api/inscription-sessions")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:4200", "https://vps-4778464-x.dattaweb.com"}, allowCredentials = "true")
public class InscriptionSessionController {
    private final SaveInscriptionSessionUseCase saveInscriptionSessionUseCase;
    private final GetInscriptionSessionUseCase getInscriptionSessionUseCase;
    private final DeleteInscriptionSessionUseCase deleteInscriptionSessionUseCase;
    private static final Logger log = LoggerFactory.getLogger(InscriptionSessionController.class);

    /**
     * Guarda una sesión de inscripción
     * @param request Datos de la sesión a guardar
     * @return Sesión guardada
     */
    @PostMapping
    @PreAuthorize("hasRole('ROLE_USER')")
    public ResponseEntity<InscriptionSessionResponse> saveSession(@RequestBody InscriptionSessionRequest request) {
        log.debug("Guardando sesión de inscripción para inscripción: {}", request.getInscriptionId());
        InscriptionSessionResponse response = saveInscriptionSessionUseCase.saveSession(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Obtiene una sesión por su ID de inscripción
     * @param inscriptionId ID de la inscripción
     * @return Sesión encontrada o 404
     */
    @GetMapping("/inscription/{inscriptionId}")
    @PreAuthorize("hasRole('ROLE_USER')")
    public ResponseEntity<InscriptionSessionResponse> getSessionByInscriptionId(@PathVariable UUID inscriptionId) {
        log.debug("Buscando sesión por ID de inscripción: {}", inscriptionId);
        return getInscriptionSessionUseCase.getSessionByInscriptionId(inscriptionId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Obtiene una sesión por ID de concurso para el usuario autenticado
     * @param contestId ID del concurso
     * @return Sesión encontrada o 404
     */
    @GetMapping("/contest/{contestId}")
    @PreAuthorize("hasRole('ROLE_USER')")
    public ResponseEntity<InscriptionSessionResponse> getSessionByContestId(@PathVariable Long contestId) {
        log.debug("Buscando sesión por ID de concurso: {}", contestId);
        return getInscriptionSessionUseCase.getSessionByContestId(contestId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Obtiene todas las sesiones del usuario autenticado
     * @return Lista de sesiones
     */
    @GetMapping
    @PreAuthorize("hasRole('ROLE_USER')")
    public ResponseEntity<List<InscriptionSessionResponse>> getSessionsByCurrentUser() {
        log.debug("Buscando sesiones para el usuario autenticado");
        List<InscriptionSessionResponse> sessions = getInscriptionSessionUseCase.getSessionsByCurrentUser();
        return ResponseEntity.ok(sessions);
    }

    /**
     * Elimina una sesión por su ID de inscripción
     * @param inscriptionId ID de la inscripción
     * @return 204 No Content
     */
    @DeleteMapping("/inscription/{inscriptionId}")
    @PreAuthorize("hasRole('ROLE_USER')")
    public ResponseEntity<Void> deleteSessionByInscriptionId(@PathVariable UUID inscriptionId) {
        log.debug("Eliminando sesión por ID de inscripción: {}", inscriptionId);
        deleteInscriptionSessionUseCase.deleteSessionByInscriptionId(inscriptionId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Elimina sesiones expiradas (solo para administradores)
     * @return Número de sesiones eliminadas
     */
    @DeleteMapping("/expired")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<Integer> deleteExpiredSessions() {
        log.debug("Eliminando sesiones expiradas");
        int deleted = deleteInscriptionSessionUseCase.deleteExpiredSessions();
        return ResponseEntity.ok(deleted);
    }
}
