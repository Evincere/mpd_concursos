package ar.gov.mpd.concursobackend.postulation.domain.service;

import ar.gov.mpd.concursobackend.postulation.domain.enums.PostulationStatus;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Set;

/**
 * State machine for postulation status transitions
 * Implements business rules for valid state changes
 * Updated to include documentation-specific states
 */
@Component
public class PostulationStateMachine {

    private static final Map<PostulationStatus, Set<PostulationStatus>> VALID_TRANSITIONS = Map.of(
        PostulationStatus.ACTIVE, Set.of(
            PostulationStatus.COMPLETED_WITH_DOCS,
            PostulationStatus.COMPLETED_PENDING_DOCS,
            PostulationStatus.CANCELLED
        ),
        PostulationStatus.COMPLETED_WITH_DOCS, Set.of(
            PostulationStatus.PENDING,
            PostulationStatus.CANCELLED
        ),
        PostulationStatus.COMPLETED_PENDING_DOCS, Set.of(
            PostulationStatus.COMPLETED_WITH_DOCS,
            PostulationStatus.FROZEN,
            PostulationStatus.CANCELLED
        ),
        PostulationStatus.PENDING, Set.of(
            PostulationStatus.APPROVED,
            PostulationStatus.REJECTED,
            PostulationStatus.CANCELLED
        ),
        PostulationStatus.FROZEN, Set.of(PostulationStatus.REJECTED),
        PostulationStatus.APPROVED, Set.of(), // Final state
        PostulationStatus.REJECTED, Set.of(), // Final state
        PostulationStatus.CANCELLED, Set.of() // Final state
    );

    /**
     * Checks if a state transition is valid
     * 
     * @param from Current status
     * @param to Target status
     * @return true if transition is allowed, false otherwise
     */
    public boolean canTransition(PostulationStatus from, PostulationStatus to) {
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
    public void validateTransition(PostulationStatus from, PostulationStatus to) {
        if (!canTransition(from, to)) {
            throw new IllegalStateException(
                String.format("Invalid postulation state transition from %s to %s", 
                    from != null ? from.getSpanishName() : "null", 
                    to != null ? to.getSpanishName() : "null")
            );
        }
    }

    /**
     * Gets all valid next states for a given current state
     * 
     * @param current Current status
     * @return Set of valid next states
     */
    public Set<PostulationStatus> getValidNextStates(PostulationStatus current) {
        return VALID_TRANSITIONS.getOrDefault(current, Set.of());
    }

    /**
     * Checks if a status is a final state (no transitions allowed)
     * 
     * @param status Status to check
     * @return true if it's a final state, false otherwise
     */
    public boolean isFinalState(PostulationStatus status) {
        return VALID_TRANSITIONS.getOrDefault(status, Set.of()).isEmpty();
    }

    /**
     * Checks if a status allows document uploads
     *
     * @param status Status to check
     * @return true if document uploads are allowed, false otherwise
     */
    public boolean allowsDocumentUpload(PostulationStatus status) {
        return status == PostulationStatus.ACTIVE ||
               status == PostulationStatus.COMPLETED_PENDING_DOCS;
    }

    /**
     * Checks if a status allows admin review
     *
     * @param status Status to check
     * @return true if admin review is possible, false otherwise
     */
    public boolean allowsAdminReview(PostulationStatus status) {
        return status == PostulationStatus.PENDING ||
               status == PostulationStatus.COMPLETED_WITH_DOCS;
    }

    /**
     * Gets business rules description for a status
     *
     * @param status Status to describe
     * @return Human-readable description of the status rules
     */
    public String getStatusDescription(PostulationStatus status) {
        return switch (status) {
            case ACTIVE -> "Postulación en proceso. El usuario puede completar documentos y enviar.";
            case COMPLETED_WITH_DOCS -> "Postulación completada con toda la documentación. Lista para revisión administrativa.";
            case COMPLETED_PENDING_DOCS -> "Postulación completada pero con documentos pendientes. El usuario tiene 3 días hábiles después del cierre para completar.";
            case PENDING -> "Postulación enviada, pendiente de revisión administrativa.";
            case FROZEN -> "Postulación congelada por vencimiento del plazo de documentación. Será rechazada automáticamente.";
            case APPROVED -> "Postulación aprobada. Estado final.";
            case REJECTED -> "Postulación rechazada. Estado final.";
            case CANCELLED -> "Postulación cancelada por el usuario. Estado final.";
        };
    }

    /**
     * Gets all possible postulation statuses
     * 
     * @return Set of all postulation statuses
     */
    public Set<PostulationStatus> getAllStatuses() {
        return VALID_TRANSITIONS.keySet();
    }

    /**
     * Gets all non-final statuses (statuses that allow transitions)
     * 
     * @return Set of non-final statuses
     */
    public Set<PostulationStatus> getNonFinalStatuses() {
        return VALID_TRANSITIONS.entrySet().stream()
            .filter(entry -> !entry.getValue().isEmpty())
            .map(Map.Entry::getKey)
            .collect(java.util.stream.Collectors.toSet());
    }

    /**
     * Checks if a postulation can be resumed by the user
     *
     * @param status Current status
     * @return true if user can resume/modify the postulation
     */
    public boolean isResumable(PostulationStatus status) {
        return status == PostulationStatus.ACTIVE ||
               status == PostulationStatus.COMPLETED_PENDING_DOCS;
    }

    /**
     * Checks if a postulation requires admin action
     *
     * @param status Current status
     * @return true if admin action is required
     */
    public boolean requiresAdminAction(PostulationStatus status) {
        return status == PostulationStatus.PENDING ||
               status == PostulationStatus.COMPLETED_WITH_DOCS;
    }

    /**
     * Determines the next automatic state based on business rules
     *
     * @param currentStatus Current status
     * @param hasAllDocuments Whether all required documents are uploaded
     * @return Next automatic state, or null if no automatic transition
     */
    public PostulationStatus getNextAutomaticState(PostulationStatus currentStatus, boolean hasAllDocuments) {
        return switch (currentStatus) {
            case ACTIVE -> hasAllDocuments ? PostulationStatus.COMPLETED_WITH_DOCS : PostulationStatus.COMPLETED_PENDING_DOCS;
            case COMPLETED_WITH_DOCS -> PostulationStatus.PENDING; // Auto-transition to pending for admin review
            case COMPLETED_PENDING_DOCS -> hasAllDocuments ? PostulationStatus.COMPLETED_WITH_DOCS : null;
            case FROZEN -> PostulationStatus.REJECTED; // Auto-rejection after deadline
            default -> null; // No automatic transitions for other states
        };
    }
}
