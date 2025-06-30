package ar.gov.mpd.concursobackend.education.unit;

import ar.gov.mpd.concursobackend.education.application.dto.EducationRequestDto;
import ar.gov.mpd.concursobackend.education.application.validation.EducationTypeValidator;
import ar.gov.mpd.concursobackend.education.application.validation.EducationStatusValidator;
import ar.gov.mpd.concursobackend.education.application.validation.ScientificActivityTypeValidator;
import ar.gov.mpd.concursobackend.education.application.validation.ScientificActivityRoleValidator;
import ar.gov.mpd.concursobackend.education.domain.model.EducationType;
import ar.gov.mpd.concursobackend.education.domain.model.EducationStatus;
import ar.gov.mpd.concursobackend.education.domain.model.ScientificActivityType;
import ar.gov.mpd.concursobackend.education.domain.model.ScientificActivityRole;
import jakarta.validation.ConstraintValidatorContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

/**
 * Unit tests for Education validation system
 * Tests the new enum-based validators and business rules
 */
@ExtendWith(MockitoExtension.class)
class EducationValidationTest {

    @Mock
    private ConstraintValidatorContext context;

    @Mock
    private ConstraintValidatorContext.ConstraintViolationBuilder violationBuilder;

    private EducationTypeValidator educationTypeValidator;
    private EducationStatusValidator educationStatusValidator;
    private ScientificActivityTypeValidator scientificActivityTypeValidator;
    private ScientificActivityRoleValidator scientificActivityRoleValidator;

    @BeforeEach
    void setUp() {
        educationTypeValidator = new EducationTypeValidator();
        educationStatusValidator = new EducationStatusValidator();
        scientificActivityTypeValidator = new ScientificActivityTypeValidator();
        scientificActivityRoleValidator = new ScientificActivityRoleValidator();

        // Mock context behavior
        when(context.buildConstraintViolationWithTemplate(anyString())).thenReturn(violationBuilder);
        when(violationBuilder.addConstraintViolation()).thenReturn(context);
    }

    @Test
    @DisplayName("Should validate correct education types")
    void shouldValidateCorrectEducationTypes() {
        // Test all valid education types
        for (EducationType type : EducationType.values()) {
            boolean isValid = educationTypeValidator.isValid(type.getDisplayName(), context);
            assertThat(isValid).isTrue();
        }
    }

    @Test
    @DisplayName("Should reject invalid education types")
    void shouldRejectInvalidEducationTypes() {
        // Test invalid education types
        String[] invalidTypes = {
            "Invalid Type",
            "Carrera Inexistente",
            "",
            "   ",
            "INVALID_ENUM_VALUE"
        };

        for (String invalidType : invalidTypes) {
            boolean isValid = educationTypeValidator.isValid(invalidType, context);
            assertThat(isValid).isFalse();
        }
    }

    @Test
    @DisplayName("Should validate correct education statuses")
    void shouldValidateCorrectEducationStatuses() {
        // Test all valid education statuses
        for (EducationStatus status : EducationStatus.values()) {
            boolean isValid = educationStatusValidator.isValid(status.getDisplayName(), context);
            assertThat(isValid).isTrue();
        }
    }

    @Test
    @DisplayName("Should reject invalid education statuses")
    void shouldRejectInvalidEducationStatuses() {
        // Test invalid education statuses
        String[] invalidStatuses = {
            "Invalid Status",
            "Estado Inexistente",
            "",
            "   ",
            "INVALID_STATUS"
        };

        for (String invalidStatus : invalidStatuses) {
            boolean isValid = educationStatusValidator.isValid(invalidStatus, context);
            assertThat(isValid).isFalse();
        }
    }

    @Test
    @DisplayName("Should validate correct scientific activity types")
    void shouldValidateCorrectScientificActivityTypes() {
        // Test all valid scientific activity types
        for (ScientificActivityType type : ScientificActivityType.values()) {
            boolean isValid = scientificActivityTypeValidator.isValid(type.getDisplayName(), context);
            assertThat(isValid).isTrue();
        }
    }

    @Test
    @DisplayName("Should validate correct scientific activity roles")
    void shouldValidateCorrectScientificActivityRoles() {
        // Test all valid scientific activity roles
        for (ScientificActivityRole role : ScientificActivityRole.values()) {
            boolean isValid = scientificActivityRoleValidator.isValid(role.getDisplayName(), context);
            assertThat(isValid).isTrue();
        }
    }

    @Test
    @DisplayName("Should validate corrected role values according to business rules")
    void shouldValidateCorrectedRoleValues() {
        // Test the corrected role values according to business rules
        String assistantParticipant = ScientificActivityRole.ASSISTANT_PARTICIPANT.getDisplayName();
        String authorSpeaker = ScientificActivityRole.AUTHOR_SPEAKER_PANELIST_PRESENTER.getDisplayName();

        assertThat(scientificActivityRoleValidator.isValid(assistantParticipant, context)).isTrue();
        assertThat(scientificActivityRoleValidator.isValid(authorSpeaker, context)).isTrue();

        // Verify the display names match business requirements
        assertThat(assistantParticipant).isEqualTo("ayudante-participante");
        assertThat(authorSpeaker).isEqualTo("autor-disertante-panelista-exponente");
    }

    @Test
    @DisplayName("Should create valid EducationRequestDto for undergraduate career")
    void shouldCreateValidUndergraduateCareerDto() {
        // Given: Valid undergraduate career data according to corrected business rules
        EducationRequestDto dto = EducationRequestDto.builder()
                .type(EducationType.UNDERGRADUATE_CAREER.getDisplayName())
                .status(EducationStatus.COMPLETED.getDisplayName())
                .title("Licenciatura en Sistemas de Información")
                .institution("Universidad Nacional de Córdoba")
                .startDate(LocalDate.of(2018, 3, 1)) // Added according to corrected business rules
                .issueDate(LocalDate.of(2023, 7, 20))
                .durationYears(5) // Required according to business rules
                .average(7.8) // Required according to business rules
                .build();

        // Then: All validations should pass
        assertThat(educationTypeValidator.isValid(dto.getType(), context)).isTrue();
        assertThat(educationStatusValidator.isValid(dto.getStatus(), context)).isTrue();
        assertThat(dto.getTitle()).isNotBlank();
        assertThat(dto.getInstitution()).isNotBlank();
        assertThat(dto.getStartDate()).isNotNull();
        assertThat(dto.getIssueDate()).isNotNull();
        assertThat(dto.getDurationYears()).isPositive();
        assertThat(dto.getAverage()).isNotNegative();
    }

    @Test
    @DisplayName("Should create valid EducationRequestDto for scientific activity with comments")
    void shouldCreateValidScientificActivityDto() {
        // Given: Valid scientific activity data with corrected fields
        EducationRequestDto dto = EducationRequestDto.builder()
                .type(EducationType.SCIENTIFIC_ACTIVITY.getDisplayName())
                .status(EducationStatus.COMPLETED.getDisplayName())
                .title("Investigación en Inteligencia Artificial")
                .institution("CONICET")
                .startDate(LocalDate.of(2023, 1, 15))
                .issueDate(LocalDate.of(2023, 11, 30))
                .activityType(ScientificActivityType.RESEARCH.getDisplayName())
                .topic("Machine Learning aplicado a sistemas de recomendación")
                .activityRole(ScientificActivityRole.AUTHOR_SPEAKER_PANELIST_PRESENTER.getDisplayName())
                .expositionPlaceDate("Universidad de Buenos Aires, Noviembre 2023")
                .comments("Investigación realizada en colaboración con el equipo de IA del CONICET") // Added field
                .build();

        // Then: All validations should pass
        assertThat(educationTypeValidator.isValid(dto.getType(), context)).isTrue();
        assertThat(educationStatusValidator.isValid(dto.getStatus(), context)).isTrue();
        assertThat(scientificActivityTypeValidator.isValid(dto.getActivityType(), context)).isTrue();
        assertThat(scientificActivityRoleValidator.isValid(dto.getActivityRole(), context)).isTrue();
        assertThat(dto.getComments()).isNotNull(); // Verify comments field is present
        assertThat(dto.getComments()).isNotBlank();
    }

    @Test
    @DisplayName("Should create valid EducationRequestDto for training course")
    void shouldCreateValidTrainingCourseDto() {
        // Given: Valid training course data
        EducationRequestDto dto = EducationRequestDto.builder()
                .type(EducationType.TRAINING_COURSE.getDisplayName())
                .status(EducationStatus.COMPLETED.getDisplayName())
                .title("Curso Avanzado de Spring Boot")
                .institution("Educación IT")
                .startDate(LocalDate.of(2023, 6, 1))
                .issueDate(LocalDate.of(2023, 8, 15))
                .hourlyLoad(120)
                .hadFinalEvaluation(true)
                .build();

        // Then: All validations should pass
        assertThat(educationTypeValidator.isValid(dto.getType(), context)).isTrue();
        assertThat(educationStatusValidator.isValid(dto.getStatus(), context)).isTrue();
        assertThat(dto.getHourlyLoad()).isPositive();
        assertThat(dto.getHadFinalEvaluation()).isNotNull();
    }

    @Test
    @DisplayName("Should test enum mapping consistency between domain and persistence")
    void shouldTestEnumMappingConsistency() {
        // Test that all domain enum values have corresponding persistence mappings
        for (EducationType domainType : EducationType.values()) {
            // Verify that getPersistenceType() doesn't throw exception
            assertThat(domainType.getPersistenceType()).isNotNull();
            
            // Verify bidirectional mapping
            EducationType mappedBack = EducationType.fromPersistenceType(domainType.getPersistenceType());
            assertThat(mappedBack).isEqualTo(domainType);
        }

        for (EducationStatus domainStatus : EducationStatus.values()) {
            // Verify that getPersistenceStatus() doesn't throw exception
            assertThat(domainStatus.getPersistenceStatus()).isNotNull();
            
            // Verify bidirectional mapping
            EducationStatus mappedBack = EducationStatus.fromPersistenceStatus(domainStatus.getPersistenceStatus());
            assertThat(mappedBack).isEqualTo(domainStatus);
        }
    }
}
