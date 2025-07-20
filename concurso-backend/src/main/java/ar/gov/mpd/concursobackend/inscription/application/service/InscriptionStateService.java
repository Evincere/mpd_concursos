package ar.gov.mpd.concursobackend.inscription.application.service;

import ar.gov.mpd.concursobackend.inscription.domain.exception.InscriptionCannotBeCancelledException;
import ar.gov.mpd.concursobackend.inscription.domain.exception.InscriptionNotFoundException;
import ar.gov.mpd.concursobackend.inscription.domain.model.Inscription;
import ar.gov.mpd.concursobackend.inscription.domain.model.InscriptionState;
import ar.gov.mpd.concursobackend.inscription.domain.port.InscriptionRepository;
import ar.gov.mpd.concursobackend.inscription.domain.service.InscriptionStateMachine;
import ar.gov.mpd.concursobackend.shared.infrastructure.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * ✅ SERVICIO UNIFICADO: Manejo centralizado de cambios de estado de inscripciones
 * 
 * Responsabilidades:
 * - Validar transiciones de estado usando StateMachine
 * - Aplicar reglas de negocio específicas por transición
 * - Validar permisos de usuario
 * - Mantener auditoría de cambios
 */
@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class InscriptionStateService {

    private final InscriptionRepository inscriptionRepository;
    private final InscriptionStateMachine stateMachine;
    private final SecurityUtils securityUtils;
    private final InscriptionAuditService auditService;
    
    /**
     * ✅ MÉTODO UNIFICADO: Cambiar estado de inscripción con validaciones completas
     * 
     * @param inscriptionId ID de la inscripción
     * @param newState Nuevo estado deseado
     * @param validateOwnership Si debe validar que pertenece al usuario actual
     * @param reason Razón del cambio (opcional, para auditoría)
     * @return Inscripción actualizada
     */
    public Inscription changeState(UUID inscriptionId, InscriptionState newState, 
                                 boolean validateOwnership, String reason) {
        log.debug("Cambiando estado de inscripción {} a {}", inscriptionId, newState);
        
        // Obtener inscripción
        Inscription inscription = inscriptionRepository.findById(inscriptionId)
            .orElseThrow(() -> {
                log.error("Inscripción no encontrada: {}", inscriptionId);
                return new InscriptionNotFoundException("Inscripción no encontrada o sin permisos de acceso");
            });
        
        // Validar propiedad si es requerido
        if (validateOwnership) {
            validateOwnership(inscription, inscriptionId);
        }
        
        // Validar transición de estado
        validateStateTransition(inscription, newState, inscriptionId);
        
        // Aplicar cambio de estado
        InscriptionState previousState = inscription.getState();
        applyStateChange(inscription, newState, reason);
        
        // Guardar cambios
        Inscription updatedInscription = inscriptionRepository.save(inscription);

        // ✅ AUDITORÍA: Registrar cambio de estado
        auditService.auditStateChange(inscriptionId, previousState, newState, reason,
                validateOwnership ? InscriptionAuditService.AuditActionType.USER_ACTION
                                 : InscriptionAuditService.AuditActionType.ADMIN_ACTION);

        log.info("Estado de inscripción {} cambiado de {} a {} exitosamente",
                inscriptionId, previousState, newState);

        return updatedInscription;
    }
    
    /**
     * ✅ MÉTODO ESPECÍFICO: Cancelar inscripción (delegación al método unificado)
     */
    public Inscription cancelInscription(UUID inscriptionId) {
        return changeState(inscriptionId, InscriptionState.CANCELLED, true, "Cancelada por el usuario");
    }
    
    /**
     * ✅ MÉTODO ESPECÍFICO: Cambio administrativo de estado
     */
    public Inscription changeStateByAdmin(UUID inscriptionId, InscriptionState newState, String reason) {
        return changeState(inscriptionId, newState, false, reason);
    }
    
    /**
     * Valida que la inscripción pertenece al usuario actual
     */
    private void validateOwnership(Inscription inscription, UUID inscriptionId) {
        String currentUserId = securityUtils.getCurrentUserId();
        if (!inscription.getUserId().getValue().toString().equals(currentUserId)) {
            log.error("Usuario {} intentó modificar inscripción que no le pertenece: {}", 
                    currentUserId, inscriptionId);
            throw new InscriptionNotFoundException("Inscripción no encontrada o sin permisos de acceso");
        }
    }
    
    /**
     * Valida que la transición de estado es permitida
     */
    private void validateStateTransition(Inscription inscription, InscriptionState newState, UUID inscriptionId) {
        try {
            stateMachine.validateTransition(inscription.getState(), newState);
        } catch (IllegalStateException e) {
            log.error("Transición de estado inválida para inscripción {}: {} -> {}", 
                    inscriptionId, inscription.getState(), newState);
            
            if (newState == InscriptionState.CANCELLED) {
                throw new InscriptionCannotBeCancelledException(inscription.getState());
            } else {
                throw new IllegalArgumentException(
                    String.format("Transición de estado no permitida: %s -> %s", 
                            inscription.getState(), newState));
            }
        }
    }
    
    /**
     * Aplica el cambio de estado con lógica específica
     */
    private void applyStateChange(Inscription inscription, InscriptionState newState, String reason) {
        switch (newState) {
            case CANCELLED -> inscription.cancel();
            case PENDING -> {
                inscription.setState(InscriptionState.PENDING);
                inscription.setLastUpdated(LocalDateTime.now());
            }
            case APPROVED -> {
                inscription.setState(InscriptionState.APPROVED);
                inscription.setLastUpdated(LocalDateTime.now());
            }
            case REJECTED -> {
                inscription.setState(InscriptionState.REJECTED);
                inscription.setLastUpdated(LocalDateTime.now());
            }
            case FROZEN -> {
                inscription.setState(InscriptionState.FROZEN);
                inscription.setLastUpdated(LocalDateTime.now());
            }
            default -> {
                inscription.setState(newState);
                inscription.setLastUpdated(LocalDateTime.now());
            }
        }
        
        // TODO: Agregar nota de auditoría si se proporciona razón
        if (reason != null && !reason.trim().isEmpty()) {
            log.debug("Razón del cambio de estado: {}", reason);
            // Aquí se podría agregar una nota a la inscripción
        }
    }
}
