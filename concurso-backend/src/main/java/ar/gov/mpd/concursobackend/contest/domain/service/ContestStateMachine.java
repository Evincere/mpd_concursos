package ar.gov.mpd.concursobackend.contest.domain.service;

import ar.gov.mpd.concursobackend.contest.domain.enums.ContestStatus;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

/**
 * State machine for contest status transitions
 * Implements business rules for valid state changes
 */
@Component
public class ContestStateMachine {
    
    private static final Map<ContestStatus, Set<ContestStatus>> VALID_TRANSITIONS = createTransitionsMap();

    private static Map<ContestStatus, Set<ContestStatus>> createTransitionsMap() {
        Map<ContestStatus, Set<ContestStatus>> transitions = new HashMap<>();

        // Estados administrativos principales - flujo simplificado
        transitions.put(ContestStatus.DRAFT, Set.of(ContestStatus.SCHEDULED, ContestStatus.CANCELLED));
        transitions.put(ContestStatus.SCHEDULED, Set.of(ContestStatus.ACTIVE, ContestStatus.PAUSED, ContestStatus.CANCELLED));
        transitions.put(ContestStatus.ACTIVE, Set.of(ContestStatus.CLOSED, ContestStatus.PAUSED, ContestStatus.CANCELLED));
        transitions.put(ContestStatus.CLOSED, Set.of(ContestStatus.IN_EVALUATION, ContestStatus.CANCELLED));
        transitions.put(ContestStatus.PAUSED, Set.of(ContestStatus.SCHEDULED, ContestStatus.CANCELLED));

        // Estados de proceso
        transitions.put(ContestStatus.IN_EVALUATION, Set.of(ContestStatus.RESULTS_PUBLISHED, ContestStatus.CANCELLED));
        transitions.put(ContestStatus.RESULTS_PUBLISHED, Set.of(ContestStatus.FINISHED, ContestStatus.CANCELLED));

        // Estados finales
        transitions.put(ContestStatus.FINISHED, Set.of(ContestStatus.ARCHIVED));
        transitions.put(ContestStatus.CANCELLED, Set.of()); // Final state
        transitions.put(ContestStatus.ARCHIVED, Set.of()); // Final state

        return Map.copyOf(transitions);
    }

    /**
     * Checks if a state transition is valid
     * 
     * @param from Current status
     * @param to Target status
     * @return true if transition is allowed, false otherwise
     */
    public boolean canTransition(ContestStatus from, ContestStatus to) {
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
    public void validateTransition(ContestStatus from, ContestStatus to) {
        if (!canTransition(from, to)) {
            throw new IllegalStateException(
                String.format("Invalid contest state transition from %s to %s", 
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
    public Set<ContestStatus> getValidNextStates(ContestStatus current) {
        return VALID_TRANSITIONS.getOrDefault(current, Set.of());
    }

    /**
     * Checks if a status is a final state (no transitions allowed)
     * 
     * @param status Status to check
     * @return true if it's a final state, false otherwise
     */
    public boolean isFinalState(ContestStatus status) {
        return VALID_TRANSITIONS.getOrDefault(status, Set.of()).isEmpty();
    }

    /**
     * Checks if a status allows inscriptions
     * REFACTORING: Estados simplificados y claros
     *
     * @param status Status to check
     * @return true if inscriptions are allowed, false otherwise
     */
    public boolean allowsInscriptions(ContestStatus status) {
        return status == ContestStatus.ACTIVE;
    }

    /**
     * Checks if a status represents an active contest
     * 
     * @param status Status to check
     * @return true if contest is active, false otherwise
     */
    public boolean isActiveStatus(ContestStatus status) {
        return status == ContestStatus.ACTIVE;
    }

    /**
     * Gets business rules description for a status
     * 
     * @param status Status to describe
     * @return Human-readable description of the status rules
     */
    public String getStatusDescription(ContestStatus status) {
        return switch (status) {
            // Estados administrativos
            case DRAFT -> "Concurso en preparación. Puede ser programado o cancelado.";
            case SCHEDULED -> "Concurso programado. Las inscripciones se abren automáticamente según fechas.";
            case ACTIVE -> "Concurso activo. Los usuarios pueden inscribirse.";
            case CLOSED -> "Inscripciones cerradas. En espera de evaluación.";
            case PAUSED -> "Concurso pausado temporalmente. Puede reactivarse o cancelarse.";
            case CANCELLED -> "Concurso cancelado. Estado final.";
            case FINISHED -> "Concurso finalizado. Solo puede archivarse.";
            case ARCHIVED -> "Concurso archivado. Estado final.";

            // Estados de proceso
            case IN_EVALUATION -> "En evaluación. Proceso de selección en curso.";
            case RESULTS_PUBLISHED -> "Resultados publicados. Proceso completado.";

            // Estados legacy (para compatibilidad temporal)
            default -> "Estado desconocido: " + status.getSpanishName() + ".";
        };
    }

    /**
     * Gets all possible contest statuses
     * 
     * @return Set of all contest statuses
     */
    public Set<ContestStatus> getAllStatuses() {
        return VALID_TRANSITIONS.keySet();
    }

    /**
     * Gets all non-final statuses (statuses that allow transitions)
     * 
     * @return Set of non-final statuses
     */
    public Set<ContestStatus> getNonFinalStatuses() {
        return VALID_TRANSITIONS.entrySet().stream()
            .filter(entry -> !entry.getValue().isEmpty())
            .map(Map.Entry::getKey)
            .collect(java.util.stream.Collectors.toSet());
    }
}
