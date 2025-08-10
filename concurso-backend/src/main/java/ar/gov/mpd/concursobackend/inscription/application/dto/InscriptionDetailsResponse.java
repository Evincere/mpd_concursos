package ar.gov.mpd.concursobackend.inscription.application.dto;

import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

/**
 * ✅ SOLUCIÓN: DTO para respuesta de detalles específicos de inscripción
 * Incluye centro de vida y circunscripciones seleccionadas
 */
@Value
@Builder
public class InscriptionDetailsResponse {
    UUID id;
    Long contestId;
    String userId;
    String estado;
    LocalDateTime fechaPostulacion;
    
    // ✅ DATOS ESPECÍFICOS PARA REANUDACIÓN
    String centroDeVida;
    Set<String> circunscripciones;
    Set<String> selectedCircunscripciones;
    Set<String> preferencias;
    
    // Datos adicionales de preferencias
    Boolean acceptedTerms;
    Boolean confirmedPersonalData;
    LocalDateTime termsAcceptanceDate;
    LocalDateTime dataConfirmationDate;
    
    // Metadatos
    LocalDateTime createdAt;
    LocalDateTime lastUpdated;
}