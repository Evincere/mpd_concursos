package ar.gov.mpd.concursobackend.inscription.infrastructure.config;

import ar.gov.mpd.concursobackend.inscription.application.port.in.GetInscriptionDetailsUseCase;
import ar.gov.mpd.concursobackend.inscription.application.port.in.UpdateInscriptionDataUseCase;
import ar.gov.mpd.concursobackend.inscription.application.service.GetInscriptionDetailsService;
import ar.gov.mpd.concursobackend.inscription.application.service.UpdateInscriptionDataService;
import ar.gov.mpd.concursobackend.inscription.application.port.out.LoadInscriptionPort;
import ar.gov.mpd.concursobackend.inscription.application.port.out.SaveInscriptionPort;
import ar.gov.mpd.concursobackend.shared.infrastructure.security.SecurityUtils;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * ✅ SOLUCIÓN: Configuración para los nuevos servicios de detalles de inscripción
 */
@Configuration
public class InscriptionDetailsConfig {

    @Bean
    public GetInscriptionDetailsUseCase getInscriptionDetailsUseCase(
            LoadInscriptionPort loadInscriptionPort,
            SecurityUtils securityUtils) {
        return new GetInscriptionDetailsService(loadInscriptionPort, securityUtils);
    }

    @Bean
    public UpdateInscriptionDataUseCase updateInscriptionDataUseCase(
            LoadInscriptionPort loadInscriptionPort,
            SaveInscriptionPort saveInscriptionPort,
            SecurityUtils securityUtils) {
        return new UpdateInscriptionDataService(loadInscriptionPort, saveInscriptionPort, securityUtils);
    }
}