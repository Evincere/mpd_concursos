package ar.gov.mpd.concursobackend.dashboard.infrastructure.config;

import ar.gov.mpd.concursobackend.dashboard.application.port.out.LoadUserDashboardDataPort;
import ar.gov.mpd.concursobackend.dashboard.application.service.UserDashboardService;
import ar.gov.mpd.concursobackend.dashboard.infrastructure.adapter.UserDashboardDataAdapter;
import ar.gov.mpd.concursobackend.dashboard.infrastructure.cache.DashboardCacheService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import jakarta.persistence.EntityManager;

/**
 * Configuración de Spring para el módulo Dashboard
 */
//@Configuration
public class DashboardConfig {
    
    @Bean
    public LoadUserDashboardDataPort loadUserDashboardDataPort(EntityManager entityManager) {
        return new UserDashboardDataAdapter(entityManager);
    }
    
    @Bean
    public UserDashboardService userDashboardService(
            LoadUserDashboardDataPort loadUserDashboardDataPort,
            DashboardCacheService cacheService) {
        return new UserDashboardService(loadUserDashboardDataPort, cacheService);
    }
}
