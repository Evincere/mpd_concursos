package ar.gov.mpd.concursobackend.inscription.config;

import ar.gov.mpd.concursobackend.document.domain.port.IDocumentRepository;
import ar.gov.mpd.concursobackend.inscription.application.service.InscriptionCompletenessValidationService;
import ar.gov.mpd.concursobackend.inscription.domain.port.InscriptionRepository;
import ar.gov.mpd.concursobackend.inscription.domain.service.InscriptionValidationRules;
import ar.gov.mpd.concursobackend.shared.infrastructure.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuración de Spring para servicios de validación de inscripciones
 */
@Configuration
@RequiredArgsConstructor
@Slf4j
public class InscriptionValidationConfig {

    private final InscriptionRepository inscriptionRepository;
    private final IDocumentRepository documentRepository;
    private final SecurityUtils securityUtils;

    /**
     * Bean para las reglas centralizadas de validación
     */
    @Bean
    public InscriptionValidationRules inscriptionValidationRules() {
        log.info("🔧 [ValidationConfig] Configurando reglas centralizadas de validación de inscripciones");
        return new InscriptionValidationRules();
    }

    /**
     * Bean para el servicio de validación de completitud
     */
    @Bean
    public InscriptionCompletenessValidationService inscriptionCompletenessValidationService(
            InscriptionValidationRules validationRules) {
        log.info("🔧 [ValidationConfig] Configurando servicio de validación de completitud de inscripciones");
        return new InscriptionCompletenessValidationService(
            inscriptionRepository,
            documentRepository,
            securityUtils,
            validationRules
        );
    }
}
