package ar.gov.mpd.concursobackend.inscription.domain.exception;

import ar.gov.mpd.concursobackend.inscription.domain.model.InscriptionState;

/**
 * Exception thrown when an inscription cannot be cancelled due to business rules
 */
public class InscriptionCannotBeCancelledException extends RuntimeException {
    
    private final InscriptionState currentState;
    
    public InscriptionCannotBeCancelledException(InscriptionState currentState) {
        super(String.format("No se puede cancelar una inscripción en estado %s. " +
                "Solo se pueden cancelar inscripciones en estados: ACTIVE, COMPLETED_WITH_DOCS, " +
                "COMPLETED_PENDING_DOCS o PENDING.", currentState));
        this.currentState = currentState;
    }
    
    public InscriptionCannotBeCancelledException(InscriptionState currentState, String customMessage) {
        super(customMessage);
        this.currentState = currentState;
    }
    
    public InscriptionState getCurrentState() {
        return currentState;
    }
}
