package ar.gov.mpd.concursobackend.inscription.application;

import ar.gov.mpd.concursobackend.auth.domain.model.User;
import ar.gov.mpd.concursobackend.auth.domain.port.IUserRepository;
import ar.gov.mpd.concursobackend.contest.domain.port.ContestRepository;
import ar.gov.mpd.concursobackend.document.domain.model.Document;
import ar.gov.mpd.concursobackend.document.domain.valueObject.DocumentId;
import ar.gov.mpd.concursobackend.document.domain.valueObject.DocumentStatus;
import ar.gov.mpd.concursobackend.document.domain.port.IDocumentRepository;
import ar.gov.mpd.concursobackend.inscription.domain.model.Inscription;
import ar.gov.mpd.concursobackend.inscription.domain.model.InscriptionNote;
import ar.gov.mpd.concursobackend.inscription.domain.model.InscriptionState;
import ar.gov.mpd.concursobackend.inscription.domain.port.InscriptionNoteRepository;
import ar.gov.mpd.concursobackend.inscription.domain.port.InscriptionRepository;
import ar.gov.mpd.concursobackend.inscription.domain.service.InscriptionStateMachine;
import ar.gov.mpd.concursobackend.inscription.infrastructure.controller.dto.InscriptionReportRequestDTO;
import ar.gov.mpd.concursobackend.notification.application.NotificationService;
import ar.gov.mpd.concursobackend.notification.domain.enums.NotificationType;
import ar.gov.mpd.concursobackend.shared.domain.exception.ResourceNotFoundException;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.beanutils.PropertyUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminInscriptionService {

    private final InscriptionRepository inscriptionRepository;
    private final InscriptionNoteRepository noteRepository;
    private final IUserRepository userRepository;
    private final ContestRepository contestRepository;
    private final IDocumentRepository documentRepository;
    private final NotificationService notificationService;
    private final InscriptionStateMachine stateMachine;

    // Configuración de notificaciones
    @Value("${app.notifications.enabled:true}")
    private boolean notificationsEnabled;
    
    @Value("${app.notifications.state-change.enabled:true}")
    private boolean stateChangeNotificationsEnabled;

    /**
     * Obtiene todas las inscripciones con filtros y paginación
     * INCLUYE CARGA DE ENTIDADES RELACIONADAS (User y Contest)
     */
    public Page<Inscription> getAllInscriptions(
            Long contestId,
            String userId,
            InscriptionState state,
            LocalDate startDate,
            LocalDate endDate,
            String search,
            Pageable pageable
    ) {
        log.debug("🔍 [AdminInscriptionService] Obteniendo inscripciones con filtros - contestId: {}, userId: {}, state: {}",
                  contestId, userId, state);

        var specification = createSpecification(contestId, userId, state, startDate, endDate, search);
        Page<Inscription> inscriptionsPage = inscriptionRepository.findAll(specification, (PageRequest) pageable);

        log.debug("🔍 [AdminInscriptionService] Se encontraron {} inscripciones", inscriptionsPage.getTotalElements());

        // Cargar entidades relacionadas para cada inscripción
        inscriptionsPage.getContent().forEach(inscription -> {
            log.debug("🔄 [AdminInscriptionService] Cargando entidades relacionadas para inscripción: {}", inscription.getId());
            loadRelatedEntities(inscription);
        });

        log.debug("✅ [AdminInscriptionService] Entidades relacionadas cargadas para todas las inscripciones");

        return inscriptionsPage;
    }

    private Specification<Inscription> createSpecification(
            Long contestId,
            String userId,
            InscriptionState state,
            LocalDate startDate,
            LocalDate endDate,
            String search) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (contestId != null) {
                predicates.add(cb.equal(root.get("contestId"), contestId));
            }

            if (userId != null) {
                predicates.add(cb.equal(root.get("userId"), UUID.fromString(userId)));
            }

            if (state != null) {
                predicates.add(cb.equal(root.get("status"), state));
            }

            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), startDate.atStartOfDay()));
            }

            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), endDate.atTime(23, 59, 59)));
            }

            if (search != null && !search.trim().isEmpty()) {
                String pattern = "%" + search.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("fullName")), pattern),
                        cb.like(cb.lower(root.get("documentNumber")), pattern)
                ));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    /**
     * Obtiene una inscripción por su ID
     */
    public Inscription getInscriptionById(String id) {
        Inscription inscription = inscriptionRepository.findById(UUID.fromString(id))
                .orElseThrow(() -> new ResourceNotFoundException("Inscription", "id", id));

        loadRelatedEntities(inscription);

        return inscription;
    }

    /**
     * Cambia el estado de una inscripción
     */
    @Transactional
    public Inscription changeInscriptionState(String id, InscriptionState newState, String noteText) {
        Inscription inscription = getInscriptionById(id);

        // Validar cambio de estado
        validateStateChange(inscription.getState(), newState);

        // Actualizar estado
        inscription.setState(newState);
        inscription.setLastUpdated(LocalDateTime.now());

        // Guardar inscripción
        Inscription updatedInscription = inscriptionRepository.save(inscription);

        // SOLUCIÓN ALTERNATIVA: En lugar de volver a cargar toda la inscripción,
        // asegurémonos de que las entidades relacionadas estén correctas en la instancia actual
        // El usuario y contest ya deberían estar cargados de la primera llamada a getInscriptionById
        
        // Validar que el usuario esté presente antes de enviar notificación
        if (updatedInscription.getUser() == null) {
            log.warn("🔄 Usuario no presente en inscripción, recargando...");
            loadRelatedEntities(updatedInscription);
        }

        // Agregar nota si se proporcionó
        if (noteText != null && !noteText.trim().isEmpty()) {
            addNote(id, noteText);
        }

        // Enviar notificación al usuario usando la instancia actualizada
        sendStateChangeNotification(updatedInscription);

        return updatedInscription;
    }

    /**
     * Agrega una nota a una inscripción
     */
    @Transactional
    public InscriptionNote addNote(String inscriptionId, String text) {
        // Verificar que la inscripción existe
        if (!inscriptionRepository.existsById(UUID.fromString(inscriptionId))) {
            throw new ResourceNotFoundException("Inscription", "id", inscriptionId);
        }

        // Obtener usuario actual
        String currentUser = getCurrentUsername();

        // Crear y guardar la nota
        InscriptionNote note = InscriptionNote.builder()
                .id(UUID.randomUUID())
                .inscriptionId(UUID.fromString(inscriptionId))
                .text(text)
                .createdBy(UUID.randomUUID())
                .createdByUsername(currentUser)
                .createdAt(LocalDateTime.now())
                .build();

        return noteRepository.save(note);
    }

    /**
     * Elimina una nota de una inscripción
     */
    @Transactional
    public void deleteNote(String inscriptionId, String noteId) {
        // Verificar que la inscripción existe
        if (!inscriptionRepository.existsById(UUID.fromString(inscriptionId))) {
            throw new ResourceNotFoundException("Inscription", "id", inscriptionId);
        }

        // Verificar que la nota existe y pertenece a la inscripción
        InscriptionNote note = noteRepository.findById(UUID.fromString(noteId))
                .orElseThrow(() -> new ResourceNotFoundException("Note", "id", noteId));

        if (!note.getInscriptionId().equals(UUID.fromString(inscriptionId))) {
            throw new IllegalArgumentException("La nota no pertenece a la inscripción especificada");
        }

        // Eliminar la nota
        noteRepository.delete(note);
    }

    /**
     * Obtiene estadísticas generales de todas las inscripciones
     */
    public Map<String, Object> getAllInscriptionStats() {
        Map<String, Object> stats = new HashMap<>();

        // Estadísticas por estado (REFACTORING: Usar solo estados estándar)
        long total = inscriptionRepository.count();
        long pending = inscriptionRepository.countByState(InscriptionState.PENDING);
        long approved = inscriptionRepository.countByState(InscriptionState.APPROVED);
        long rejected = inscriptionRepository.countByState(InscriptionState.REJECTED);
        long cancelled = inscriptionRepository.countByState(InscriptionState.CANCELLED);
        long active = inscriptionRepository.countByState(InscriptionState.ACTIVE);

        stats.put("total", total);
        stats.put("pending", pending);
        stats.put("approved", approved);
        stats.put("rejected", rejected);
        stats.put("cancelled", cancelled);
        stats.put("active", active);  // REFACTORING: Cambiar inProcess por active

        // Estadísticas por concurso
        Map<String, Long> byContest = new HashMap<>();
        List<Object[]> contestStats = inscriptionRepository.countByContest();
        for (Object[] row : contestStats) {
            String contestTitle = (String) row[0];
            Long count = (Long) row[1];
            byContest.put(contestTitle, count);
        }
        stats.put("byContest", byContest);

        // Estadísticas por departamento (basado en la dirección del usuario)
        Map<String, Long> byDepartment = new HashMap<>();
        List<Object[]> departmentStats = inscriptionRepository.countByDepartment();
        for (Object[] row : departmentStats) {
            String department = (String) row[0];
            Long count = (Long) row[1];
            if (department != null && !department.trim().isEmpty()) {
                byDepartment.put(department, count);
            }
        }
        stats.put("byDepartment", byDepartment);

        // Estadísticas de documentos
        long pendingDocuments = documentRepository.countByStatus("PENDING");
        long documentsToReview = documentRepository.countByStatus("PENDING"); // Mismo valor por ahora

        stats.put("pendingDocuments", pendingDocuments);
        stats.put("documentsToReview", documentsToReview);

        return stats;
    }

    /**
     * Obtiene estadísticas de inscripciones para un concurso específico
     */
    public Map<InscriptionState, Long> getInscriptionStatsByContest(Long contestId) {
        // Verificar que el concurso existe
        if (contestRepository.findById(contestId).isEmpty()) {
            throw new ResourceNotFoundException("Contest", "id", contestId.toString());
        }

        // Obtener estadísticas
        Map<InscriptionState, Long> stats = new HashMap<>();

        for (InscriptionState state : InscriptionState.values()) {
            long count = inscriptionRepository.countByContestIdAndState(contestId, state);
            stats.put(state, count);
        }

        return stats;
    }

    /**
     * Carga entidades relacionadas para una inscripción
     */
    private void loadRelatedEntities(Inscription inscription) {
        log.info("📊 [loadRelatedEntities] Cargando entidades para inscripción: {}", inscription.getId().getValue());
        log.info("📊 [loadRelatedEntities] UserId: {}", inscription.getUserId().getValue());
        
        // Cargar usuario (con validación explícita)
        try {
            log.info("🔍 [loadRelatedEntities] Buscando usuario con ID: {}", inscription.getUserId().getValue());
            
            // DEBUG: Verificar si el repository está funcionando
            boolean userExists = userRepository.findById(inscription.getUserId().getValue()).isPresent();
            log.info("🔍 [loadRelatedEntities] ¿Usuario existe en BD?: {}", userExists);
            
            User user = userRepository.findById(inscription.getUserId().getValue())
                    .orElseThrow(() -> {
                        log.error("❌ [loadRelatedEntities] Usuario no encontrado con ID: {}", inscription.getUserId().getValue());
                        return new IllegalArgumentException("User not found for inscription ID: " + inscription.getId().getValue() + ", UserId: " + inscription.getUserId().getValue());
                    });
            
            log.debug("✅ [loadRelatedEntities] Usuario encontrado: {} ({})", user.getUsername().value(), user.getId().value());
            inscription.setUser(user);
            log.debug("✅ [loadRelatedEntities] Usuario asignado correctamente a la inscripción");
            
        } catch (Exception e) {
            log.error("❌ [loadRelatedEntities] Error al cargar usuario para inscripción {}: {}", inscription.getId().getValue(), e.getMessage(), e);
            throw e;
        }

        // Cargar concurso
        contestRepository.findById(inscription.getContestId().getValue())
                .ifPresent(contest -> {
                    log.debug("✅ [loadRelatedEntities] Concurso cargado: {}", contest.getTitle());
                    // El modelo Inscription ahora usa directamente el modelo legacy Contest
                    inscription.setContest(contest);
                });

        // Cargar notas
        inscription.setNotes(noteRepository.findByInscriptionId(inscription.getId().getValue()));
        log.debug("✅ [loadRelatedEntities] Entidades cargadas completamente para inscripción: {}", inscription.getId().getValue());
    }

    /**
     * Valida si el cambio de estado es permitido usando la máquina de estado
     */
    private void validateStateChange(InscriptionState currentState, InscriptionState newState) {
        try {
            stateMachine.validateTransition(currentState, newState);
        } catch (IllegalStateException e) {
            throw new IllegalArgumentException("Cambio de estado no permitido: " + e.getMessage());
        }
    }

    /**
     * Obtiene los estados válidos siguientes para un estado actual
     */
    public Set<InscriptionState> getValidNextStates(InscriptionState currentState) {
        return stateMachine.getValidNextStates(currentState);
    }

    /**
     * Verifica si un estado permite carga de documentos
     */
    public boolean allowsDocumentUpload(InscriptionState state) {
        return stateMachine.allowsDocumentUpload(state);
    }

    /**
     * Verifica si una inscripción puede ser reanudada por el usuario
     */
    public boolean isResumable(InscriptionState state) {
        return stateMachine.isResumable(state);
    }

    /**
     * Verifica si un estado es final
     */
    public boolean isFinalState(InscriptionState state) {
        return stateMachine.isFinalState(state);
    }

    /**
     * Actualiza el estado de un documento específico dentro de una inscripción
     * y evalúa si la inscripción debe cambiar automáticamente a APPROVED
     */
    @Transactional
    public Document updateDocumentStatus(String inscriptionId, String documentId, String status, String observations) {
        log.debug("Actualizando estado de documento {} en inscripción {} a estado: {}", documentId, inscriptionId, status);

        // Verificar que la inscripción existe
        Inscription inscription = getInscriptionById(inscriptionId);

        // Verificar que el documento pertenece a la inscripción
        Document document = documentRepository.findById(new DocumentId(UUID.fromString(documentId)))
                .orElseThrow(() -> new IllegalArgumentException("Documento no encontrado"));

        if (!document.getUserId().equals(inscription.getUserId().getValue())) {
            throw new IllegalArgumentException("El documento no pertenece a esta inscripción");
        }

        // Actualizar el estado del documento usando el servicio existente
        DocumentStatus documentStatus = DocumentStatus.valueOf(status.toUpperCase());
        document.setStatus(documentStatus);

        // Agregar observaciones si se proporcionaron
        if (observations != null && !observations.trim().isEmpty()) {
            document.setRejectionReason(observations);
        }

        // Marcar como validado
        document.setValidatedAt(LocalDateTime.now());
        // TODO: Obtener el ID del admin actual desde el contexto de seguridad
        // document.setValidatedBy(getCurrentAdminId());

        Document updatedDocument = documentRepository.save(document);

        // Evaluar si todos los documentos requeridos están aprobados
        evaluateInscriptionCompleteness(inscription);

        log.info("Documento {} actualizado a estado {} en inscripción {}", documentId, status, inscriptionId);
        return updatedDocument;
    }

    /**
     * Evalúa si una inscripción tiene todos los documentos requeridos aprobados
     * y cambia automáticamente el estado a APPROVED si corresponde
     */
    private void evaluateInscriptionCompleteness(Inscription inscription) {
        // Solo evaluar si la inscripción está en estado PENDING
        if (inscription.getState() != InscriptionState.PENDING) {
            return;
        }

        // Obtener todos los documentos de la inscripción
        List<Document> documents = documentRepository.findByUserId(inscription.getUserId().getValue());

        // Filtrar solo documentos activos (no archivados)
        List<Document> activeDocuments = documents.stream()
                .filter(Document::isActive)
                .collect(Collectors.toList());

        // Verificar si todos los documentos requeridos están aprobados
        // TODO: Implementar lógica para obtener tipos de documentos requeridos dinámicamente
        Set<String> requiredDocumentTypes = getRequiredDocumentTypes();

        boolean allRequiredDocumentsApproved = requiredDocumentTypes.stream()
                .allMatch(requiredType ->
                    activeDocuments.stream()
                        .anyMatch(doc ->
                            doc.getDocumentType().getCode().equals(requiredType) &&
                            doc.getStatus() == DocumentStatus.APPROVED
                        )
                );

        if (allRequiredDocumentsApproved) {
            log.info("Todos los documentos requeridos están aprobados para inscripción {}. Cambiando estado a APPROVED.",
                    inscription.getId());

            // Cambiar estado automáticamente a APPROVED
            inscription.setState(InscriptionState.APPROVED);
            inscription.setLastUpdated(LocalDateTime.now());
            inscriptionRepository.save(inscription);

            // Enviar notificación al usuario
            sendStateChangeNotification(inscription);
        }
    }

    /**
     * Obtiene los tipos de documentos requeridos
     * TODO: Implementar lógica dinámica basada en el concurso
     */
    private Set<String> getRequiredDocumentTypes() {
        // Por ahora retornamos los tipos básicos requeridos para MPD
        return Set.of(
            "dni-frontal",
            "dni-dorso",
            "cuil",
            "antecedentes-penales",
            "certificado-profesional"
        );
    }

    /**
     * Envía una notificación al usuario sobre el cambio de estado
     */
    private void sendStateChangeNotification(Inscription inscription) {
        // Verificar si las notificaciones están habilitadas
        if (!notificationsEnabled || !stateChangeNotificationsEnabled) {
            log.info("🚫 Notificaciones deshabilitadas para cambio de estado. Inscripción: {} | General: {} | StateChange: {}", 
                    inscription.getId().getValue(), notificationsEnabled, stateChangeNotificationsEnabled);
            return;
        }
        
        try {
            // SOLUCIÓN DEFINITIVA: Cargar el usuario directamente desde la base de datos
            // para evitar problemas con el estado de la sesión de Hibernate
            User user = userRepository.findById(inscription.getUserId().getValue())
                    .orElseThrow(() -> new IllegalStateException(
                        "User not found for notification. Inscription ID: " + inscription.getId().getValue() + 
                        ", User ID: " + inscription.getUserId().getValue()));

            String username = user.getUsername().value();
            String contestTitle = inscription.getContest() != null ?
                    inscription.getContest().getTitle() : "Concurso";

            String message;
            NotificationType type;

            switch (inscription.getState()) {
                case APPROVED:  // REFACTORING: Usar estado estándar
                    message = "Tu inscripción al concurso " + contestTitle + " ha sido aprobada.";
                    type = NotificationType.INSCRIPTION;
                    break;
                case REJECTED:
                    message = "Tu inscripción al concurso " + contestTitle + " ha sido rechazada.";
                    type = NotificationType.INSCRIPTION;
                    break;
                default:
                    message = "El estado de tu inscripción al concurso " + contestTitle +
                            " ha cambiado a " + inscription.getState().name() + ".";
                    type = NotificationType.INSCRIPTION;
            }

            log.info("📧 Enviando notificación a usuario: {} (ID: {})", username, user.getId().value());
            notificationService.createNotification(username, message, type);
            log.info("✅ Notificación enviada exitosamente para inscripción: {}", inscription.getId().getValue());
            
        } catch (Exception e) {
            // En caso de error en las notificaciones, logear pero no fallar el cambio de estado
            log.error("❌ Error al enviar notificación para inscripción {}: {}. El cambio de estado se completó exitosamente.", 
                    inscription.getId().getValue(), e.getMessage(), e);
        }
    }

    /**
     * Obtiene el nombre de usuario actual
     */
    private String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null ? authentication.getName() : "system";
    }

    public List<Map<String, Object>> getInscriptionReport(InscriptionReportRequestDTO request) {
        // 1. Obtener todas las inscripciones aplicando filtros básicos
        // (Para MVP, solo algunos filtros principales)
        Page<Inscription> page = inscriptionRepository.findAll(org.springframework.data.domain.PageRequest.of(0, Integer.MAX_VALUE));
        List<Inscription> inscriptions = page.getContent();
        // 2. Cargar entidades relacionadas
        inscriptions.forEach(this::loadRelatedEntities);
        // 3. Mapear solo los campos solicitados
        List<Map<String, Object>> result = new java.util.ArrayList<>();
        for (Inscription insc : inscriptions) {
            Map<String, Object> row = new java.util.HashMap<>();
            for (String field : request.getFields()) {
                switch (field) {
                    case "userFullName":
                        if (insc.getUser() != null) row.put(field, insc.getUser().getFirstName() + " " + insc.getUser().getLastName());
                        break;
                    case "userDni":
                        if (insc.getUser() != null) row.put(field, insc.getUser().getDni().value());
                        break;
                    case "userEmail":
                        if (insc.getUser() != null) row.put(field, insc.getUser().getEmail().value());
                        break;
                    case "contestTitle":
                        if (insc.getContest() != null) row.put(field, insc.getContest().getTitle());
                        break;
                    case "inscriptionState":
                        row.put(field, insc.getState() != null ? insc.getState().name() : null);
                        break;
                    case "inscriptionCreatedAt":
                        row.put(field, insc.getInscriptionDate());
                        break;
                    case "inscriptionUpdatedAt":
                        row.put(field, insc.getLastUpdated());
                        break;
                    // Agrega más campos según lo que necesites...
                }
            }
            result.add(row);
        }
        return result;
    }

    public List<Map<String, Object>> generateReport(
            List<String> fields,
            Map<String, Object> filters,
            String groupBy,
            String sortBy,
            String sortDirection
        ) {
            // Construir la consulta base
            Sort sort = sortBy != null ? 
                Sort.by(Sort.Direction.fromString(sortDirection != null ? sortDirection : "asc"), sortBy) : 
                Sort.unsorted();

            // Obtener las inscripciones aplicando los filtros
            Page<Inscription> inscriptions = inscriptionRepository.findAll(
                createSpecificationFromFilters(filters),
                org.springframework.data.domain.PageRequest.of(0, Integer.MAX_VALUE, sort)
            );

            // Transformar los resultados según los campos solicitados
            return inscriptions.getContent().stream()
                .map(inscription -> {
                    Map<String, Object> row = new HashMap<>();
                    fields.forEach(field -> {
                        switch (field) {
                            case "userFullName":
                                row.put(field, inscription.getUser().getFullName());
                                break;
                            case "userDni":
                                row.put(field, inscription.getUser().getDni());
                                break;
                            case "userEmail":
                                row.put(field, inscription.getUser().getEmail());
                                break;
                            case "contestTitle":
                                row.put(field, inscription.getContest().getTitle());
                                break;
                            case "contestCategory":
                                row.put(field, inscription.getContest().getCategory());
                                break;
                            case "contestDepartment":
                                row.put(field, inscription.getContest().getDependency());
                                break;
                            case "inscriptionState":
                                row.put(field, inscription.getState().toString());
                                break;
                            case "inscriptionCreatedAt":
                                row.put(field, inscription.getCreatedAt());
                                break;
                            case "documentsCount":
                                row.put(field, inscription.getDocuments().size());
                                break;
                            // Agregar más casos según sea necesario
                            default:
                                // Intentar obtener el valor por reflexión
                                try {
                                    row.put(field, PropertyUtils.getProperty(inscription, field));
                                } catch (Exception e) {
                                    row.put(field, null);
                                }
                        }
                    });
                    return row;
                })
                .collect(Collectors.toList());
        }

        private Specification<Inscription> createSpecificationFromFilters(Map<String, Object> filters) {
            return (root, query, cb) -> {
                List<Predicate> predicates = new ArrayList<>();

                if (filters != null) {
                    if (filters.get("inscriptionState") != null) {
                        predicates.add(cb.equal(root.get("state"), 
                            InscriptionState.valueOf(filters.get("inscriptionState").toString())));
                    }

                    if (filters.get("contestId") != null) {
                        predicates.add(cb.equal(root.get("contest").get("id"), 
                            filters.get("contestId")));
                    }

                    Map<String, Object> dateRange = (Map<String, Object>) filters.get("dateRange");
                    if (dateRange != null) {
                        if (dateRange.get("startDate") != null) {
                            LocalDateTime startDate = LocalDateTime.parse(dateRange.get("startDate").toString());
                            predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), startDate));
                        }
                        if (dateRange.get("endDate") != null) {
                            LocalDateTime endDate = LocalDateTime.parse(dateRange.get("endDate").toString());
                            predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), endDate));
                        }
                    }

                    if (filters.get("search") != null) {
                        String search = filters.get("search").toString().toLowerCase();
                        predicates.add(cb.or(
                            cb.like(cb.lower(root.get("user").get("fullName")), "%" + search + "%"),
                            cb.like(cb.lower(root.get("user").get("dni")), "%" + search + "%"),
                            cb.like(cb.lower(root.get("user").get("email")), "%" + search + "%")
                        ));
                    }
                }

                return predicates.isEmpty() ? cb.conjunction() : cb.and(predicates.toArray(new Predicate[0]));
            };
        }
}
