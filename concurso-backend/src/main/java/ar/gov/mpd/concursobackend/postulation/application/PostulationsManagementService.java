package ar.gov.mpd.concursobackend.postulation.application;

import ar.gov.mpd.concursobackend.document.domain.port.IDocumentRepository;
import ar.gov.mpd.concursobackend.document.domain.model.Document;
import ar.gov.mpd.concursobackend.inscription.application.AdminInscriptionService;
import ar.gov.mpd.concursobackend.inscription.domain.model.Inscription;
import ar.gov.mpd.concursobackend.inscription.domain.model.InscriptionState;
import ar.gov.mpd.concursobackend.postulation.infrastructure.dto.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PostulationsManagementService {

    private final AdminInscriptionService adminInscriptionService;
    private final IDocumentRepository documentRepository;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");

    /**
     * Obtiene todas las postulaciones convertidas del formato de inscripciones
     */
    public PostulationManagementResponseDTO getAllPostulations() {
        try {
            log.debug("Obteniendo todas las postulaciones...");

            // Obtener inscripciones con documentos completos
            Pageable pageable = PageRequest.of(0, 1000); // Obtener un lote grande
            Page<Inscription> inscriptionsPage = adminInscriptionService.getAllInscriptions(
                    null, null, InscriptionState.COMPLETED_WITH_DOCS, null, null, null, pageable
            );

            List<Inscription> inscriptions = inscriptionsPage.getContent();
            
            // Convertir inscripciones a postulaciones
            List<PostulationDTO> postulations = inscriptions.stream()
                    .map(this::convertToPostulation)
                    .collect(Collectors.toList());

            // Generar estadísticas
            PostulationStatsDTO stats = generateStats(inscriptions);

            log.debug("Se encontraron {} postulaciones", postulations.size());

            return new PostulationManagementResponseDTO(
                    true,
                    postulations,
                    stats,
                    "Postulaciones obtenidas exitosamente"
            );

        } catch (Exception e) {
            log.error("Error al obtener postulaciones: {}", e.getMessage(), e);
            return new PostulationManagementResponseDTO(
                    false,
                    new ArrayList<>(),
                    new PostulationStatsDTO(0, 0, 0, 0, 0),
                    "Error al obtener postulaciones: " + e.getMessage()
            );
        }
    }

    /**
     * Convierte una inscripción en una postulación
     */
    private PostulationDTO convertToPostulation(Inscription inscription) {
        // Información del usuario
        PostulationUserDTO user = new PostulationUserDTO(
                inscription.getUser().getDni().value(),
                inscription.getUser().getFirstName() + " " + inscription.getUser().getLastName(),
                inscription.getUser().getEmail().value()
        );

        // Información de la inscripción - CORREGIDO: usar centro de vida real de las preferencias
        String centroDeVida = "";
        if (inscription.getPreferences() != null && inscription.getPreferences().getCentroDeVida() != null) {
            centroDeVida = inscription.getPreferences().getCentroDeVida();
        } else if (inscription.getUser().getLegalAddress() != null) {
            // Fallback a dirección legal si no hay centro de vida en preferencias
            centroDeVida = inscription.getUser().getLegalAddress().getValue();
        }
        
        PostulationInscriptionDTO inscriptionDTO = new PostulationInscriptionDTO(
                inscription.getId().getValue().toString(),
                inscription.getState().name(),
                centroDeVida,
                inscription.getCreatedAt().format(DATE_FORMATTER)
        );

        // Información del concurso
        PostulationContestDTO contest = new PostulationContestDTO(
                inscription.getContest().getTitle(),
                inscription.getContest().getTitle() // Usando title como position por simplicidad
        );

        // Información de documentos
        List<Document> documents = documentRepository.findByUserId(inscription.getUserId().getValue());
        PostulationDocumentsDTO documentsDTO = generateDocumentInfo(documents);

        // Estados de validación y prioridad
        String validationStatus = calculateValidationStatus(documents);
        String priority = calculatePriority(inscription, documents);
        int completionPercentage = calculateCompletionPercentage(documents);

        return new PostulationDTO(
                inscription.getId().getValue().toString(),
                user,
                inscriptionDTO,
                contest,
                documentsDTO,
                validationStatus,
                priority,
                completionPercentage
        );
    }

    /**
     * Genera información de documentos
     */
    private PostulationDocumentsDTO generateDocumentInfo(List<Document> documents) {
        int total = documents.size();
        int pending = (int) documents.stream().filter(d -> "PENDING".equals(d.getStatus().name())).count();
        int approved = (int) documents.stream().filter(d -> "APPROVED".equals(d.getStatus().name())).count();
        int rejected = (int) documents.stream().filter(d -> "REJECTED".equals(d.getStatus().name())).count();
        int required = total; // Asumimos que todos son requeridos

        List<String> types = documents.stream()
                .map(d -> d.getDocumentType().getName())
                .distinct()
                .collect(Collectors.toList());

        return new PostulationDocumentsDTO(total, pending, approved, rejected, required, types);
    }

    /**
     * Calcula el estado de validación basado en los documentos
     */
    private String calculateValidationStatus(List<Document> documents) {
        if (documents.isEmpty()) {
            return "PENDING";
        }

        long approved = documents.stream().filter(d -> "APPROVED".equals(d.getStatus().name())).count();
        long rejected = documents.stream().filter(d -> "REJECTED".equals(d.getStatus().name())).count();
        long pending = documents.stream().filter(d -> "PENDING".equals(d.getStatus().name())).count();

        if (rejected > 0) {
            return "REJECTED";
        } else if (approved == documents.size()) {
            return "COMPLETED";
        } else if (approved > 0) {
            return "PARTIAL";
        } else {
            return "PENDING";
        }
    }

    /**
     * Calcula la prioridad basada en la inscripción y documentos
     */
    private String calculatePriority(Inscription inscription, List<Document> documents) {
        // Lógica simple de prioridad basada en documentos pendientes
        long pending = documents.stream().filter(d -> "PENDING".equals(d.getStatus().name())).count();
        
        if (pending > 5) {
            return "HIGH";
        } else if (pending > 2) {
            return "MEDIUM";
        } else {
            return "LOW";
        }
    }

    /**
     * Calcula el porcentaje de completitud
     */
    private int calculateCompletionPercentage(List<Document> documents) {
        if (documents.isEmpty()) {
            return 0;
        }

        long approved = documents.stream().filter(d -> "APPROVED".equals(d.getStatus().name())).count();
        return (int) ((approved * 100) / documents.size());
    }

    /**
     * Genera estadísticas de todas las postulaciones
     */
    private PostulationStatsDTO generateStats(List<Inscription> inscriptions) {
        long total = inscriptions.size();
        
        // Contar inscripciones por estado
        long completedWithDocs = inscriptions.stream()
                .filter(i -> i.getState() == InscriptionState.COMPLETED_WITH_DOCS)
                .count();

        // Obtener estadísticas de validación basadas en documentos
        long validationPending = 0;
        long validationCompleted = 0;
        long validationRejected = 0;

        for (Inscription inscription : inscriptions) {
            List<Document> documents = documentRepository.findByUserId(inscription.getUserId().getValue());
            String validationStatus = calculateValidationStatus(documents);
            
            switch (validationStatus) {
                case "PENDING" -> validationPending++;
                case "COMPLETED" -> validationCompleted++;
                case "REJECTED" -> validationRejected++;
            }
        }

        return new PostulationStatsDTO(
                total,
                completedWithDocs,
                validationPending,
                validationCompleted,
                validationRejected
        );
    }
}
