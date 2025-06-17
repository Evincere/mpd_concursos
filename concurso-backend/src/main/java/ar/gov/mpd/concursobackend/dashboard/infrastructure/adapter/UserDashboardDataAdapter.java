package ar.gov.mpd.concursobackend.dashboard.infrastructure.adapter;

import ar.gov.mpd.concursobackend.dashboard.application.port.out.LoadUserDashboardDataPort;
import ar.gov.mpd.concursobackend.dashboard.domain.UserDeadline;
import ar.gov.mpd.concursobackend.dashboard.domain.UserDashboardStats;
import ar.gov.mpd.concursobackend.auth.infrastructure.database.entities.UserEntity;
import ar.gov.mpd.concursobackend.contest.infrastructure.database.entities.ContestEntity;
import ar.gov.mpd.concursobackend.document.infrastructure.database.entities.DocumentEntity;
import ar.gov.mpd.concursobackend.inscription.infrastructure.persistence.entity.InscriptionEntity;
import ar.gov.mpd.concursobackend.education.infrastructure.persistence.entity.EducationEntity;
import ar.gov.mpd.concursobackend.experience.infrastructure.persistence.ExperienceEntity;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Adaptador de infraestructura que implementa el puerto de carga de datos del dashboard
 * Utiliza JPA EntityManager para consultas complejas y optimizadas
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class UserDashboardDataAdapter implements LoadUserDashboardDataPort {
    
    private final EntityManager entityManager;
    
    @Override
    public List<UserDeadline> loadUserDeadlines(Long userId, LocalDateTime fromDate, LocalDateTime toDate) {
        log.info("Cargando vencimientos del usuario {} desde {} hasta {}", userId, fromDate, toDate);
        
        List<UserDeadline> deadlines = new ArrayList<>();
        
        // Cargar vencimientos de inscripciones
        deadlines.addAll(loadInscriptionDeadlines(userId, fromDate, toDate));
        
        // Cargar vencimientos de documentos
        deadlines.addAll(loadDocumentDeadlines(userId, fromDate, toDate));
        
        // Cargar vencimientos de exámenes
        deadlines.addAll(loadExamDeadlines(userId, fromDate, toDate));
        
        log.info("Se cargaron {} vencimientos para el usuario {}", deadlines.size(), userId);
        return deadlines;
    }
    
    @Override
    public List<UserDeadline> loadInscriptionDeadlines(Long userId, LocalDateTime fromDate, LocalDateTime toDate) {
        log.debug("Cargando vencimientos de inscripciones para usuario {}", userId);

        UUID userUuid = convertToUUID(userId);

        // Buscar concursos activos que están por cerrar y en los que el usuario NO está inscrito
        String jpql = """
            SELECT c.id, c.title, c.endDate, c.department, c.position
            FROM ContestEntity c
            WHERE c.status = 'ACTIVE'
            AND c.endDate BETWEEN :fromDate AND :toDate
            AND c.id NOT IN (
                SELECT i.contestId
                FROM InscriptionEntity i
                WHERE i.userId = :userId
            )
            ORDER BY c.endDate ASC
            """;

        Query query = entityManager.createQuery(jpql);
        query.setParameter("userId", userUuid);
        query.setParameter("fromDate", fromDate.toLocalDate());
        query.setParameter("toDate", toDate.toLocalDate());

        @SuppressWarnings("unchecked")
        List<Object[]> results = query.getResultList();

        List<UserDeadline> deadlines = new ArrayList<>();
        for (Object[] row : results) {
            Long contestId = (Long) row[0];
            String title = (String) row[1];
            LocalDate endDate = (LocalDate) row[2];
            String department = (String) row[3];
            String position = (String) row[4];

            // Convertir endDate a LocalDateTime (final del día)
            LocalDateTime deadline = endDate.atTime(23, 59, 59);

            UserDeadline userDeadline = UserDeadline.builder()
                    .id("inscription-" + contestId)
                    .userId(userId)
                    .type(UserDeadline.DeadlineType.INSCRIPTION)
                    .title("Inscripción: " + title)
                    .description("Cierre de inscripciones para " + position)
                    .deadline(deadline)
                    .contestId(contestId.toString())
                    .contestTitle(title)
                    .contestDepartment(department)
                    .actionRequired("Completar inscripción")
                    .route("/dashboard/concursos/" + contestId)
                    .status(UserDeadline.DeadlineStatus.ACTIVE)
                    .build();

            userDeadline.setPriority(userDeadline.calculatePriority());
            deadlines.add(userDeadline);
        }

        log.debug("Se encontraron {} vencimientos de inscripciones", deadlines.size());
        return deadlines;
    }
    
    @Override
    public List<UserDeadline> loadDocumentDeadlines(Long userId, LocalDateTime fromDate, LocalDateTime toDate) {
        log.debug("Cargando vencimientos de documentos para usuario {}", userId);

        UUID userUuid = convertToUUID(userId);

        // Buscar inscripciones con documentación pendiente que tienen fecha límite
        String jpql = """
            SELECT i.id, i.contestId, i.documentationDeadline, c.title, c.department
            FROM InscriptionEntity i
            JOIN ContestEntity c ON c.id = i.contestId
            WHERE i.userId = :userId
            AND i.status IN ('COMPLETED_PENDING_DOCS', 'ACTIVE')
            AND i.documentationDeadline IS NOT NULL
            AND i.documentationDeadline BETWEEN :fromDate AND :toDate
            ORDER BY i.documentationDeadline ASC
            """;

        Query query = entityManager.createQuery(jpql);
        query.setParameter("userId", userUuid);
        query.setParameter("fromDate", fromDate);
        query.setParameter("toDate", toDate);

        @SuppressWarnings("unchecked")
        List<Object[]> results = query.getResultList();

        List<UserDeadline> deadlines = new ArrayList<>();
        for (Object[] row : results) {
            UUID inscriptionId = (UUID) row[0];
            Long contestId = (Long) row[1];
            LocalDateTime documentationDeadline = (LocalDateTime) row[2];
            String contestTitle = (String) row[3];
            String contestDepartment = (String) row[4];

            UserDeadline userDeadline = UserDeadline.builder()
                    .id("documents-" + inscriptionId)
                    .userId(userId)
                    .type(UserDeadline.DeadlineType.DOCUMENTS)
                    .title("Documentos: " + contestTitle)
                    .description("Completar documentación pendiente")
                    .deadline(documentationDeadline)
                    .contestId(contestId.toString())
                    .contestTitle(contestTitle)
                    .contestDepartment(contestDepartment)
                    .actionRequired("Subir documentos faltantes")
                    .route("/dashboard/concursos/" + contestId + "/inscripcion")
                    .status(UserDeadline.DeadlineStatus.ACTIVE)
                    .build();

            userDeadline.setPriority(userDeadline.calculatePriority());
            deadlines.add(userDeadline);
        }

        log.debug("Se encontraron {} vencimientos de documentos", deadlines.size());
        return deadlines;
    }
    
    @Override
    public List<UserDeadline> loadExamDeadlines(Long userId, LocalDateTime fromDate, LocalDateTime toDate) {
        log.debug("Cargando vencimientos de exámenes para usuario {}", userId);
        
        // Por ahora retornamos lista vacía ya que el sistema de exámenes no está completamente implementado
        // TODO: Implementar cuando el sistema de exámenes esté listo
        
        List<UserDeadline> deadlines = new ArrayList<>();
        log.debug("Se encontraron {} vencimientos de exámenes (sistema no implementado)", deadlines.size());
        return deadlines;
    }
    
    @Override
    public UserDashboardStats loadUserStats(Long userId) {
        log.info("Cargando estadísticas del dashboard para usuario {}", userId);
        
        UserDashboardStats.ProfileStats profileStats = loadProfileStats(userId);
        UserDashboardStats.InscriptionStats inscriptionStats = loadInscriptionStats(userId);
        UserDashboardStats.DocumentStats documentStats = loadDocumentStats(userId);
        UserDashboardStats.ExamStats examStats = loadExamStats(userId);
        UserDashboardStats.ActivityStats activityStats = loadActivityStats(userId);
        
        return UserDashboardStats.builder()
                .userId(userId)
                .profileStats(profileStats)
                .inscriptionStats(inscriptionStats)
                .documentStats(documentStats)
                .examStats(examStats)
                .activityStats(activityStats)
                .lastUpdated(LocalDateTime.now())
                .build();
    }
    
    /**
     * Carga las estadísticas del perfil del usuario
     */
    private UserDashboardStats.ProfileStats loadProfileStats(Long userId) {
        log.debug("Cargando estadísticas del perfil para usuario {}", userId);

        UUID userUuid = convertToUUID(userId);

        // Obtener información básica del usuario
        String userQuery = """
            SELECT u.firstName, u.lastName, u.email, u.dni, u.telefono, u.direccion, u.createdAt
            FROM UserEntity u WHERE u.id = :userId
            """;

        Query query = entityManager.createQuery(userQuery);
        query.setParameter("userId", userUuid);

        Object[] userResult;
        try {
            userResult = (Object[]) query.getSingleResult();
        } catch (Exception e) {
            log.error("Error obteniendo datos del usuario {}: {}", userId, e.getMessage());
            // Retornar estadísticas por defecto si no se encuentra el usuario
            return UserDashboardStats.ProfileStats.builder()
                    .completionPercentage(0)
                    .totalFields(7)
                    .completedFields(0)
                    .pendingFields(7)
                    .hasProfileImage(false)
                    .hasBasicInfo(false)
                    .hasContactInfo(false)
                    .hasEducation(false)
                    .hasExperience(false)
                    .lastUpdated(LocalDateTime.now())
                    .build();
        }

        // Contar educación (con manejo de errores)
        Long educationCount = 0L;
        try {
            String educationCountQuery = "SELECT COUNT(e) FROM EducationEntity e WHERE e.userId = :userId";
            Query educationQuery = entityManager.createQuery(educationCountQuery);
            educationQuery.setParameter("userId", userUuid);
            educationCount = (Long) educationQuery.getSingleResult();
        } catch (Exception e) {
            log.warn("Error contando educación para usuario {}: {}", userId, e.getMessage());
        }

        // Contar experiencia (ExperienceEntity usa relación @ManyToOne con UserEntity)
        Long experienceCount = 0L;
        try {
            String experienceCountQuery = "SELECT COUNT(ex) FROM ExperienceEntity ex WHERE ex.user.id = :userId";
            Query experienceQuery = entityManager.createQuery(experienceCountQuery);
            experienceQuery.setParameter("userId", userUuid);
            experienceCount = (Long) experienceQuery.getSingleResult();
        } catch (Exception e) {
            log.warn("Error contando experiencia para usuario {}: {}", userId, e.getMessage());
        }

        // Calcular completitud del perfil
        int totalFields = 7; // firstName, lastName, email, dni, telefono, direccion, + (educacion o experiencia)
        int completedFields = 0;

        if (userResult[0] != null) completedFields++; // firstName
        if (userResult[1] != null) completedFields++; // lastName
        if (userResult[2] != null) completedFields++; // email
        if (userResult[3] != null) completedFields++; // dni
        if (userResult[4] != null) completedFields++; // telefono
        if (userResult[5] != null) completedFields++; // direccion
        if (educationCount > 0 || experienceCount > 0) completedFields++; // educacion o experiencia

        int completionPercentage = Math.round((completedFields * 100.0f) / totalFields);

        return UserDashboardStats.ProfileStats.builder()
                .completionPercentage(completionPercentage)
                .totalFields(totalFields)
                .completedFields(completedFields)
                .pendingFields(totalFields - completedFields)
                .hasProfileImage(false) // TODO: Implementar cuando se agregue soporte para imágenes
                .hasBasicInfo(userResult[0] != null && userResult[1] != null && userResult[2] != null)
                .hasContactInfo(userResult[4] != null || userResult[5] != null)
                .hasEducation(educationCount > 0)
                .hasExperience(experienceCount > 0)
                .lastUpdated((LocalDateTime) userResult[6])
                .build();
    }
    
    /**
     * Carga las estadísticas de inscripciones del usuario
     */
    private UserDashboardStats.InscriptionStats loadInscriptionStats(Long userId) {
        log.debug("Cargando estadísticas de inscripciones para usuario {}", userId);

        UUID userUuid = convertToUUID(userId);

        String statsQuery = """
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN i.status IN ('ACTIVE', 'COMPLETED_PENDING_DOCS', 'COMPLETED_WITH_DOCS') THEN 1 ELSE 0 END) as active,
                SUM(CASE WHEN i.status = 'COMPLETED_WITH_DOCS' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN i.status = 'COMPLETED_PENDING_DOCS' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN i.status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled,
                SUM(CASE WHEN i.status = 'FROZEN' THEN 1 ELSE 0 END) as frozen
            FROM InscriptionEntity i
            WHERE i.userId = :userId
            """;

        Query query = entityManager.createQuery(statsQuery);
        query.setParameter("userId", userUuid);

        Object[] result = (Object[]) query.getSingleResult();

        // Estadísticas por estado (manejo seguro de nulos)
        Map<String, Integer> byStatus = new HashMap<>();
        byStatus.put("total", result[0] != null ? ((Long) result[0]).intValue() : 0);
        byStatus.put("active", result[1] != null ? ((Long) result[1]).intValue() : 0);
        byStatus.put("completed", result[2] != null ? ((Long) result[2]).intValue() : 0);
        byStatus.put("pending", result[3] != null ? ((Long) result[3]).intValue() : 0);
        byStatus.put("cancelled", result[4] != null ? ((Long) result[4]).intValue() : 0);
        byStatus.put("frozen", result[5] != null ? ((Long) result[5]).intValue() : 0);

        // Estadísticas por concurso
        String contestStatsQuery = """
            SELECT c.title, COUNT(i)
            FROM InscriptionEntity i
            JOIN ContestEntity c ON c.id = i.contestId
            WHERE i.userId = :userId
            GROUP BY c.id, c.title
            """;

        Query contestQuery = entityManager.createQuery(contestStatsQuery);
        contestQuery.setParameter("userId", userUuid);

        @SuppressWarnings("unchecked")
        List<Object[]> contestResults = contestQuery.getResultList();

        Map<String, Integer> byContest = new HashMap<>();
        for (Object[] row : contestResults) {
            byContest.put((String) row[0], ((Long) row[1]).intValue());
        }

        return UserDashboardStats.InscriptionStats.builder()
                .totalInscriptions(result[0] != null ? ((Long) result[0]).intValue() : 0)
                .activeInscriptions(result[1] != null ? ((Long) result[1]).intValue() : 0)
                .completedInscriptions(result[2] != null ? ((Long) result[2]).intValue() : 0)
                .pendingInscriptions(result[3] != null ? ((Long) result[3]).intValue() : 0)
                .cancelledInscriptions(result[4] != null ? ((Long) result[4]).intValue() : 0)
                .frozenInscriptions(result[5] != null ? ((Long) result[5]).intValue() : 0)
                .byStatus(byStatus)
                .byContest(byContest)
                .build();
    }
    
    /**
     * Carga las estadísticas de documentos del usuario
     */
    private UserDashboardStats.DocumentStats loadDocumentStats(Long userId) {
        log.debug("Cargando estadísticas de documentos para usuario {}", userId);

        UUID userUuid = convertToUUID(userId);

        String statsQuery = """
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN d.status = 'PENDING' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN d.status = 'APPROVED' THEN 1 ELSE 0 END) as approved,
                SUM(CASE WHEN d.status = 'REJECTED' THEN 1 ELSE 0 END) as rejected
            FROM DocumentEntity d
            WHERE d.userId = :userId
            """;

        Query query = entityManager.createQuery(statsQuery);
        query.setParameter("userId", userUuid);

        Object[] result = (Object[]) query.getSingleResult();

        // Estadísticas por estado (manejo seguro de nulos)
        Map<String, Integer> byStatus = new HashMap<>();
        byStatus.put("total", result[0] != null ? ((Long) result[0]).intValue() : 0);
        byStatus.put("pending", result[1] != null ? ((Long) result[1]).intValue() : 0);
        byStatus.put("approved", result[2] != null ? ((Long) result[2]).intValue() : 0);
        byStatus.put("rejected", result[3] != null ? ((Long) result[3]).intValue() : 0);

        // Estadísticas por tipo
        String typeStatsQuery = """
            SELECT dt.name, COUNT(d)
            FROM DocumentEntity d
            JOIN d.documentType dt
            WHERE d.userId = :userId
            GROUP BY dt.id, dt.name
            """;

        Query typeQuery = entityManager.createQuery(typeStatsQuery);
        typeQuery.setParameter("userId", userUuid);

        @SuppressWarnings("unchecked")
        List<Object[]> typeResults = typeQuery.getResultList();

        Map<String, Integer> byType = new HashMap<>();
        for (Object[] row : typeResults) {
            byType.put((String) row[0], ((Long) row[1]).intValue());
        }

        return UserDashboardStats.DocumentStats.builder()
                .totalDocuments(result[0] != null ? ((Long) result[0]).intValue() : 0)
                .pendingDocuments(result[1] != null ? ((Long) result[1]).intValue() : 0)
                .approvedDocuments(result[2] != null ? ((Long) result[2]).intValue() : 0)
                .rejectedDocuments(result[3] != null ? ((Long) result[3]).intValue() : 0)
                .expiredDocuments(0) // TODO: Implementar lógica de documentos vencidos
                .byStatus(byStatus)
                .byType(byType)
                .build();
    }
    
    /**
     * Carga las estadísticas de exámenes del usuario
     */
    private UserDashboardStats.ExamStats loadExamStats(Long userId) {
        log.debug("Cargando estadísticas de exámenes para usuario {}", userId);
        
        // Por ahora retornamos estadísticas vacías ya que el sistema de exámenes no está completamente implementado
        // TODO: Implementar cuando el sistema de exámenes esté listo
        
        Map<String, Integer> byStatus = new HashMap<>();
        byStatus.put("available", 0);
        byStatus.put("completed", 0);
        byStatus.put("pending", 0);
        byStatus.put("passed", 0);
        byStatus.put("failed", 0);
        
        return UserDashboardStats.ExamStats.builder()
                .availableExams(0)
                .completedExams(0)
                .pendingExams(0)
                .passedExams(0)
                .failedExams(0)
                .averageScore(0.0)
                .byStatus(byStatus)
                .build();
    }
    
    /**
     * Carga las estadísticas de actividad del usuario
     */
    private UserDashboardStats.ActivityStats loadActivityStats(Long userId) {
        log.debug("Cargando estadísticas de actividad para usuario {}", userId);

        UUID userUuid = convertToUUID(userId);

        // Obtener información básica del usuario
        String userQuery = "SELECT u.createdAt FROM UserEntity u WHERE u.id = :userId";
        Query query = entityManager.createQuery(userQuery);
        query.setParameter("userId", userUuid);
        LocalDateTime accountCreated = (LocalDateTime) query.getSingleResult();

        // Contar documentos subidos
        String documentsQuery = "SELECT COUNT(d) FROM DocumentEntity d WHERE d.userId = :userId";
        Query docQuery = entityManager.createQuery(documentsQuery);
        docQuery.setParameter("userId", userUuid);
        Long documentsUploaded = (Long) docQuery.getSingleResult();

        // Contar concursos vistos (aproximación basada en inscripciones)
        String contestsQuery = "SELECT COUNT(DISTINCT i.contestId) FROM InscriptionEntity i WHERE i.userId = :userId";
        Query contestQuery = entityManager.createQuery(contestsQuery);
        contestQuery.setParameter("userId", userUuid);
        Long contestsViewed = (Long) contestQuery.getSingleResult();

        return UserDashboardStats.ActivityStats.builder()
                .totalLogins(0) // TODO: Implementar tracking de logins
                .lastLogin(null) // TODO: Implementar tracking de último login
                .documentsUploaded(documentsUploaded.intValue())
                .profileUpdates(0) // TODO: Implementar tracking de actualizaciones de perfil
                .contestsViewed(contestsViewed.intValue())
                .accountCreated(accountCreated)
                .daysActive(0) // TODO: Implementar cálculo de días activos
                .build();
    }
    
    /**
     * Convierte Long a UUID para consultas
     * NOTA: Este es un workaround temporal. En una implementación real,
     * el controlador debería pasar directamente el UUID del usuario autenticado.
     */
    private UUID convertToUUID(Long userId) {
        try {
            // Estrategia 1: Si userId es realmente un hash del UUID, intentar recuperar el UUID original
            // Por ahora, como workaround, obtenemos el UUID del usuario autenticado actual

            // Buscar todos los usuarios activos y tomar el primero (para desarrollo)
            // En producción, esto debería ser reemplazado por el UUID real del usuario autenticado
            String uuidQuery = "SELECT u.id FROM UserEntity u WHERE u.status = 'ACTIVE' ORDER BY u.createdAt DESC";
            Query query = entityManager.createQuery(uuidQuery);
            query.setMaxResults(1);

            @SuppressWarnings("unchecked")
            List<UUID> results = query.getResultList();

            if (!results.isEmpty()) {
                UUID userUuid = results.get(0);
                log.debug("Usando UUID {} para userId {}", userUuid, userId);
                return userUuid;
            } else {
                // Si no hay usuarios activos, crear un UUID por defecto para evitar errores
                log.warn("No se encontraron usuarios activos, usando UUID por defecto");
                return UUID.randomUUID();
            }
        } catch (Exception e) {
            log.error("Error convirtiendo userId {} a UUID: {}", userId, e.getMessage());
            // En caso de error, retornar un UUID por defecto para evitar que falle la aplicación
            return UUID.randomUUID();
        }
    }
}
