package ar.gov.mpd.concursobackend.contest.domain.model;

import ar.gov.mpd.concursobackend.contest.domain.enums.ContestStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Domain model for contests
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Contest {
    private UUID id;
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
    private UUID createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String category;
    private String dependency;
    
    /**
     * Check if inscriptions are currently open for this contest
     * CORRECCIÓN INMEDIATA: Usa lógica temporal hasta refactoring completo
     *
     * @return true if inscriptions are open, false otherwise
     */
    public boolean isInscriptionOpen() {
        // CORRECCIÓN INMEDIATA: Para concursos PUBLISHED, verificar fechas
        if (status == ContestStatus.PUBLISHED) {
            LocalDateTime now = LocalDateTime.now();

            // Si hay fechas específicas de inscripción, usarlas
            if (inscriptionStartDate != null && inscriptionEndDate != null) {
                return now.isAfter(inscriptionStartDate) && now.isBefore(inscriptionEndDate);
            }

            // Fallback: usar fechas generales del concurso (asumiendo que son fechas de inscripción)
            if (startDate != null && endDate != null) {
                return now.isAfter(startDate) && now.isBefore(endDate);
            }
        }

        // Lógica original para ACTIVE
        if (status == ContestStatus.ACTIVE) {
            LocalDateTime now = LocalDateTime.now();
            if (inscriptionStartDate != null && inscriptionEndDate != null) {
                return now.isAfter(inscriptionStartDate) && now.isBefore(inscriptionEndDate);
            }
            // Para ACTIVE sin fechas específicas, asumir que están abiertas
            return true;
        }

        return false;
    }

    /**
     * Calcula el estado actual del concurso basado en fechas
     * REFACTORING: Estado dinámico calculado automáticamente
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

        // Estados dinámicos (solo para PUBLISHED)
        if (status == ContestStatus.PUBLISHED) {
            // Si hay fechas específicas de inscripción, usarlas
            if (inscriptionStartDate != null && inscriptionEndDate != null) {
                if (now.isBefore(inscriptionStartDate)) {
                    return ContestStatus.INSCRIPTION_PENDING;
                }
                if (now.isBefore(inscriptionEndDate)) {
                    return ContestStatus.INSCRIPTION_OPEN;
                }
                // Después de inscripciones, determinar siguiente fase
                return ContestStatus.INSCRIPTION_CLOSED;
            }

            // Fallback: usar fechas generales del concurso
            if (startDate != null && endDate != null) {
                if (now.isBefore(startDate)) {
                    return ContestStatus.INSCRIPTION_PENDING;
                }
                if (now.isBefore(endDate)) {
                    return ContestStatus.INSCRIPTION_OPEN;
                }
                return ContestStatus.INSCRIPTION_CLOSED;
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
        return currentStatus == ContestStatus.INSCRIPTION_OPEN ||
               currentStatus == ContestStatus.PUBLISHED ||  // Fallback
               currentStatus == ContestStatus.ACTIVE;       // Legacy
    }
    
    /**
     * Check if the contest is active
     * 
     * @return true if the contest status is ACTIVE, false otherwise
     */
    public boolean isActive() {
        return status == ContestStatus.ACTIVE;
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
