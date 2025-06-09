package ar.gov.mpd.concursobackend.inscription.domain.util;

import ar.gov.mpd.concursobackend.inscription.domain.model.InscriptionState;
import ar.gov.mpd.concursobackend.inscription.domain.model.enums.InscriptionStatus;

/**
 * Utilidad para convertir entre InscriptionState e InscriptionStatus
 */
public class InscriptionStateConverter {
    
    /**
     * Convierte de InscriptionState a InscriptionStatus
     * 
     * @param state Estado de inscripción
     * @return Estado de inscripción en formato InscriptionStatus
     */
    public static InscriptionStatus toStatus(InscriptionState state) {
        if (state == null) {
            return InscriptionStatus.ACTIVE;
        }

        // REFACTORING: Solo estados estándar después de eliminar legacy
        switch (state) {
            case ACTIVE:
                return InscriptionStatus.ACTIVE;
            case PENDING:
                return InscriptionStatus.PENDING;
            case COMPLETED_WITH_DOCS:
                return InscriptionStatus.COMPLETED_WITH_DOCS;
            case COMPLETED_PENDING_DOCS:
                return InscriptionStatus.COMPLETED_PENDING_DOCS;
            case FROZEN:
                return InscriptionStatus.FROZEN;
            case APPROVED:
                return InscriptionStatus.APPROVED;
            case REJECTED:
                return InscriptionStatus.REJECTED;
            case CANCELLED:
                return InscriptionStatus.CANCELLED;
            default:
                return InscriptionStatus.ACTIVE;
        }
    }
    
    /**
     * Convierte de InscriptionStatus a InscriptionState
     *
     * @param status Estado de inscripción
     * @return Estado de inscripción en formato InscriptionState
     */
    public static InscriptionState toState(InscriptionStatus status) {
        if (status == null) {
            return InscriptionState.ACTIVE;
        }

        switch (status) {
            case ACTIVE:
                return InscriptionState.ACTIVE;
            case PENDING:
                return InscriptionState.PENDING;
            case COMPLETED_WITH_DOCS:
                return InscriptionState.COMPLETED_WITH_DOCS;
            case COMPLETED_PENDING_DOCS:
                return InscriptionState.COMPLETED_PENDING_DOCS;
            case FROZEN:
                return InscriptionState.FROZEN;
            case APPROVED:
                return InscriptionState.APPROVED;
            case REJECTED:
                return InscriptionState.REJECTED;
            case CANCELLED:
                return InscriptionState.CANCELLED;
            default:
                return InscriptionState.ACTIVE;
        }
    }
    
    /**
     * Compara un InscriptionState con un InscriptionStatus
     * 
     * @param state Estado de inscripción
     * @param status Estado de inscripción a comparar
     * @return true si son equivalentes, false en caso contrario
     */
    public static boolean equals(InscriptionState state, InscriptionStatus status) {
        return toStatus(state) == status;
    }
    
    /**
     * Compara un InscriptionStatus con un InscriptionState
     * 
     * @param status Estado de inscripción
     * @param state Estado de inscripción a comparar
     * @return true si son equivalentes, false en caso contrario
     */
    public static boolean equals(InscriptionStatus status, InscriptionState state) {
        return equals(state, status);
    }
}
