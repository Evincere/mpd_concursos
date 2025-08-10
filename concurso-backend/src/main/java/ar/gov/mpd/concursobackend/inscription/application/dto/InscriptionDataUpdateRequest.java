package ar.gov.mpd.concursobackend.inscription.application.dto;

import lombok.Builder;
import lombok.Value;

import java.util.Set;

/**
 * ✅ SOLUCIÓN: DTO para actualización de datos específicos de inscripción
 * Permite actualizar centro de vida y circunscripciones seleccionadas
 */
@Value
@Builder
public class InscriptionDataUpdateRequest {
    String centroDeVida;
    Set<String> circunscripciones;
    Set<String> selectedCircunscripciones;
    Set<String> preferencias;
    
    // Campos opcionales para actualización completa de preferencias
    Boolean acceptedTerms;
    Boolean confirmedPersonalData;
}