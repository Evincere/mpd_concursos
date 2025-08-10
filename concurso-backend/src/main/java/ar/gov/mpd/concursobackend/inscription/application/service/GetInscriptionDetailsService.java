package ar.gov.mpd.concursobackend.inscription.application.service;

import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionDetailsResponse;
import ar.gov.mpd.concursobackend.inscription.application.port.in.GetInscriptionDetailsUseCase;
import ar.gov.mpd.concursobackend.inscription.application.port.out.LoadInscriptionPort;
import ar.gov.mpd.concursobackend.inscription.domain.model.Inscription;
import ar.gov.mpd.concursobackend.inscription.domain.model.InscriptionPreferences;
import ar.gov.mpd.concursobackend.shared.infrastructure.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/**
 * ✅ SOLUCIÓN: Servicio para obtener detalles específicos de una inscripción
 * Incluye centro de vida y circunscripciones seleccionadas
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class GetInscriptionDetailsService implements GetInscriptionDetailsUseCase {
    
    private final LoadInscriptionPort loadInscriptionPort;
    private final SecurityUtils securityUtils;
    
    @Override
    public InscriptionDetailsResponse getInscriptionDetails(UUID inscriptionId) {
        log.debug("Getting inscription details for ID: {}", inscriptionId);
        
        // Obtener la inscripción
        Inscription inscription = loadInscriptionPort.findById(inscriptionId)
            .orElseThrow(() -> new IllegalArgumentException("Inscription not found with ID: " + inscriptionId));
        
        // Verificar permisos: solo el propietario o un administrador pueden ver los detalles
        String currentUserId = securityUtils.getCurrentUserId();
        if (currentUserId == null) {
            throw new IllegalStateException("No authenticated user found");
        }
        
        boolean isOwner = currentUserId.equals(inscription.getUserId().getValue().toString());
        
        // Verificar si es administrador usando Spring Security
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = authentication != null &&
                          authentication.getAuthorities().stream()
                              .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        
        if (!isOwner && !isAdmin) {
            throw new IllegalArgumentException("Access denied: User can only view their own inscriptions");
        }
        
        // Construir la respuesta con los detalles
        InscriptionDetailsResponse.InscriptionDetailsResponseBuilder builder = InscriptionDetailsResponse.builder()
            .id(inscription.getId().getValue())
            .contestId(inscription.getContestId().getValue())
            .userId(inscription.getUserId().getValue().toString())
            .estado(inscription.getState().toString())
            .fechaPostulacion(inscription.getInscriptionDate())
            .createdAt(inscription.getCreatedAt())
            .lastUpdated(inscription.getLastUpdated());
        
        // ✅ SOLUCIÓN: Agregar datos específicos de preferencias si existen
        InscriptionPreferences preferences = inscription.getPreferences();
        if (preferences != null) {
            builder
                .centroDeVida(preferences.getCentroDeVida())
                .circunscripciones(preferences.getSelectedCircunscripciones())
                .selectedCircunscripciones(preferences.getSelectedCircunscripciones())
                .preferencias(preferences.getSelectedCircunscripciones())
                .acceptedTerms(preferences.isAcceptedTerms())
                .confirmedPersonalData(preferences.isConfirmedPersonalData())
                .termsAcceptanceDate(preferences.getTermsAcceptanceDate())
                .dataConfirmationDate(preferences.getDataConfirmationDate());
        } else {
            // Si no hay preferencias, usar valores por defecto
            builder
                .centroDeVida(null)
                .circunscripciones(new HashSet<>())
                .selectedCircunscripciones(new HashSet<>())
                .preferencias(new HashSet<>())
                .acceptedTerms(false)
                .confirmedPersonalData(false)
                .termsAcceptanceDate(null)
                .dataConfirmationDate(null);
        }
        
        InscriptionDetailsResponse response = builder.build();
        
        log.debug("Inscription details retrieved successfully for ID: {}", inscriptionId);
        log.debug("Details include - Centro de vida: {}, Circunscripciones: {}", 
            response.getCentroDeVida(), response.getCircunscripciones());
        
        return response;
    }
}