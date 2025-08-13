package ar.gov.mpd.concursobackend.inscription.application.dto;

import lombok.Builder;
import lombok.Value;

import java.util.List;
import java.util.Set;

/**
 * DTO para el resultado de validación de completitud de inscripción
 * Utilizado por el endpoint /api/inscriptions/validation/{id}/completeness
 */
@Value
@Builder
public class CompletenessValidationResult {
    
    /**
     * Indica si la inscripción está completa y puede ser finalizada
     */
    boolean complete;
    
    /**
     * Centro de vida actual de la inscripción
     */
    String centroDeVida;
    
    /**
     * Circunscripciones seleccionadas por el usuario
     */
    Set<String> selectedCircunscripciones;
    
    /**
     * Indica si los términos fueron aceptados
     */
    boolean acceptedTerms;
    
    /**
     * Indica si los datos personales fueron confirmados
     */
    boolean confirmedPersonalData;
    
    /**
     * Lista de problemas encontrados (si complete = false)
     */
    List<String> issues;
    
    /**
     * Lista de documentos requeridos faltantes
     */
    List<String> missingDocuments;
    
    /**
     * Indica si tiene todos los documentos requeridos
     */
    boolean hasAllRequiredDocuments;
    
    /**
     * Mensaje descriptivo del estado de la validación
     */
    String message;
    
    /**
     * Código de estado para manejo programático
     */
    String statusCode;
}
