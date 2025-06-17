package ar.gov.mpd.concursobackend.dashboard.application.port.in;

import ar.gov.mpd.concursobackend.dashboard.application.dto.UserDeadlineResponse;

import java.util.List;

/**
 * Puerto de entrada para obtener los vencimientos del usuario
 */
public interface GetUserDeadlinesUseCase {
    
    /**
     * Obtiene todos los vencimientos próximos del usuario
     * 
     * @param userId ID del usuario
     * @param daysAhead Número de días hacia adelante para buscar vencimientos (por defecto 30)
     * @return Lista de vencimientos ordenados por fecha
     */
    List<UserDeadlineResponse> getUserDeadlines(Long userId, Integer daysAhead);
    
    /**
     * Obtiene solo los vencimientos urgentes del usuario (próximos 7 días)
     * 
     * @param userId ID del usuario
     * @return Lista de vencimientos urgentes
     */
    List<UserDeadlineResponse> getUrgentDeadlines(Long userId);
    
    /**
     * Obtiene vencimientos por tipo específico
     * 
     * @param userId ID del usuario
     * @param type Tipo de vencimiento (INSCRIPTION, DOCUMENTS, EXAM, RESULT)
     * @return Lista de vencimientos del tipo especificado
     */
    List<UserDeadlineResponse> getDeadlinesByType(Long userId, String type);
}
