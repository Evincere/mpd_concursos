package ar.gov.mpd.concursobackend.inscription.application.service;

import ar.gov.mpd.concursobackend.document.domain.model.Document;
import ar.gov.mpd.concursobackend.document.domain.model.DocumentType;
import ar.gov.mpd.concursobackend.document.domain.port.IDocumentRepository;
import ar.gov.mpd.concursobackend.document.domain.port.IDocumentTypeRepository;
import ar.gov.mpd.concursobackend.inscription.application.dto.UpdateInscriptionStepRequest;
import ar.gov.mpd.concursobackend.inscription.application.port.in.UpdateInscriptionStepUseCase;
import ar.gov.mpd.concursobackend.inscription.domain.model.Inscription;
import ar.gov.mpd.concursobackend.inscription.domain.model.InscriptionPreferences;
import ar.gov.mpd.concursobackend.inscription.domain.model.enums.InscriptionStep;
import ar.gov.mpd.concursobackend.inscription.domain.port.InscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class UpdateInscriptionStepService implements UpdateInscriptionStepUseCase {

    private final InscriptionRepository inscriptionRepository;
    private final IDocumentTypeRepository documentTypeRepository;
    private final IDocumentRepository documentRepository;

    @Override
    public Inscription updateStep(UUID inscriptionId, UpdateInscriptionStepRequest request) {
        System.out.println("🚀 [UpdateInscriptionStepService] MÉTODO EJECUTADO - ID: " + inscriptionId + " - Step: " + request.getStep());
        log.info("🚀 [UpdateInscriptionStepService] MÉTODO EJECUTADO - ID: {} - Step: {}", inscriptionId, request.getStep());

        var inscription = inscriptionRepository.findById(inscriptionId)
                .orElseThrow(() -> new IllegalArgumentException("Inscripción no encontrada"));

        System.out.println("📋 [UpdateInscriptionStepService] Inscripción encontrada - Estado actual: " + inscription.getState());
        System.out.println("📁 [UpdateInscriptionStepService] Documentos asociados a la inscripción: " +
                          (inscription.getDocuments() != null ? inscription.getDocuments().size() : "NULL"));

        if (inscription.getDocuments() != null && !inscription.getDocuments().isEmpty()) {
            System.out.println("📋 [UpdateInscriptionStepService] Lista de documentos:");
            for (var doc : inscription.getDocuments()) {
                System.out.println("  - " + doc.getDocumentType().getCode() + " (ID: " + doc.getId() + ")");
            }
        } else {
            System.out.println("❌ [UpdateInscriptionStepService] NO HAY DOCUMENTOS ASOCIADOS A LA INSCRIPCIÓN");
            System.out.println("🔧 [UpdateInscriptionStepService] Cargando documentos del usuario desde la base de datos...");

            // CRITICAL FIX: Cargar documentos del usuario desde la base de datos
            List<Document> userDocuments = documentRepository.findByUserId(inscription.getUserId().getValue());
            System.out.println("📁 [UpdateInscriptionStepService] Documentos encontrados en BD: " + userDocuments.size());

            if (!userDocuments.isEmpty()) {
                inscription.setDocuments(userDocuments);
                System.out.println("✅ [UpdateInscriptionStepService] Documentos cargados exitosamente en la inscripción");
                for (var doc : userDocuments) {
                    System.out.println("  - " + doc.getDocumentType().getCode() + " (ID: " + doc.getId() + ")");
                }
            } else {
                System.out.println("❌ [UpdateInscriptionStepService] No se encontraron documentos en la base de datos para el usuario");
            }
        }

        // Actualizar el paso actual
        inscription.updateStep(request.getStep());

        // Si se completa la inscripción, usar la nueva lógica de completado
        if (request.getStep() == InscriptionStep.COMPLETED) {
            log.info("🔄 [UpdateInscriptionStep] Completando inscripción {} - Estado antes: {}",
                    inscription.getId(), inscription.getState());

            // CRITICAL FIX: Obtener tipos de documentos requeridos dinámicamente
            Set<String> requiredDocumentTypes = getRequiredDocumentTypes();
            inscription.completeInscription(requiredDocumentTypes);

            log.info("✅ [UpdateInscriptionStep] Inscripción {} completada - Estado después: {} - Documentos requeridos: {}",
                    inscription.getId(), inscription.getState(), requiredDocumentTypes);
        }

        // Crear y actualizar preferencias si se proporcionaron datos
        if (hasPreferencesData(request)) {
            log.info("🔧 [UpdateInscriptionStep] Actualizando preferencias - Estado antes: {}", inscription.getState());

            var preferences = InscriptionPreferences.builder()
                    .centroDeVida(request.getCentroDeVida())
                    .selectedCircunscripciones(request.getSelectedCircunscripciones())
                    .acceptedTerms(Boolean.TRUE.equals(request.getAcceptedTerms()))
                    .confirmedPersonalData(Boolean.TRUE.equals(request.getConfirmedPersonalData()))
                    .termsAcceptanceDate(request.getAcceptedTerms() ? LocalDateTime.now() : null)
                    .dataConfirmationDate(request.getConfirmedPersonalData() ? LocalDateTime.now() : null)
                    .build();

            inscription.updatePreferences(preferences);

            log.info("🔧 [UpdateInscriptionStep] Preferencias actualizadas - Estado después: {}", inscription.getState());
        }

        log.info("💾 [UpdateInscriptionStep] Guardando inscripción {} - Estado final: {}",
                inscription.getId(), inscription.getState());

        Inscription savedInscription = inscriptionRepository.save(inscription);

        log.info("✅ [UpdateInscriptionStep] Inscripción {} guardada exitosamente - Estado persistido: {}",
                savedInscription.getId(), savedInscription.getState());

        return savedInscription;
    }

    private boolean hasPreferencesData(UpdateInscriptionStepRequest request) {
        return request.getSelectedCircunscripciones() != null ||
               request.getAcceptedTerms() != null ||
               request.getConfirmedPersonalData() != null ||
               request.getCentroDeVida() != null;
    }

    /**
     * CRITICAL FIX: Obtiene dinámicamente los tipos de documentos requeridos desde la base de datos
     * @return Conjunto de códigos de tipos de documentos marcados como requeridos
     */
    private Set<String> getRequiredDocumentTypes() {
        try {
            return documentTypeRepository.findAllActive()
                    .stream()
                    .filter(DocumentType::isRequired)
                    .map(DocumentType::getCode)
                    .collect(Collectors.toSet());
        } catch (Exception e) {
            log.warn("Error al obtener tipos de documentos requeridos, usando fallback: {}", e.getMessage());
            // Fallback a la lista hardcodeada en caso de error
            return Set.of(
                "DNI_FRONTAL",
                "DNI_DORSO",
                "CONSTANCIA_CUIL",
                "ANTECEDENTES_PENALES",
                "CERTIFICADO_PROFESIONAL_ANTIGUEDAD",
                "CERTIFICADO_SIN_SANCIONES"
            );
        }
    }
}