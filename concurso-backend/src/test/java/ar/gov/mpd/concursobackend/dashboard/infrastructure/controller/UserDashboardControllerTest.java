package ar.gov.mpd.concursobackend.dashboard.infrastructure.controller;

import ar.gov.mpd.concursobackend.dashboard.application.service.UserDashboardService;
import ar.gov.mpd.concursobackend.dashboard.domain.UserDeadline;
import ar.gov.mpd.concursobackend.dashboard.domain.UserDashboardStats;
import ar.gov.mpd.concursobackend.shared.application.service.SecurityService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Test unitario para UserDashboardController
 */
@WebMvcTest(UserDashboardController.class)
class UserDashboardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserDashboardService userDashboardService;

    @MockBean
    private SecurityService securityService;

    @Autowired
    private ObjectMapper objectMapper;

    private UserDeadline mockDeadline;
    private UserDashboardStats mockStats;

    @BeforeEach
    void setUp() {
        // Mock deadline
        mockDeadline = UserDeadline.builder()
                .id("test-deadline-1")
                .userId(1L)
                .type(UserDeadline.DeadlineType.INSCRIPTION)
                .title("Test Inscription Deadline")
                .description("Test description")
                .deadline(LocalDateTime.now().plusDays(5))
                .contestId("test-contest-1")
                .contestTitle("Test Contest")
                .contestDepartment("Test Department")
                .actionRequired("Complete inscription")
                .route("/test/route")
                .status(UserDeadline.DeadlineStatus.ACTIVE)
                .build();
        mockDeadline.setPriority(mockDeadline.calculatePriority());

        // Mock stats
        mockStats = UserDashboardStats.builder()
                .profileStats(UserDashboardStats.ProfileStats.builder()
                        .completionPercentage(75)
                        .totalFields(8)
                        .completedFields(6)
                        .pendingFields(2)
                        .hasProfileImage(false)
                        .hasBasicInfo(true)
                        .hasContactInfo(true)
                        .hasEducation(true)
                        .hasExperience(false)
                        .lastUpdated(LocalDateTime.now())
                        .build())
                .inscriptionStats(UserDashboardStats.InscriptionStats.builder()
                        .totalInscriptions(3)
                        .activeInscriptions(2)
                        .completedInscriptions(1)
                        .pendingInscriptions(0)
                        .cancelledInscriptions(0)
                        .frozenInscriptions(0)
                        .byStatus(new HashMap<>())
                        .byContest(new HashMap<>())
                        .build())
                .documentStats(UserDashboardStats.DocumentStats.builder()
                        .totalDocuments(5)
                        .pendingDocuments(2)
                        .approvedDocuments(3)
                        .rejectedDocuments(0)
                        .expiredDocuments(0)
                        .byStatus(new HashMap<>())
                        .byType(new HashMap<>())
                        .build())
                .examStats(UserDashboardStats.ExamStats.builder()
                        .availableExams(0)
                        .completedExams(0)
                        .pendingExams(0)
                        .passedExams(0)
                        .failedExams(0)
                        .averageScore(0.0)
                        .byStatus(new HashMap<>())
                        .build())
                .activityStats(UserDashboardStats.ActivityStats.builder()
                        .totalLogins(10)
                        .lastLogin(LocalDateTime.now().minusHours(2))
                        .documentsUploaded(5)
                        .profileUpdates(3)
                        .contestsViewed(8)
                        .accountCreated(LocalDateTime.now().minusDays(30))
                        .daysActive(25)
                        .build())
                .build();

        // Mock SecurityService
        when(securityService.getCurrentUserId()).thenReturn(UUID.randomUUID());
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void getUserDeadlines_ShouldReturnDeadlines() throws Exception {
        // Given
        List<UserDeadline> deadlines = Arrays.asList(mockDeadline);
        when(userDashboardService.getUserDeadlines(anyLong(), any(), any())).thenReturn(deadlines);

        // When & Then
        mockMvc.perform(get("/api/dashboard/user/deadlines")
                        .param("daysAhead", "30")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].id").value("test-deadline-1"))
                .andExpect(jsonPath("$[0].type").value("INSCRIPTION"))
                .andExpect(jsonPath("$[0].title").value("Test Inscription Deadline"))
                .andExpect(jsonPath("$[0].contestId").value("test-contest-1"));
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void getUrgentDeadlines_ShouldReturnUrgentDeadlines() throws Exception {
        // Given
        List<UserDeadline> urgentDeadlines = Arrays.asList(mockDeadline);
        when(userDashboardService.getUrgentDeadlines(anyLong())).thenReturn(urgentDeadlines);

        // When & Then
        mockMvc.perform(get("/api/dashboard/user/deadlines/urgent")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].id").value("test-deadline-1"));
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void getDeadlinesByType_ShouldReturnDeadlinesByType() throws Exception {
        // Given
        List<UserDeadline> deadlines = Arrays.asList(mockDeadline);
        when(userDashboardService.getDeadlinesByType(anyLong(), any())).thenReturn(deadlines);

        // When & Then
        mockMvc.perform(get("/api/dashboard/user/deadlines/type/INSCRIPTION")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].type").value("INSCRIPTION"));
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void getUserStats_ShouldReturnCompleteStats() throws Exception {
        // Given
        when(userDashboardService.getUserStats(anyLong())).thenReturn(mockStats);

        // When & Then
        mockMvc.perform(get("/api/dashboard/user/stats")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.profileStats.completionPercentage").value(75))
                .andExpect(jsonPath("$.inscriptionStats.totalInscriptions").value(3))
                .andExpect(jsonPath("$.documentStats.totalDocuments").value(5))
                .andExpect(jsonPath("$.activityStats.totalLogins").value(10));
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void getProfileStats_ShouldReturnProfileStats() throws Exception {
        // Given
        when(userDashboardService.getProfileStats(anyLong())).thenReturn(mockStats.getProfileStats());

        // When & Then
        mockMvc.perform(get("/api/dashboard/user/stats/profile")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.completionPercentage").value(75))
                .andExpect(jsonPath("$.totalFields").value(8))
                .andExpect(jsonPath("$.completedFields").value(6))
                .andExpect(jsonPath("$.hasBasicInfo").value(true))
                .andExpect(jsonPath("$.hasEducation").value(true));
    }

    @Test
    @WithMockUser(username = "testuser", roles = {"USER"})
    void getInscriptionStats_ShouldReturnInscriptionStats() throws Exception {
        // Given
        when(userDashboardService.getInscriptionStats(anyLong())).thenReturn(mockStats.getInscriptionStats());

        // When & Then
        mockMvc.perform(get("/api/dashboard/user/stats/inscriptions")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.totalInscriptions").value(3))
                .andExpect(jsonPath("$.activeInscriptions").value(2))
                .andExpect(jsonPath("$.completedInscriptions").value(1));
    }

    @Test
    void getUserDeadlines_WithoutAuthentication_ShouldReturn401() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/dashboard/user/deadlines")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getUserStats_WithoutAuthentication_ShouldReturn401() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/dashboard/user/stats")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }
}
