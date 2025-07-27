package ar.gov.mpd.concursobackend.inscription.application.service;

import ar.gov.mpd.concursobackend.contest.domain.model.Contest;
import ar.gov.mpd.concursobackend.contest.domain.port.ContestRepository;
import ar.gov.mpd.concursobackend.inscription.domain.model.Inscription;
import ar.gov.mpd.concursobackend.inscription.domain.model.InscriptionState;
import ar.gov.mpd.concursobackend.inscription.domain.port.InscriptionRepository;
import ar.gov.mpd.concursobackend.inscription.domain.service.InscriptionStateMachine;
import ar.gov.mpd.concursobackend.shared.infrastructure.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

/**
 * ✅ SERVICIO DE VALIDACIÓN: Proporciona información detallada sobre operaciones permitidas
 * 
 * Responsabilidades:
 * - Validar si una inscripción puede ser cancelada
 * - Proporcionar mensajes específicos sobre restricciones
 * - Verificar permisos y reglas de negocio
 * - Soporte para validaciones en tiempo real (frontend)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class InscriptionValidationService {
    
    private final InscriptionRepository inscriptionRepository;
    private final ContestRepository contestRepository;
    private final InscriptionStateMachine stateMachine;
    private final SecurityUtils securityUtils;
    
    /**
     * ✅ VALIDACIÓN COMPLETA: Verifica si una inscripción puede ser cancelada
     * 
     * @param inscriptionId ID de la inscripción
     * @return Resultado de validación con detalles
     */
    public CancellationValidationResult validateCancellation(UUID inscriptionId) {
        log.debug("Validando posibilidad de cancelación para inscripción: {}", inscriptionId);
        
        try {
            // Verificar que la inscripción existe
            Optional<Inscription> inscriptionOpt = inscriptionRepository.findById(inscriptionId);
            if (inscriptionOpt.isEmpty()) {
                return CancellationValidationResult.notFound();
            }
            
            Inscription inscription = inscriptionOpt.get();
            
            // Verificar propiedad
            String currentUserId = securityUtils.getCurrentUserId();
            if (!inscription.getUserId().getValue().toString().equals(currentUserId)) {
                return CancellationValidationResult.noPermission();
            }
            
            // Verificar estado actual
            if (inscription.getState() == InscriptionState.CANCELLED) {
                return CancellationValidationResult.alreadyCancelled();
            }
            
            // ✅ REFACTORING: Delegación completa a InscriptionStateMachine
            // Eliminada duplicación de lógica de validación de transiciones
            if (!stateMachine.canTransition(inscription.getState(), InscriptionState.CANCELLED)) {
                return CancellationValidationResult.invalidState(inscription.getState());
            }
            
            // Verificar restricciones temporales del concurso
            Contest contest = contestRepository.findById(inscription.getContestId().getValue())
                .orElse(null);
            
            if (contest != null) {
                CancellationValidationResult contestValidation = validateContestRestrictions(contest);
                if (!contestValidation.isValid()) {
                    return contestValidation;
                }
            }
            
            // Todo válido
            return CancellationValidationResult.valid();
            
        } catch (Exception e) {
            log.error("Error al validar cancelación para inscripción {}: {}", inscriptionId, e.getMessage(), e);
            return CancellationValidationResult.systemError(e.getMessage());
        }
    }
    
    /**
     * Valida restricciones específicas del concurso
     */
    private CancellationValidationResult validateContestRestrictions(Contest contest) {
        // TODO: Implementar validaciones específicas del concurso
        // Por ejemplo:
        // - Si el concurso ya cerró
        // - Si está en proceso de evaluación
        // - Si hay restricciones temporales específicas
        
        return CancellationValidationResult.valid();
    }
    
    /**
     * ✅ RESULTADO DE VALIDACIÓN: Información detallada sobre la validación
     */
    public static class CancellationValidationResult {
        private final boolean valid;
        private final String errorCode;
        private final String userMessage;
        private final String technicalMessage;
        
        private CancellationValidationResult(boolean valid, String errorCode, 
                                           String userMessage, String technicalMessage) {
            this.valid = valid;
            this.errorCode = errorCode;
            this.userMessage = userMessage;
            this.technicalMessage = technicalMessage;
        }
        
        public boolean isValid() { return valid; }
        public String getErrorCode() { return errorCode; }
        public String getUserMessage() { return userMessage; }
        public String getTechnicalMessage() { return technicalMessage; }
        
        // Factory methods para diferentes tipos de resultado
        
        public static CancellationValidationResult valid() {
            return new CancellationValidationResult(true, null, null, null);
        }
        
        public static CancellationValidationResult notFound() {
            return new CancellationValidationResult(false, "INSCRIPTION_NOT_FOUND",
                "La inscripción no fue encontrada o no tienes permisos para acceder a ella.",
                "Inscription not found or no permission");
        }
        
        public static CancellationValidationResult noPermission() {
            return new CancellationValidationResult(false, "NO_PERMISSION",
                "No tienes permisos para cancelar esta inscripción.",
                "User does not own this inscription");
        }
        
        public static CancellationValidationResult alreadyCancelled() {
            return new CancellationValidationResult(false, "ALREADY_CANCELLED",
                "Esta inscripción ya ha sido cancelada anteriormente.",
                "Inscription is already in CANCELLED state");
        }
        
        public static CancellationValidationResult invalidState(InscriptionState currentState) {
            String userMessage = switch (currentState) {
                case APPROVED -> "No puedes cancelar una inscripción que ya ha sido aprobada.";
                case REJECTED -> "No puedes cancelar una inscripción que ya ha sido rechazada.";
                case FROZEN -> "No puedes cancelar una inscripción que ha sido congelada por vencimiento de plazos.";
                default -> String.format("No se puede cancelar una inscripción en estado %s.", 
                                        currentState.getDisplayName());
            };
            
            return new CancellationValidationResult(false, "INVALID_STATE",
                userMessage,
                String.format("Cannot transition from %s to CANCELLED", currentState));
        }
        
        public static CancellationValidationResult contestClosed() {
            return new CancellationValidationResult(false, "CONTEST_CLOSED",
                "No se pueden cancelar inscripciones porque el concurso ya ha cerrado.",
                "Contest is closed for modifications");
        }
        
        public static CancellationValidationResult systemError(String error) {
            return new CancellationValidationResult(false, "SYSTEM_ERROR",
                "Ocurrió un error interno. Por favor, intenta nuevamente más tarde.",
                error);
        }
    }
}
