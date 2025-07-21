package ar.gov.mpd.concursobackend.inscription.domain.exception;

import ar.gov.mpd.concursobackend.inscription.domain.model.InscriptionState;

/**
 * Exception thrown when an inscription cannot be cancelled due to business rules
 */
public class InscriptionCannotBeCancelledException extends RuntimeException {
    
    private final InscriptionState currentState;
    
    public InscriptionCannotBeCancelledException(InscriptionState currentState) {
        super(createMessage(currentState));
        this.currentState = currentState;
    }

    private static String createMessage(InscriptionState currentState) {
        if (currentState == InscriptionState.CANCELLED) {
            return "Esta inscripción ya está cancelada. No se puede cancelar nuevamente.";
        }
        return String.format("No se puede cancelar una inscripción en estado %s. " +
                "Solo se pueden cancelar inscripciones en estados: ACTIVE, COMPLETED_WITH_DOCS, " +
                "COMPLETED_PENDING_DOCS o PENDING.", currentState);
    }
    
    public InscriptionCannotBeCancelledException(InscriptionState currentState, String customMessage) {
        super(customMessage);
        this.currentState = currentState;
    }
    
    public InscriptionState getCurrentState() {
        return currentState;
    }
}
