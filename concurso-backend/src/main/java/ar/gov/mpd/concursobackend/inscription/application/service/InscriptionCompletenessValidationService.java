package ar.gov.mpd.concursobackend.inscription.application.service;

import ar.gov.mpd.concursobackend.document.domain.model.Document;
import ar.gov.mpd.concursobackend.document.domain.port.IDocumentRepository;
import ar.gov.mpd.concursobackend.inscription.application.dto.CompletenessValidationResult;
import ar.gov.mpd.concursobackend.inscription.domain.model.Inscription;
import ar.gov.mpd.concursobackend.inscription.domain.model.InscriptionPreferences;
import ar.gov.mpd.concursobackend.inscription.domain.port.InscriptionRepository;
import ar.gov.mpd.concursobackend.inscription.domain.service.InscriptionValidationRules;
import ar.gov.mpd.concursobackend.shared.infrastructure.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Servicio para validar la completitud de una inscripción
 * Implementa la lógica de validación requerida por el frontend
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class InscriptionCompletenessValidationService {

    private final InscriptionRepository inscriptionRepository;
    private final IDocumentRepository documentRepository;
    private final SecurityUtils securityUtils;
    private final InscriptionValidationRules validationRules;
    
    /**
     * Valida la completitud de una inscripción
     * 
     * @param inscriptionId ID de la inscripción a validar
     * @return Resultado de validación con detalles
     */
    public CompletenessValidationResult validateCompleteness(UUID inscriptionId) {
        log.debug("🔍 [CompletenessValidation] Iniciando validación de completitud para inscripción: {}", inscriptionId);
        
        try {
            // Verificar que la inscripción existe
            Optional<Inscription> inscriptionOpt = inscriptionRepository.findById(inscriptionId);
            if (inscriptionOpt.isEmpty()) {
                log.warn("❌ [CompletenessValidation] Inscripción no encontrada: {}", inscriptionId);
                return CompletenessValidationResult.builder()
                    .complete(false)
                    .message("Inscripción no encontrada")
                    .statusCode("NOT_FOUND")
                    .issues(List.of("La inscripción especificada no existe"))
                    .build();
            }
            
            Inscription inscription = inscriptionOpt.get();
            
            // Verificar permisos - solo el propietario puede validar su inscripción
            String currentUserId = securityUtils.getCurrentUserId();
            if (!inscription.getUserId().getValue().toString().equals(currentUserId)) {
                log.warn("🚫 [CompletenessValidation] Usuario {} intentó validar inscripción {} que no le pertenece", 
                    currentUserId, inscriptionId);
                return CompletenessValidationResult.builder()
                    .complete(false)
                    .message("No tiene permisos para validar esta inscripción")
                    .statusCode("FORBIDDEN")
                    .issues(List.of("No tiene permisos para acceder a esta inscripción"))
                    .build();
            }
            
            // Realizar validación completa
            return performCompletenessValidation(inscription);
            
        } catch (Exception e) {
            log.error("💥 [CompletenessValidation] Error inesperado validando inscripción {}: {}", 
                inscriptionId, e.getMessage(), e);
            return CompletenessValidationResult.builder()
                .complete(false)
                .message("Error interno del sistema")
                .statusCode("INTERNAL_ERROR")
                .issues(List.of("Ocurrió un error interno. Intente nuevamente."))
                .build();
        }
    }
    
    /**
     * Realiza la validación completa de la inscripción
     */
    private CompletenessValidationResult performCompletenessValidation(Inscription inscription) {
        log.debug("🔍 [CompletenessValidation] Validando inscripción: {}", inscription.getId());
        
        List<String> issues = new ArrayList<>();
        List<String> missingDocuments = new ArrayList<>();
        
        // Obtener preferencias de la inscripción
        InscriptionPreferences preferences = inscription.getPreferences();
        
        // Validar preferencias básicas
        boolean preferencesComplete = validatePreferences(preferences, issues);
        
        // Validar documentación
        boolean documentsComplete = validateDocuments(inscription, missingDocuments);
        
        // Determinar si está completa
        boolean isComplete = preferencesComplete && documentsComplete;
        
        // Construir mensaje descriptivo
        String message = buildValidationMessage(isComplete, issues, missingDocuments);
        String statusCode = isComplete ? "COMPLETE" : "INCOMPLETE";
        
        CompletenessValidationResult result = CompletenessValidationResult.builder()
            .complete(isComplete)
            .centroDeVida(preferences != null ? preferences.getCentroDeVida() : null)
            .selectedCircunscripciones(preferences != null ? preferences.getSelectedCircunscripciones() : Set.of())
            .acceptedTerms(preferences != null && preferences.isAcceptedTerms())
            .confirmedPersonalData(preferences != null && preferences.isConfirmedPersonalData())
            .issues(issues)
            .missingDocuments(missingDocuments)
            .hasAllRequiredDocuments(documentsComplete)
            .message(message)
            .statusCode(statusCode)
            .build();
        
        log.info("✅ [CompletenessValidation] Validación completada para inscripción {}: complete={}, issues={}, missingDocs={}", 
            inscription.getId(), isComplete, issues.size(), missingDocuments.size());
        
        return result;
    }
    
    /**
     * Valida las preferencias de la inscripción usando reglas centralizadas
     */
    private boolean validatePreferences(InscriptionPreferences preferences, List<String> issues) {
        // ✅ ESTANDARIZACIÓN: Usar reglas centralizadas de validación
        List<String> validationErrors = validationRules.validatePreferences(preferences);
        issues.addAll(validationErrors);

        return validationErrors.isEmpty();
    }
    
    /**
     * Valida la documentación requerida
     */
    private boolean validateDocuments(Inscription inscription, List<String> missingDocuments) {
        // Obtener documentos del usuario
        List<Document> userDocuments = documentRepository.findByUserId(inscription.getUserId().getValue());
        
        // Filtrar solo documentos activos y obtener códigos de tipos de documento
        Set<String> availableDocumentTypes = userDocuments.stream()
            .filter(Document::isActive)
            .map(document -> document.getDocumentType().getCode())
            .collect(Collectors.toSet());
        
        // ✅ ESTANDARIZACIÓN: Usar tipos de documentos de reglas centralizadas
        Set<String> requiredTypes = validationRules.getRequiredDocumentTypes();
        for (String requiredType : requiredTypes) {
            if (!availableDocumentTypes.contains(requiredType)) {
                missingDocuments.add(validationRules.getDocumentTypeDisplayName(requiredType));
            }
        }
        
        return missingDocuments.isEmpty();
    }
    
    /**
     * Construye el mensaje descriptivo de validación
     */
    private String buildValidationMessage(boolean isComplete, List<String> issues, List<String> missingDocuments) {
        if (isComplete) {
            return "Su inscripción está completa y puede ser finalizada";
        }
        
        StringBuilder message = new StringBuilder("Su inscripción requiere completar los siguientes elementos:");
        
        if (!issues.isEmpty()) {
            message.append("\n\nDatos de inscripción:");
            for (String issue : issues) {
                message.append("\n• ").append(issue);
            }
        }
        
        if (!missingDocuments.isEmpty()) {
            message.append("\n\nDocumentación faltante:");
            for (String doc : missingDocuments) {
                message.append("\n• ").append(doc);
            }
        }
        
        return message.toString();
    }
}
