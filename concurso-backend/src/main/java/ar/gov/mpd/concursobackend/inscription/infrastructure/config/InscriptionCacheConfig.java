package ar.gov.mpd.concursobackend.inscription.infrastructure.config;

import ar.gov.mpd.concursobackend.inscription.application.service.InscriptionCreationCacheService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.ContextClosedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * ✅ SOLUCIÓN PROBLEMA 1: Configuración del cache de inscripciones
 * 
 * Componente que maneja el ciclo de vida del cache de creación de inscripciones.
 * Se encarga de inicializar el cache cuando la aplicación está lista y
 * limpiarlo cuando la aplicación se cierra.
 */
@Component
@RequiredArgsConstructor
public class InscriptionCacheConfig {
    
    private static final Logger log = LoggerFactory.getLogger(InscriptionCacheConfig.class);
    
    private final InscriptionCreationCacheService cacheService;
    
    /**
     * Inicializa el cache cuando la aplicación está lista
     */
    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        log.info("Aplicación lista - Inicializando cache de creación de inscripciones");
        cacheService.init();
        log.info("Cache de creación de inscripciones inicializado exitosamente");
    }
    
    /**
     * Limpia el cache cuando la aplicación se cierra
     */
    @EventListener(ContextClosedEvent.class)
    public void onApplicationShutdown() {
        log.info("Aplicación cerrándose - Limpiando cache de creación de inscripciones");
        cacheService.destroy();
        log.info("Cache de creación de inscripciones limpiado exitosamente");
    }
}
