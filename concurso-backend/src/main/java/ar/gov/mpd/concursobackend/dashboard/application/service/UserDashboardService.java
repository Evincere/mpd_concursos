package ar.gov.mpd.concursobackend.dashboard.application.service;

import ar.gov.mpd.concursobackend.dashboard.application.dto.UserDeadlineResponse;
import ar.gov.mpd.concursobackend.dashboard.application.dto.UserStatsResponse;
import ar.gov.mpd.concursobackend.dashboard.application.port.in.GetUserDeadlinesUseCase;
import ar.gov.mpd.concursobackend.dashboard.application.port.in.GetUserStatsUseCase;
import ar.gov.mpd.concursobackend.dashboard.application.port.out.LoadUserDashboardDataPort;
import ar.gov.mpd.concursobackend.dashboard.domain.UserDashboardStats;
import ar.gov.mpd.concursobackend.dashboard.domain.UserDeadline;
import ar.gov.mpd.concursobackend.dashboard.infrastructure.cache.DashboardCacheService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Servicio de aplicación para el dashboard del usuario
 * Implementa los casos de uso de obtener vencimientos y estadísticas
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class UserDashboardService implements GetUserDeadlinesUseCase, GetUserStatsUseCase {
    
    private final LoadUserDashboardDataPort loadUserDashboardDataPort;
    private final DashboardCacheService cacheService;
    
    @Override
    public List<UserDeadlineResponse> getUserDeadlines(Long userId, Integer daysAhead) {
        log.info("Obteniendo vencimientos del usuario {} para los próximos {} días", userId, daysAhead);

        if (daysAhead == null) {
            daysAhead = 30; // Por defecto 30 días
        }

        LocalDateTime fromDate = LocalDateTime.now();
        LocalDateTime toDate = fromDate.plusDays(daysAhead);

        // Generar clave de cache basada en parámetros
        String cacheKey = "all_" + daysAhead + "d";

        // Intentar obtener desde cache
        List<UserDeadline> cachedDeadlines = cacheService.getUserDeadlines(userId, cacheKey);
        if (cachedDeadlines != null) {
            log.debug("Vencimientos obtenidos desde cache para usuario {}", userId);
            return cachedDeadlines.stream()
                    .map(this::mapToDeadlineResponse)
                    .collect(Collectors.toList());
        }

        // Si no está en cache, cargar desde base de datos
        List<UserDeadline> deadlines = loadUserDashboardDataPort.loadUserDeadlines(userId, fromDate, toDate);

        // Almacenar en cache antes de mapear
        cacheService.putUserDeadlines(userId, cacheKey, deadlines);

        List<UserDeadlineResponse> response = deadlines.stream()
                .map(this::mapToDeadlineResponse)
                .sorted((d1, d2) -> {
                    // Ordenar por fecha de vencimiento
                    if (d1.getDeadline() == null && d2.getDeadline() == null) return 0;
                    if (d1.getDeadline() == null) return 1;
                    if (d2.getDeadline() == null) return -1;
                    return d1.getDeadline().compareTo(d2.getDeadline());
                })
                .collect(Collectors.toList());

        log.info("Se encontraron {} vencimientos para el usuario {} (almacenados en cache)", response.size(), userId);
        return response;
    }
    
    @Override
    public List<UserDeadlineResponse> getUrgentDeadlines(Long userId) {
        log.info("Obteniendo vencimientos urgentes del usuario {}", userId);
        return getUserDeadlines(userId, 7).stream()
                .filter(deadline -> deadline.getIsUrgent() != null && deadline.getIsUrgent())
                .collect(Collectors.toList());
    }
    
    @Override
    public List<UserDeadlineResponse> getDeadlinesByType(Long userId, String type) {
        log.info("Obteniendo vencimientos del tipo {} para el usuario {}", type, userId);
        
        LocalDateTime fromDate = LocalDateTime.now();
        LocalDateTime toDate = fromDate.plusDays(90); // 3 meses para tipos específicos
        
        List<UserDeadline> deadlines;
        
        switch (type.toUpperCase()) {
            case "INSCRIPTION":
                deadlines = loadUserDashboardDataPort.loadInscriptionDeadlines(userId, fromDate, toDate);
                break;
            case "DOCUMENTS":
                deadlines = loadUserDashboardDataPort.loadDocumentDeadlines(userId, fromDate, toDate);
                break;
            case "EXAM":
                deadlines = loadUserDashboardDataPort.loadExamDeadlines(userId, fromDate, toDate);
                break;
            default:
                deadlines = loadUserDashboardDataPort.loadUserDeadlines(userId, fromDate, toDate);
                deadlines = deadlines.stream()
                        .filter(d -> d.getType().getValue().equalsIgnoreCase(type))
                        .collect(Collectors.toList());
        }
        
        return deadlines.stream()
                .map(this::mapToDeadlineResponse)
                .sorted((d1, d2) -> {
                    if (d1.getDeadline() == null && d2.getDeadline() == null) return 0;
                    if (d1.getDeadline() == null) return 1;
                    if (d2.getDeadline() == null) return -1;
                    return d1.getDeadline().compareTo(d2.getDeadline());
                })
                .collect(Collectors.toList());
    }
    
    @Override
    public UserStatsResponse getUserStats(Long userId) {
        log.info("Obteniendo estadísticas completas del usuario {}", userId);

        // Intentar obtener desde cache
        UserDashboardStats cachedStats = cacheService.getUserStats(userId);
        UserDashboardStats stats;

        if (cachedStats != null) {
            log.debug("Estadísticas obtenidas desde cache para usuario {}", userId);
            stats = cachedStats;
        } else {
            // Si no está en cache, cargar desde base de datos
            stats = loadUserDashboardDataPort.loadUserStats(userId);

            // Almacenar en cache
            cacheService.putUserStats(userId, stats);
            log.debug("Estadísticas cargadas desde BD y almacenadas en cache para usuario {}", userId);
        }

        return UserStatsResponse.builder()
                .profileStats(mapToProfileStatsResponse(stats.getProfileStats()))
                .inscriptionStats(mapToInscriptionStatsResponse(stats.getInscriptionStats()))
                .documentStats(mapToDocumentStatsResponse(stats.getDocumentStats()))
                .examStats(mapToExamStatsResponse(stats.getExamStats()))
                .activityStats(mapToActivityStatsResponse(stats.getActivityStats()))
                .build();
    }
    
    @Override
    public UserStatsResponse.ProfileStats getProfileStats(Long userId) {
        log.info("Obteniendo estadísticas del perfil del usuario {}", userId);
        
        UserDashboardStats stats = loadUserDashboardDataPort.loadUserStats(userId);
        return mapToProfileStatsResponse(stats.getProfileStats());
    }
    
    @Override
    public UserStatsResponse.InscriptionStats getInscriptionStats(Long userId) {
        log.info("Obteniendo estadísticas de inscripciones del usuario {}", userId);
        
        UserDashboardStats stats = loadUserDashboardDataPort.loadUserStats(userId);
        return mapToInscriptionStatsResponse(stats.getInscriptionStats());
    }
    
    /**
     * Mapea UserDeadline a UserDeadlineResponse
     */
    private UserDeadlineResponse mapToDeadlineResponse(UserDeadline deadline) {
        return UserDeadlineResponse.builder()
                .id(deadline.getId())
                .type(deadline.getType().getValue())
                .title(deadline.getTitle())
                .description(deadline.getDescription())
                .deadline(deadline.getDeadline())
                .daysRemaining(deadline.getDaysRemaining())
                .priority(deadline.getPriority().getValue())
                .contestId(deadline.getContestId())
                .actionRequired(deadline.getActionRequired())
                .route(deadline.getRoute())
                .isUrgent(deadline.isUrgent())
                .status(deadline.getStatus().getValue())
                .contestTitle(deadline.getContestTitle())
                .contestDepartment(deadline.getContestDepartment())
                .documentType(deadline.getDocumentType())
                .examType(deadline.getExamType())
                .hoursRemaining(deadline.getHoursRemaining())
                .build();
    }
    
    /**
     * Mapea ProfileStats de dominio a DTO
     */
    private UserStatsResponse.ProfileStats mapToProfileStatsResponse(UserDashboardStats.ProfileStats profileStats) {
        if (profileStats == null) {
            return UserStatsResponse.ProfileStats.builder()
                    .completionPercentage(0)
                    .totalFields(0)
                    .completedFields(0)
                    .pendingFields(0)
                    .hasProfileImage(false)
                    .hasBasicInfo(false)
                    .hasContactInfo(false)
                    .hasEducation(false)
                    .hasExperience(false)
                    .build();
        }
        
        return UserStatsResponse.ProfileStats.builder()
                .completionPercentage(profileStats.getCompletionPercentage())
                .totalFields(profileStats.getTotalFields())
                .completedFields(profileStats.getCompletedFields())
                .pendingFields(profileStats.getPendingFields())
                .hasProfileImage(profileStats.getHasProfileImage())
                .hasBasicInfo(profileStats.getHasBasicInfo())
                .hasContactInfo(profileStats.getHasContactInfo())
                .hasEducation(profileStats.getHasEducation())
                .hasExperience(profileStats.getHasExperience())
                .lastUpdated(profileStats.getLastUpdated() != null ? profileStats.getLastUpdated().toString() : null)
                .build();
    }
    
    /**
     * Mapea InscriptionStats de dominio a DTO
     */
    private UserStatsResponse.InscriptionStats mapToInscriptionStatsResponse(UserDashboardStats.InscriptionStats inscriptionStats) {
        if (inscriptionStats == null) {
            return UserStatsResponse.InscriptionStats.builder()
                    .totalInscriptions(0)
                    .activeInscriptions(0)
                    .completedInscriptions(0)
                    .pendingInscriptions(0)
                    .cancelledInscriptions(0)
                    .frozenInscriptions(0)
                    .build();
        }
        
        return UserStatsResponse.InscriptionStats.builder()
                .totalInscriptions(inscriptionStats.getTotalInscriptions())
                .activeInscriptions(inscriptionStats.getActiveInscriptions())
                .completedInscriptions(inscriptionStats.getCompletedInscriptions())
                .pendingInscriptions(inscriptionStats.getPendingInscriptions())
                .cancelledInscriptions(inscriptionStats.getCancelledInscriptions())
                .frozenInscriptions(inscriptionStats.getFrozenInscriptions())
                .byStatus(inscriptionStats.getByStatus())
                .byContest(inscriptionStats.getByContest())
                .build();
    }
    
    /**
     * Mapea DocumentStats de dominio a DTO
     */
    private UserStatsResponse.DocumentStats mapToDocumentStatsResponse(UserDashboardStats.DocumentStats documentStats) {
        if (documentStats == null) {
            return UserStatsResponse.DocumentStats.builder()
                    .totalDocuments(0)
                    .pendingDocuments(0)
                    .approvedDocuments(0)
                    .rejectedDocuments(0)
                    .expiredDocuments(0)
                    .build();
        }
        
        return UserStatsResponse.DocumentStats.builder()
                .totalDocuments(documentStats.getTotalDocuments())
                .pendingDocuments(documentStats.getPendingDocuments())
                .approvedDocuments(documentStats.getApprovedDocuments())
                .rejectedDocuments(documentStats.getRejectedDocuments())
                .expiredDocuments(documentStats.getExpiredDocuments())
                .byType(documentStats.getByType())
                .byStatus(documentStats.getByStatus())
                .build();
    }
    
    /**
     * Mapea ExamStats de dominio a DTO
     */
    private UserStatsResponse.ExamStats mapToExamStatsResponse(UserDashboardStats.ExamStats examStats) {
        if (examStats == null) {
            return UserStatsResponse.ExamStats.builder()
                    .availableExams(0)
                    .completedExams(0)
                    .pendingExams(0)
                    .passedExams(0)
                    .failedExams(0)
                    .averageScore(0.0)
                    .build();
        }
        
        return UserStatsResponse.ExamStats.builder()
                .availableExams(examStats.getAvailableExams())
                .completedExams(examStats.getCompletedExams())
                .pendingExams(examStats.getPendingExams())
                .passedExams(examStats.getPassedExams())
                .failedExams(examStats.getFailedExams())
                .averageScore(examStats.getAverageScore())
                .byStatus(examStats.getByStatus())
                .build();
    }
    
    /**
     * Mapea ActivityStats de dominio a DTO
     */
    private UserStatsResponse.ActivityStats mapToActivityStatsResponse(UserDashboardStats.ActivityStats activityStats) {
        if (activityStats == null) {
            return UserStatsResponse.ActivityStats.builder()
                    .totalLogins(0)
                    .documentsUploaded(0)
                    .profileUpdates(0)
                    .contestsViewed(0)
                    .daysActive(0)
                    .build();
        }
        
        return UserStatsResponse.ActivityStats.builder()
                .totalLogins(activityStats.getTotalLogins())
                .lastLogin(activityStats.getLastLogin() != null ? activityStats.getLastLogin().toString() : null)
                .documentsUploaded(activityStats.getDocumentsUploaded())
                .profileUpdates(activityStats.getProfileUpdates())
                .contestsViewed(activityStats.getContestsViewed())
                .accountCreated(activityStats.getAccountCreated() != null ? activityStats.getAccountCreated().toString() : null)
                .daysActive(activityStats.getDaysActive())
                .build();
    }
}
