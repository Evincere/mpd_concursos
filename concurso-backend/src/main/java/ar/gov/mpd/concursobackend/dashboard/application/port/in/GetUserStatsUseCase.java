package ar.gov.mpd.concursobackend.dashboard.application.port.in;

import ar.gov.mpd.concursobackend.dashboard.application.dto.UserStatsResponse;

/**
 * Puerto de entrada para obtener las estadísticas del usuario
 */
public interface GetUserStatsUseCase {
    
    /**
     * Obtiene las estadísticas completas del usuario
     * 
     * @param userId ID del usuario
     * @return Estadísticas del usuario
     */
    UserStatsResponse getUserStats(Long userId);
    
    /**
     * Obtiene solo las estadísticas del perfil del usuario
     * 
     * @param userId ID del usuario
     * @return Estadísticas del perfil
     */
    UserStatsResponse.ProfileStats getProfileStats(Long userId);
    
    /**
     * Obtiene solo las estadísticas de inscripciones del usuario
     * 
     * @param userId ID del usuario
     * @return Estadísticas de inscripciones
     */
    UserStatsResponse.InscriptionStats getInscriptionStats(Long userId);
}
