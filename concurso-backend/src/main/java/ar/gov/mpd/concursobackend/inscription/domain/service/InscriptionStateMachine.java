package ar.gov.mpd.concursobackend.inscription.domain.service;

import ar.gov.mpd.concursobackend.inscription.domain.model.InscriptionState;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Set;

/**
 * State machine for inscription status transitions
 * Implements business rules for valid state changes according to MPD requirements
 */
@Component
public class InscriptionStateMachine {
    
    private static final Map<InscriptionState, Set<InscriptionState>> VALID_TRANSITIONS = Map.of(
        InscriptionState.ACTIVE, Set.of(
            InscriptionState.COMPLETED_WITH_DOCS, 
            InscriptionState.COMPLETED_PENDING_DOCS, 
            InscriptionState.CANCELLED
        ),
        InscriptionState.COMPLETED_WITH_DOCS, Set.of(
            InscriptionState.PENDING, 
            InscriptionState.CANCELLED
        ),
        InscriptionState.COMPLETED_PENDING_DOCS, Set.of(
            InscriptionState.COMPLETED_WITH_DOCS, 
            InscriptionState.FROZEN, 
            InscriptionState.CANCELLED
        ),
        InscriptionState.PENDING, Set.of(
            InscriptionState.APPROVED, 
            InscriptionState.REJECTED, 
            InscriptionState.CANCELLED
        ),
        InscriptionState.FROZEN, Set.of(InscriptionState.REJECTED),
        InscriptionState.APPROVED, Set.of(InscriptionState.PENDING), // Allow reversion for eventualidades
        InscriptionState.REJECTED, Set.of(InscriptionState.PENDING), // Allow reversion for eventualidades
        InscriptionState.CANCELLED, Set.of() // Final state
    );

    /**
     * Checks if a state transition is valid
     * 
     * @param from Current status
     * @param to Target status
     * @return true if transition is allowed, false otherwise
     */
    public boolean canTransition(InscriptionState from, InscriptionState to) {
        if (from == null || to == null) {
            return false;
        }
        return VALID_TRANSITIONS.getOrDefault(from, Set.of()).contains(to);
    }

    /**
     * Validates a state transition and throws exception if invalid
     * 
     * @param from Current status
     * @param to Target status
     * @throws IllegalStateException if transition is not allowed
     */
    public void validateTransition(InscriptionState from, InscriptionState to) {
        if (!canTransition(from, to)) {
            throw new IllegalStateException(
                String.format("Invalid inscription state transition from %s to %s", 
                    from != null ? from.name() : "null", 
                    to != null ? to.name() : "null")
            );
        }
    }

    /**
     * Gets all valid next states for a given current state
     * 
     * @param current Current status
     * @return Set of valid next states
     */
    public Set<InscriptionState> getValidNextStates(InscriptionState current) {
        return VALID_TRANSITIONS.getOrDefault(current, Set.of());
    }

    /**
     * Checks if a status is a final state (no transitions allowed)
     * 
     * @param status Status to check
     * @return true if it's a final state, false otherwise
     */
    public boolean isFinalState(InscriptionState status) {
        return VALID_TRANSITIONS.getOrDefault(status, Set.of()).isEmpty();
    }

    /**
     * Checks if a status allows document uploads
     * 
     * @param status Status to check
     * @return true if document uploads are allowed, false otherwise
     */
    public boolean allowsDocumentUpload(InscriptionState status) {
        return Set.of(
            InscriptionState.ACTIVE, 
            InscriptionState.COMPLETED_PENDING_DOCS
        ).contains(status);
    }

    /**
     * Checks if an inscription can be resumed by the user
     * 
     * @param status Current status
     * @return true if user can resume/modify the inscription
     */
    public boolean isResumable(InscriptionState status) {
        return Set.of(
            InscriptionState.ACTIVE, 
            InscriptionState.COMPLETED_PENDING_DOCS
        ).contains(status);
    }

    /**
     * Checks if a status allows admin review
     * 
     * @param status Status to check
     * @return true if admin review is possible, false otherwise
     */
    public boolean allowsAdminReview(InscriptionState status) {
        return status == InscriptionState.PENDING;
    }

    /**
     * Checks if a status requires admin action
     * 
     * @param status Current status
     * @return true if admin action is required
     */
    public boolean requiresAdminAction(InscriptionState status) {
        return status == InscriptionState.PENDING;
    }

    /**
     * Checks if an inscription is ready for admin validation
     * 
     * @param status Current status
     * @return true if ready for validation, false otherwise
     */
    public boolean isReadyForValidation(InscriptionState status) {
        return status == InscriptionState.COMPLETED_WITH_DOCS;
    }

    /**
     * Checks if an inscription has pending documentation
     * 
     * @param status Current status
     * @return true if documentation is pending, false otherwise
     */
    public boolean hasPendingDocumentation(InscriptionState status) {
        return status == InscriptionState.COMPLETED_PENDING_DOCS;
    }

    /**
     * Gets business rules description for a status
     * 
     * @param status Status to describe
     * @return Human-readable description of the status rules
     */
    public String getStatusDescription(InscriptionState status) {
        return switch (status) {
            case ACTIVE -> "Inscripción en proceso. El usuario puede cargar documentos y completar la inscripción.";
            case COMPLETED_WITH_DOCS -> "Inscripción completada con toda la documentación. Lista para revisión administrativa.";
            case COMPLETED_PENDING_DOCS -> "Inscripción completada pero con documentos pendientes. El usuario tiene 3 días hábiles después del cierre para completar.";
            case PENDING -> "Inscripción enviada, pendiente de revisión administrativa.";
            case FROZEN -> "Inscripción congelada por vencimiento del plazo de documentación. Será rechazada automáticamente.";
            case APPROVED -> "Inscripción aprobada. Estado final.";
            case REJECTED -> "Inscripción rechazada. Estado final.";
            case CANCELLED -> "Inscripción cancelada por el usuario. Estado final.";
            // REFACTORING: Estados legacy eliminados completamente
        };
    }

    /**
     * Gets all possible inscription statuses
     * 
     * @return Set of all inscription statuses
     */
    public Set<InscriptionState> getAllStatuses() {
        return VALID_TRANSITIONS.keySet();
    }

    /**
     * Gets all non-final statuses (statuses that allow transitions)
     * 
     * @return Set of non-final statuses
     */
    public Set<InscriptionState> getNonFinalStatuses() {
        return VALID_TRANSITIONS.entrySet().stream()
            .filter(entry -> !entry.getValue().isEmpty())
            .map(Map.Entry::getKey)
            .collect(java.util.stream.Collectors.toSet());
    }

    /**
     * Determines the next automatic state based on business rules
     * 
     * @param currentState Current state
     * @param hasAllDocuments Whether all required documents are uploaded
     * @return Next automatic state, or null if no automatic transition
     */
    public InscriptionState getNextAutomaticState(InscriptionState currentState, boolean hasAllDocuments) {
        return switch (currentState) {
            case ACTIVE -> hasAllDocuments ? InscriptionState.COMPLETED_WITH_DOCS : InscriptionState.COMPLETED_PENDING_DOCS;
            case COMPLETED_WITH_DOCS -> InscriptionState.PENDING; // Auto-transition to pending for admin review
            case COMPLETED_PENDING_DOCS -> hasAllDocuments ? InscriptionState.COMPLETED_WITH_DOCS : null;
            case FROZEN -> InscriptionState.REJECTED; // Auto-rejection after deadline
            default -> null; // No automatic transitions for other states
        };
    }

    /**
     * Checks if a state transition should happen automatically
     * 
     * @param currentState Current state
     * @param hasAllDocuments Whether all required documents are uploaded
     * @return true if automatic transition should occur
     */
    public boolean shouldAutoTransition(InscriptionState currentState, boolean hasAllDocuments) {
        return getNextAutomaticState(currentState, hasAllDocuments) != null;
    }
}
