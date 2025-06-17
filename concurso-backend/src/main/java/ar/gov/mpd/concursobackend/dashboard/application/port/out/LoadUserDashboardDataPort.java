package ar.gov.mpd.concursobackend.dashboard.application.port.out;

import ar.gov.mpd.concursobackend.dashboard.domain.UserDeadline;
import ar.gov.mpd.concursobackend.dashboard.domain.UserDashboardStats;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Puerto de salida para cargar datos del dashboard del usuario
 */
public interface LoadUserDashboardDataPort {
    
    /**
     * Carga los vencimientos del usuario
     * 
     * @param userId ID del usuario
     * @param fromDate Fecha desde la cual buscar vencimientos
     * @param toDate Fecha hasta la cual buscar vencimientos
     * @return Lista de vencimientos
     */
    List<UserDeadline> loadUserDeadlines(Long userId, LocalDateTime fromDate, LocalDateTime toDate);
    
    /**
     * Carga las estadísticas del dashboard del usuario
     * 
     * @param userId ID del usuario
     * @return Estadísticas del usuario
     */
    UserDashboardStats loadUserStats(Long userId);
    
    /**
     * Carga los vencimientos de inscripciones del usuario
     * 
     * @param userId ID del usuario
     * @param fromDate Fecha desde
     * @param toDate Fecha hasta
     * @return Lista de vencimientos de inscripciones
     */
    List<UserDeadline> loadInscriptionDeadlines(Long userId, LocalDateTime fromDate, LocalDateTime toDate);
    
    /**
     * Carga los vencimientos de documentos del usuario
     * 
     * @param userId ID del usuario
     * @param fromDate Fecha desde
     * @param toDate Fecha hasta
     * @return Lista de vencimientos de documentos
     */
    List<UserDeadline> loadDocumentDeadlines(Long userId, LocalDateTime fromDate, LocalDateTime toDate);
    
    /**
     * Carga los vencimientos de exámenes del usuario
     * 
     * @param userId ID del usuario
     * @param fromDate Fecha desde
     * @param toDate Fecha hasta
     * @return Lista de vencimientos de exámenes
     */
    List<UserDeadline> loadExamDeadlines(Long userId, LocalDateTime fromDate, LocalDateTime toDate);
}
