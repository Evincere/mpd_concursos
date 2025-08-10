package ar.gov.mpd.concursobackend.inscription.application.service;

import ar.gov.mpd.concursobackend.inscription.application.dto.InscriptionDataUpdateRequest;
import ar.gov.mpd.concursobackend.inscription.application.port.in.UpdateInscriptionDataUseCase;
import ar.gov.mpd.concursobackend.inscription.application.port.out.LoadInscriptionPort;
import ar.gov.mpd.concursobackend.inscription.application.port.out.SaveInscriptionPort;
import ar.gov.mpd.concursobackend.inscription.domain.model.Inscription;
import ar.gov.mpd.concursobackend.inscription.domain.model.InscriptionPreferences;
import ar.gov.mpd.concursobackend.shared.infrastructure.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/**
 * ✅ SOLUCIÓN: Servicio para actualizar datos específicos de una inscripción
 * Permite actualizar centro de vida y circunscripciones seleccionadas
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class UpdateInscriptionDataService implements UpdateInscriptionDataUseCase {
    
    private final LoadInscriptionPort loadInscriptionPort;
    private final SaveInscriptionPort saveInscriptionPort;
    private final SecurityUtils securityUtils;
    
    @Override
    public void updateInscriptionData(UUID inscriptionId, InscriptionDataUpdateRequest request) {
        log.debug("Updating inscription data for ID: {}", inscriptionId);
        log.debug("Update request: centroDeVida={}, circunscripciones={}", 
            request.getCentroDeVida(), request.getCircunscripciones());
        
        // Obtener la inscripción
        Inscription inscription = loadInscriptionPort.findById(inscriptionId)
            .orElseThrow(() -> new IllegalArgumentException("Inscription not found with ID: " + inscriptionId));
        
        // Verificar permisos: solo el propietario puede actualizar sus datos
        String currentUserId = securityUtils.getCurrentUserId();
        if (currentUserId == null) {
            throw new IllegalStateException("No authenticated user found");
        }
        
        boolean isOwner = currentUserId.equals(inscription.getUserId().getValue().toString());
        if (!isOwner) {
            throw new IllegalArgumentException("Access denied: User can only update their own inscriptions");
        }
        
        // Verificar que la inscripción esté en un estado que permita actualizaciones
        if (inscription.getState().toString().equals("CANCELLED") || 
            inscription.getState().toString().equals("FROZEN")) {
            throw new IllegalStateException("Cannot update data for inscription in state: " + inscription.getState());
        }
        
        // ✅ SOLUCIÓN: Actualizar o crear preferencias
        InscriptionPreferences currentPreferences = inscription.getPreferences();
        
        // Determinar qué datos actualizar
        String centroDeVida = request.getCentroDeVida() != null ? 
            request.getCentroDeVida() : 
            (currentPreferences != null ? currentPreferences.getCentroDeVida() : null);
            
        Set<String> circunscripciones = determineCircunscripciones(request, currentPreferences);
        
        Boolean acceptedTerms = request.getAcceptedTerms() != null ? 
            request.getAcceptedTerms() : 
            (currentPreferences != null ? currentPreferences.isAcceptedTerms() : false);
            
        Boolean confirmedPersonalData = request.getConfirmedPersonalData() != null ? 
            request.getConfirmedPersonalData() : 
            (currentPreferences != null ? currentPreferences.isConfirmedPersonalData() : false);
        
        // Crear nuevas preferencias
        InscriptionPreferences updatedPreferences = InscriptionPreferences.builder()
            .centroDeVida(centroDeVida)
            .selectedCircunscripciones(circunscripciones)
            .acceptedTerms(acceptedTerms)
            .confirmedPersonalData(confirmedPersonalData)
            .termsAcceptanceDate(currentPreferences != null ? currentPreferences.getTermsAcceptanceDate() : null)
            .dataConfirmationDate(currentPreferences != null ? currentPreferences.getDataConfirmationDate() : null)
            .build();
        
        // Actualizar las preferencias en la inscripción
        inscription.updatePreferences(updatedPreferences);
        
        // Guardar la inscripción actualizada
        saveInscriptionPort.save(inscription);
        
        log.info("Inscription data updated successfully for ID: {}", inscriptionId);
        log.debug("Updated data: centroDeVida={}, circunscripciones={}", 
            centroDeVida, circunscripciones);
    }
    
    /**
     * Determina las circunscripciones a usar, priorizando los datos de la request
     */
    private Set<String> determineCircunscripciones(InscriptionDataUpdateRequest request, 
                                                  InscriptionPreferences currentPreferences) {
        // Prioridad: circunscripciones > selectedCircunscripciones > preferencias > existentes
        if (request.getCircunscripciones() != null && !request.getCircunscripciones().isEmpty()) {
            return new HashSet<>(request.getCircunscripciones());
        }
        
        if (request.getSelectedCircunscripciones() != null && !request.getSelectedCircunscripciones().isEmpty()) {
            return new HashSet<>(request.getSelectedCircunscripciones());
        }
        
        if (request.getPreferencias() != null && !request.getPreferencias().isEmpty()) {
            return new HashSet<>(request.getPreferencias());
        }
        
        // Usar las existentes si no hay nuevas
        if (currentPreferences != null && currentPreferences.getSelectedCircunscripciones() != null) {
            return new HashSet<>(currentPreferences.getSelectedCircunscripciones());
        }
        
        return new HashSet<>();
    }
}