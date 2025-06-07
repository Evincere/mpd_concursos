package ar.gov.mpd.concursobackend.contest.infrastructure.dto;

import ar.gov.mpd.concursobackend.contest.domain.enums.ContestStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Response DTO for contest dynamic state information
 * REFACTORING: Estado dinámico calculado automáticamente
 */
@Data
@Builder
public class ContestStateResponse {
    
    /**
     * Estado administrativo almacenado en base de datos
     */
    private ContestStatus storedStatus;
    
    /**
     * Estado actual calculado dinámicamente
     */
    private ContestStatus currentStatus;
    
    /**
     * Indica si las inscripciones están abiertas actualmente
     */
    private boolean allowsInscriptions;
    
    /**
     * Fecha de inicio de inscripciones
     */
    private LocalDateTime inscriptionStartDate;
    
    /**
     * Fecha de fin de inscripciones
     */
    private LocalDateTime inscriptionEndDate;
    
    /**
     * Tiempo hasta el próximo cambio de estado (en segundos)
     * null si no hay cambio programado
     */
    private Long timeUntilStateChange;
    
    /**
     * Próximo estado al que cambiará automáticamente
     * null si no hay cambio programado
     */
    private ContestStatus nextStatus;
    
    /**
     * Descripción del estado actual
     */
    private String statusDescription;
    
    /**
     * Mensaje para mostrar al usuario
     */
    private String userMessage;
}
