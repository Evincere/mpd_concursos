package ar.gov.mpd.concursobackend.education.integration;

import ar.gov.mpd.concursobackend.education.application.dto.EducationRequestDto;
import ar.gov.mpd.concursobackend.education.application.dto.EducationResponseDto;
import ar.gov.mpd.concursobackend.education.domain.model.EducationType;
import ar.gov.mpd.concursobackend.education.domain.model.EducationStatus;
import ar.gov.mpd.concursobackend.education.domain.model.ScientificActivityType;
import ar.gov.mpd.concursobackend.education.domain.model.ScientificActivityRole;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import java.time.LocalDate;
import java.util.UUID;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for Education system
 * Tests complete flow: validation, persistence, retrieval
 */
@SpringBootTest
@AutoConfigureWebMvc
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
@Transactional
class EducationIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private ObjectMapper objectMapper;

    private MockMvc mockMvc;
    private UUID testUserId;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();
        
        testUserId = UUID.randomUUID();
    }

    @Test
    @DisplayName("Should create and retrieve Higher Education Career record")
    @WithMockUser(roles = "USER")
    void shouldCreateAndRetrieveHigherEducationCareer() throws Exception {
        // Given: Higher Education Career data according to business rules
        EducationRequestDto request = EducationRequestDto.builder()
                .type(EducationType.HIGHER_EDUCATION_CAREER.getDisplayName())
                .status(EducationStatus.COMPLETED.getDisplayName())
                .title("Técnico Superior en Programación")
                .institution("Instituto Tecnológico Superior")
                .startDate(LocalDate.of(2020, 3, 1))
                .issueDate(LocalDate.of(2023, 12, 15))
                .durationYears(3)
                .average(8.5)
                .build();

        // When: Creating education record
        String response = mockMvc.perform(post("/api/cv/education")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.type").value(EducationType.HIGHER_EDUCATION_CAREER.getDisplayName()))
                .andExpect(jsonPath("$.status").value(EducationStatus.COMPLETED.getDisplayName()))
                .andExpect(jsonPath("$.title").value("Técnico Superior en Programación"))
                .andExpect(jsonPath("$.institution").value("Instituto Tecnológico Superior"))
                .andExpect(jsonPath("$.durationYears").value(3))
                .andExpect(jsonPath("$.average").value(8.5))
                .andReturn().getResponse().getContentAsString();

        EducationResponseDto created = objectMapper.readValue(response, EducationResponseDto.class);

        // Then: Should retrieve the created record
        mockMvc.perform(get("/api/cv/education/" + created.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(created.getId().toString()))
                .andExpect(jsonPath("$.type").value(EducationType.HIGHER_EDUCATION_CAREER.getDisplayName()))
                .andExpect(jsonPath("$.title").value("Técnico Superior en Programación"));
    }

    @Test
    @DisplayName("Should create and retrieve Undergraduate Career record")
    @WithMockUser(roles = "USER")
    void shouldCreateAndRetrieveUndergraduateCareer() throws Exception {
        // Given: Undergraduate Career data according to business rules
        EducationRequestDto request = EducationRequestDto.builder()
                .type(EducationType.UNDERGRADUATE_CAREER.getDisplayName())
                .status(EducationStatus.COMPLETED.getDisplayName())
                .title("Licenciatura en Sistemas de Información")
                .institution("Universidad Nacional de Córdoba")
                .startDate(LocalDate.of(2018, 3, 1)) // Added according to corrected business rules
                .issueDate(LocalDate.of(2023, 7, 20))
                .durationYears(5)
                .average(7.8)
                .build();

        // When & Then: Creating and validating
        mockMvc.perform(post("/api/cv/education")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.type").value(EducationType.UNDERGRADUATE_CAREER.getDisplayName()))
                .andExpect(jsonPath("$.startDate").value("2018-03-01"))
                .andExpect(jsonPath("$.durationYears").value(5))
                .andExpect(jsonPath("$.average").value(7.8));
    }

    @Test
    @DisplayName("Should create and retrieve Postgraduate Specialization record")
    @WithMockUser(roles = "USER")
    void shouldCreateAndRetrievePostgraduateSpecialization() throws Exception {
        // Given: Postgraduate Specialization data according to business rules
        EducationRequestDto request = EducationRequestDto.builder()
                .type(EducationType.POSTGRADUATE_SPECIALIZATION.getDisplayName())
                .status(EducationStatus.COMPLETED.getDisplayName())
                .title("Especialización en Desarrollo de Software")
                .institution("Universidad Tecnológica Nacional")
                .startDate(LocalDate.of(2023, 4, 1))
                .issueDate(LocalDate.of(2024, 11, 30))
                .thesisTopic("Arquitecturas de Microservicios en Aplicaciones Empresariales")
                .build();

        // When & Then: Creating and validating
        mockMvc.perform(post("/api/cv/education")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.type").value(EducationType.POSTGRADUATE_SPECIALIZATION.getDisplayName()))
                .andExpect(jsonPath("$.thesisTopic").value("Arquitecturas de Microservicios en Aplicaciones Empresariales"));
    }

    @Test
    @DisplayName("Should create and retrieve Diploma record")
    @WithMockUser(roles = "USER")
    void shouldCreateAndRetrieveDiploma() throws Exception {
        // Given: Diploma data according to business rules
        EducationRequestDto request = EducationRequestDto.builder()
                .type(EducationType.DIPLOMA.getDisplayName())
                .status(EducationStatus.COMPLETED.getDisplayName())
                .title("Diplomatura en Gestión de Proyectos")
                .institution("Universidad Católica de Córdoba")
                .startDate(LocalDate.of(2024, 2, 1))
                .issueDate(LocalDate.of(2024, 8, 15))
                .hourlyLoad(120)
                .hadFinalEvaluation(true)
                .build();

        // When & Then: Creating and validating
        mockMvc.perform(post("/api/cv/education")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.type").value(EducationType.DIPLOMA.getDisplayName()))
                .andExpect(jsonPath("$.hourlyLoad").value(120))
                .andExpect(jsonPath("$.hadFinalEvaluation").value(true));
    }

    @Test
    @DisplayName("Should create and retrieve Training Course record")
    @WithMockUser(roles = "USER")
    void shouldCreateAndRetrieveTrainingCourse() throws Exception {
        // Given: Training Course data according to business rules
        EducationRequestDto request = EducationRequestDto.builder()
                .type(EducationType.TRAINING_COURSE.getDisplayName())
                .status(EducationStatus.COMPLETED.getDisplayName())
                .title("Curso de Spring Boot Avanzado")
                .institution("Educación IT")
                .startDate(LocalDate.of(2024, 5, 1))
                .issueDate(LocalDate.of(2024, 6, 30))
                .hourlyLoad(40)
                .hadFinalEvaluation(false)
                .build();

        // When & Then: Creating and validating
        mockMvc.perform(post("/api/cv/education")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.type").value(EducationType.TRAINING_COURSE.getDisplayName()))
                .andExpect(jsonPath("$.hourlyLoad").value(40))
                .andExpect(jsonPath("$.hadFinalEvaluation").value(false));
    }

    @Test
    @DisplayName("Should validate education type using new enum validator")
    @WithMockUser(roles = "USER")
    void shouldValidateEducationTypeWithNewEnumValidator() throws Exception {
        // Given: Invalid education type
        EducationRequestDto request = EducationRequestDto.builder()
                .type("Tipo de Educación Inválido")
                .status(EducationStatus.COMPLETED.getDisplayName())
                .title("Test Title")
                .institution("Test Institution")
                .build();

        // When & Then: Should return validation error with dynamic message
        mockMvc.perform(post("/api/cv/education")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Invalid education type")))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Valid values:")));
    }

    @Test
    @DisplayName("Should validate education status using new enum validator")
    @WithMockUser(roles = "USER")
    void shouldValidateEducationStatusWithNewEnumValidator() throws Exception {
        // Given: Invalid education status
        EducationRequestDto request = EducationRequestDto.builder()
                .type(EducationType.UNDERGRADUATE_CAREER.getDisplayName())
                .status("Estado Inválido")
                .title("Test Title")
                .institution("Test Institution")
                .build();

        // When & Then: Should return validation error with dynamic message
        mockMvc.perform(post("/api/cv/education")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Invalid education status")))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Valid values:")));
    }

    @Test
    @DisplayName("Should create Scientific Activity with comments field")
    @WithMockUser(roles = "USER")
    void shouldCreateScientificActivityWithComments() throws Exception {
        // Given: Scientific Activity with comments (new field added in corrections)
        EducationRequestDto request = EducationRequestDto.builder()
                .type(EducationType.SCIENTIFIC_ACTIVITY.getDisplayName())
                .status(EducationStatus.COMPLETED.getDisplayName())
                .title("Investigación en Machine Learning")
                .institution("CONICET")
                .activityType(ScientificActivityType.RESEARCH.getDisplayName())
                .topic("Algoritmos de aprendizaje automático para análisis de datos")
                .activityRole(ScientificActivityRole.AUTHOR_SPEAKER_PANELIST_PRESENTER.getDisplayName())
                .expositionPlaceDate("Universidad Nacional de Córdoba, Octubre 2023")
                .comments("Investigación realizada en colaboración con el equipo de IA. Resultados publicados en revista indexada.")
                .build();

        // When & Then: Should create successfully with comments
        mockMvc.perform(post("/api/cv/education")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.type").value(EducationType.SCIENTIFIC_ACTIVITY.getDisplayName()))
                .andExpect(jsonPath("$.activityType").value(ScientificActivityType.RESEARCH.getDisplayName()))
                .andExpect(jsonPath("$.activityRole").value(ScientificActivityRole.AUTHOR_SPEAKER_PANELIST_PRESENTER.getDisplayName()))
                .andExpect(jsonPath("$.comments").value("Investigación realizada en colaboración con el equipo de IA. Resultados publicados en revista indexada."));
    }

    @Test
    @DisplayName("Should validate scientific activity role with corrected enum values")
    @WithMockUser(roles = "USER")
    void shouldValidateScientificActivityRoleWithCorrectedEnumValues() throws Exception {
        // Given: Invalid scientific activity role
        EducationRequestDto request = EducationRequestDto.builder()
                .type(EducationType.SCIENTIFIC_ACTIVITY.getDisplayName())
                .status(EducationStatus.COMPLETED.getDisplayName())
                .title("Test Research")
                .institution("Test Institution")
                .activityType(ScientificActivityType.RESEARCH.getDisplayName())
                .activityRole("Rol Científico Inválido")
                .build();

        // When & Then: Should return validation error
        mockMvc.perform(post("/api/cv/education")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Invalid scientific activity role")));
    }

    @Test
    @DisplayName("Should create Undergraduate Career with corrected dynamic fields")
    @WithMockUser(roles = "USER")
    void shouldCreateUndergraduateCareerWithCorrectedDynamicFields() throws Exception {
        // Given: Undergraduate Career with corrected fields (startDate now included for completed)
        EducationRequestDto request = EducationRequestDto.builder()
                .type(EducationType.UNDERGRADUATE_CAREER.getDisplayName())
                .status(EducationStatus.COMPLETED.getDisplayName())
                .title("Ingeniería en Sistemas")
                .institution("Universidad Tecnológica Nacional")
                .startDate(LocalDate.of(2017, 3, 1)) // Now required according to corrected business rules
                .issueDate(LocalDate.of(2022, 12, 20))
                .durationYears(5) // Now required
                .average(8.2) // Now required
                .build();

        // When & Then: Should create successfully with all required fields
        mockMvc.perform(post("/api/cv/education")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.type").value(EducationType.UNDERGRADUATE_CAREER.getDisplayName()))
                .andExpect(jsonPath("$.startDate").value("2017-03-01"))
                .andExpect(jsonPath("$.issueDate").value("2022-12-20"))
                .andExpect(jsonPath("$.durationYears").value(5))
                .andExpect(jsonPath("$.average").value(8.2));
    }

    @Test
    @DisplayName("Should test unified enum mapping between domain and persistence")
    @WithMockUser(roles = "USER")
    void shouldTestUnifiedEnumMapping() throws Exception {
        // Given: Education record that tests the unified enum mapping
        EducationRequestDto request = EducationRequestDto.builder()
                .type(EducationType.DIPLOMA.getDisplayName())
                .status(EducationStatus.IN_PROGRESS.getDisplayName())
                .title("Diplomatura en Gestión de Proyectos")
                .institution("Universidad Empresarial Siglo 21")
                .hourlyLoad(180)
                .hadFinalEvaluation(false)
                .build();

        // When: Creating and retrieving
        String response = mockMvc.perform(post("/api/cv/education")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        EducationResponseDto created = objectMapper.readValue(response, EducationResponseDto.class);

        // Then: Should retrieve with correct enum mapping
        mockMvc.perform(get("/api/cv/education/" + created.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.type").value(EducationType.DIPLOMA.getDisplayName()))
                .andExpect(jsonPath("$.status").value(EducationStatus.IN_PROGRESS.getDisplayName()));
    }

    @Test
    @DisplayName("Should validate all education types are supported")
    @WithMockUser(roles = "USER")
    void shouldValidateAllEducationTypesAreSupported() throws Exception {
        // Test each education type to ensure unified enum mapping works
        EducationType[] allTypes = EducationType.values();

        for (EducationType type : allTypes) {
            EducationRequestDto request = EducationRequestDto.builder()
                    .type(type.getDisplayName())
                    .status(EducationStatus.COMPLETED.getDisplayName())
                    .title("Test " + type.name())
                    .institution("Test Institution")
                    .build();

            // Should not return validation errors for any valid type
            mockMvc.perform(post("/api/cv/education")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.type").value(type.getDisplayName()));
        }
    }
}
