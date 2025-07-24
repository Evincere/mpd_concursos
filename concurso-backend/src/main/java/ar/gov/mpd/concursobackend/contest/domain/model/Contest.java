package ar.gov.mpd.concursobackend.contest.domain.model;

import ar.gov.mpd.concursobackend.contest.domain.enums.ContestStatus;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Domain model for contests - MODELO PRINCIPAL
 * FASE 4: Modelo principal unificado con Long ID para compatibilidad total
 * Este es ahora el único modelo de Contest en el sistema
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Contest {
    private Long id;
    private String title;
    private String description;
    private String requirements;
    private String location;
    private String district;
    private ContestType type;
    private ContestStatus status;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private LocalDateTime inscriptionStartDate;
    private LocalDateTime inscriptionEndDate;
    private LocalDateTime examDate;
    private LocalDateTime resultsDate;
    private List<ContestDocument> documents;
    private List<ContestPosition> positions;
    private Long createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String category;
    private String dependency;
    private String contestClass; // Clase del concurso (ej: "03")
    
    /**
     * Check if inscriptions are currently open for this contest
     * CORRECCIÓN INMEDIATA: Usa lógica temporal hasta refactoring completo
     *
     * @return true if inscriptions are open, false otherwise
     */
    public boolean isInscriptionOpen() {
        // Usar estado dinámico calculado
        return getCurrentStatus() == ContestStatus.ACTIVE;
    }

    /**
     * Calcula el estado actual del concurso basado en fechas
     * REFACTORING: Estados claros sin ambigüedad
     *
     * @return Estado actual del concurso
     */
    public ContestStatus getCurrentStatus() {
        LocalDateTime now = LocalDateTime.now();

        // Estados administrativos fijos (no cambian automáticamente)
        if (status == ContestStatus.DRAFT) return ContestStatus.DRAFT;
        if (status == ContestStatus.CANCELLED) return ContestStatus.CANCELLED;
        if (status == ContestStatus.PAUSED) return ContestStatus.PAUSED;
        if (status == ContestStatus.FINISHED) return ContestStatus.FINISHED;
        if (status == ContestStatus.ARCHIVED) return ContestStatus.ARCHIVED;
        if (status == ContestStatus.IN_EVALUATION) return ContestStatus.IN_EVALUATION;
        if (status == ContestStatus.RESULTS_PUBLISHED) return ContestStatus.RESULTS_PUBLISHED;

        // Estados dinámicos (solo para SCHEDULED)
        if (status == ContestStatus.SCHEDULED) {
            // Si hay fechas específicas de inscripción, usarlas
            if (inscriptionStartDate != null && inscriptionEndDate != null) {
                if (now.isBefore(inscriptionStartDate)) {
                    return ContestStatus.SCHEDULED;  // Aún programado
                }
                if (now.isBefore(inscriptionEndDate)) {
                    return ContestStatus.ACTIVE;     // Activo para inscripciones
                }
                // Después de inscripciones, cerrado automáticamente
                return ContestStatus.CLOSED;
            }

            // Fallback: usar fechas generales del concurso
            if (startDate != null && endDate != null) {
                if (now.isBefore(startDate)) {
                    return ContestStatus.SCHEDULED;
                }
                if (now.isBefore(endDate)) {
                    return ContestStatus.ACTIVE;
                }
                return ContestStatus.CLOSED;
            }
        }

        // Estados legacy - devolver tal como están
        return status;
    }

    /**
     * Verifica si las inscripciones están abiertas basado en estado dinámico
     *
     * @return true si las inscripciones están abiertas
     */
    public boolean allowsInscriptionsNow() {
        ContestStatus currentStatus = getCurrentStatus();
        return currentStatus == ContestStatus.ACTIVE;
    }
    
    /**
     * Check if the contest is active
     * REFACTORING: Estados simplificados y claros
     *
     * @return true if the contest allows inscriptions, false otherwise
     */
    public boolean isActive() {
        return getCurrentStatus() == ContestStatus.ACTIVE;
    }
    
    /**
     * Check if the contest is finished
     * 
     * @return true if the contest status is FINISHED, false otherwise
     */
    public boolean isFinished() {
        return status == ContestStatus.FINISHED;
    }
    
    /**
     * Check if the contest is cancelled
     * 
     * @return true if the contest status is CANCELLED, false otherwise
     */
    public boolean isCancelled() {
        return status == ContestStatus.CANCELLED;
    }
    
    public String getCategory() {
        return this.category;
    }

    public String getDepartment() {
        return this.dependency;
    }
}
