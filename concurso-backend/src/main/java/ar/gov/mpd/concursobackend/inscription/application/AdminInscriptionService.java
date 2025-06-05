package ar.gov.mpd.concursobackend.inscription.application;

import ar.gov.mpd.concursobackend.contest.domain.port.ContestRepository;
import ar.gov.mpd.concursobackend.auth.domain.port.IUserRepository;
import ar.gov.mpd.concursobackend.inscription.domain.model.Inscription;
import ar.gov.mpd.concursobackend.inscription.domain.model.InscriptionNote;
import ar.gov.mpd.concursobackend.inscription.domain.model.InscriptionState;
import ar.gov.mpd.concursobackend.inscription.domain.port.InscriptionNoteRepository;
import ar.gov.mpd.concursobackend.inscription.domain.port.InscriptionRepository;
import ar.gov.mpd.concursobackend.document.domain.port.IDocumentRepository;
import ar.gov.mpd.concursobackend.notification.application.NotificationService;
import ar.gov.mpd.concursobackend.notification.domain.enums.NotificationType;
import ar.gov.mpd.concursobackend.shared.domain.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import ar.gov.mpd.concursobackend.inscription.infrastructure.controller.dto.InscriptionReportRequestDTO;
import org.springframework.data.domain.Sort;
import jakarta.persistence.criteria.Predicate;
import org.apache.commons.beanutils.PropertyUtils;

@Service
@RequiredArgsConstructor
public class AdminInscriptionService {

    private final InscriptionRepository inscriptionRepository;
    private final InscriptionNoteRepository noteRepository;
    private final IUserRepository userRepository;
    private final ContestRepository contestRepository;
    private final IDocumentRepository documentRepository;
    private final NotificationService notificationService;

    /**
     * Obtiene todas las inscripciones con filtros y paginación
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
        var specification = createSpecification(contestId, userId, state, startDate, endDate, search);
        return inscriptionRepository.findAll(specification, (PageRequest) pageable);
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
                predicates.add(cb.equal(root.get("state"), state));
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

        // Agregar nota si se proporcionó
        if (noteText != null && !noteText.trim().isEmpty()) {
            addNote(id, noteText);
        }

        // Enviar notificación al usuario
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

        // Estadísticas por estado
        long total = inscriptionRepository.count();
        long pending = inscriptionRepository.countByState(InscriptionState.PENDIENTE);
        long approved = inscriptionRepository.countByState(InscriptionState.INSCRIPTO);
        long rejected = inscriptionRepository.countByState(InscriptionState.REJECTED);
        long cancelled = inscriptionRepository.countByState(InscriptionState.CANCELLED);
        long inProcess = inscriptionRepository.countByState(InscriptionState.IN_PROCESS);

        stats.put("total", total);
        stats.put("pending", pending);
        stats.put("approved", approved);
        stats.put("rejected", rejected);
        stats.put("cancelled", cancelled);
        stats.put("inProcess", inProcess);

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
        // Cargar usuario
        userRepository.findById(inscription.getUserId().getValue())
                .ifPresent(inscription::setUser);

        // Cargar concurso
        contestRepository.findById(inscription.getContestId().getValue())
                .ifPresent(contest -> {
                    // Convertir de Contest a model.Contest
                    ar.gov.mpd.concursobackend.contest.domain.model.Contest modelContest =
                        new ar.gov.mpd.concursobackend.contest.domain.model.Contest();
                    modelContest.setId(UUID.randomUUID()); // Usar un ID temporal
                    modelContest.setTitle(contest.getTitle());
                    // Copiar otras propiedades según sea necesario

                    inscription.setContest(modelContest);
                });

        // Cargar notas
        inscription.setNotes(noteRepository.findByInscriptionId(inscription.getId().getValue()));
    }

    /**
     * Valida si el cambio de estado es permitido
     */
    private void validateStateChange(InscriptionState currentState, InscriptionState newState) {
        // Implementar reglas de validación según los requisitos
        // Por ejemplo, no se puede cambiar de REJECTED a INSCRIPTO directamente

        // Por ahora, permitir cualquier cambio de estado
    }

    /**
     * Envía una notificación al usuario sobre el cambio de estado
     */
    private void sendStateChangeNotification(Inscription inscription) {
        String userId = inscription.getUserId().getValue().toString();
        String contestTitle = inscription.getContest() != null ?
                inscription.getContest().getTitle() : "Concurso";

        String message;
        NotificationType type;

        switch (inscription.getState()) {
            case INSCRIPTO:
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

        notificationService.createNotification(userId, message, type);
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
                                row.put(field, inscription.getContest().getDepartment());
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
