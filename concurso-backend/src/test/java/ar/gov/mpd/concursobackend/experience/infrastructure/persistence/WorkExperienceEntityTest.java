package ar.gov.mpd.concursobackend.experience.infrastructure.persistence;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import ar.gov.mpd.concursobackend.auth.infrastructure.database.entities.UserEntity;
import ar.gov.mpd.concursobackend.experience.infrastructure.persistence.WorkExperienceEntity.VerificationStatus;

/**
 * Unit tests for WorkExperienceEntity
 * Tests entity validation, lifecycle events, and business logic
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("WorkExperienceEntity Tests")
class WorkExperienceEntityTest {

    private WorkExperienceEntity workExperience;
    private UserEntity testUser;

    @BeforeEach
    void setUp() {
        testUser = createTestUser();
        workExperience = createValidWorkExperience();
    }

    @Test
    @DisplayName("Should create work experience with valid data")
    void createWorkExperience_withValidData_shouldSucceed() {
        // Given - valid work experience data (set up in @BeforeEach)
        
        // When - creating the entity
        WorkExperienceEntity entity = WorkExperienceEntity.builder()
                .user(testUser)
                .companyName("TechCorp Inc.")
                .positionTitle("Senior Developer")
                .startDate(LocalDate.of(2022, 1, 15))
                .endDate(LocalDate.of(2023, 12, 31))
                .jobDescription("Developed enterprise applications using Spring Boot")
                .keyAchievements("Led team of 5 developers, improved performance by 40%")
                .technologiesUsed("Java, Spring Boot, MySQL, Docker")
                .location("Buenos Aires, Argentina")
                .isCurrentPosition(false)
                .verificationStatus(VerificationStatus.PENDING)
                .build();

        // Then - entity should be created with correct values
        assertThat(entity).isNotNull();
        assertThat(entity.getCompanyName()).isEqualTo("TechCorp Inc.");
        assertThat(entity.getPositionTitle()).isEqualTo("Senior Developer");
        assertThat(entity.getStartDate()).isEqualTo(LocalDate.of(2022, 1, 15));
        assertThat(entity.getEndDate()).isEqualTo(LocalDate.of(2023, 12, 31));
        assertThat(entity.getJobDescription()).isEqualTo("Developed enterprise applications using Spring Boot");
        assertThat(entity.getKeyAchievements()).isEqualTo("Led team of 5 developers, improved performance by 40%");
        assertThat(entity.getTechnologiesUsed()).isEqualTo("Java, Spring Boot, MySQL, Docker");
        assertThat(entity.getLocation()).isEqualTo("Buenos Aires, Argentina");
        assertThat(entity.getIsCurrentPosition()).isFalse();
        assertThat(entity.getVerificationStatus()).isEqualTo(VerificationStatus.PENDING);
        assertThat(entity.getIsDeleted()).isFalse(); // Default value
    }

    @Test
    @DisplayName("Should set default values on creation")
    void onCreate_shouldSetDefaultValues() {
        // Given - work experience without explicit defaults
        WorkExperienceEntity entity = WorkExperienceEntity.builder()
                .user(testUser)
                .companyName("Test Company")
                .positionTitle("Test Position")
                .startDate(LocalDate.now())
                .build();

        // When - calling @PrePersist lifecycle method
        entity.onCreate();

        // Then - default values should be set
        assertThat(entity.getCreatedAt()).isNotNull();
        assertThat(entity.getUpdatedAt()).isNotNull();
        assertThat(entity.getCreatedAt()).isEqualTo(entity.getUpdatedAt());
        assertThat(entity.getVerificationStatus()).isEqualTo(VerificationStatus.PENDING);
        assertThat(entity.getIsCurrentPosition()).isFalse();
        assertThat(entity.getIsDeleted()).isFalse();
    }

    @Test
    @DisplayName("Should update timestamp on update")
    void onUpdate_shouldUpdateTimestamp() {
        // Given - existing work experience with creation time
        LocalDateTime originalCreatedAt = LocalDateTime.now().minusHours(1);
        LocalDateTime originalUpdatedAt = LocalDateTime.now().minusHours(1);
        
        workExperience.setCreatedAt(originalCreatedAt);
        workExperience.setUpdatedAt(originalUpdatedAt);

        // When - calling @PreUpdate lifecycle method
        workExperience.onUpdate();

        // Then - only updatedAt should change
        assertThat(workExperience.getCreatedAt()).isEqualTo(originalCreatedAt);
        assertThat(workExperience.getUpdatedAt()).isAfter(originalUpdatedAt);
        assertThat(workExperience.getUpdatedAt()).isAfter(workExperience.getCreatedAt());
    }

    @Test
    @DisplayName("Should handle soft delete fields correctly")
    void softDelete_shouldSetDeletionFields() {
        // Given - active work experience
        assertThat(workExperience.getIsDeleted()).isFalse();
        assertThat(workExperience.getDeletedAt()).isNull();
        assertThat(workExperience.getDeletedBy()).isNull();

        // When - performing soft delete
        LocalDateTime deletionTime = LocalDateTime.now();
        UUID deletedByUserId = UUID.randomUUID();
        
        workExperience.setIsDeleted(true);
        workExperience.setDeletedAt(deletionTime);
        workExperience.setDeletedBy(deletedByUserId);

        // Then - soft delete fields should be set correctly
        assertThat(workExperience.getIsDeleted()).isTrue();
        assertThat(workExperience.getDeletedAt()).isEqualTo(deletionTime);
        assertThat(workExperience.getDeletedBy()).isEqualTo(deletedByUserId);
    }

    @Test
    @DisplayName("Should handle current position flag correctly")
    void currentPosition_shouldHandleCorrectly() {
        // Given - work experience with no end date (current position)
        WorkExperienceEntity currentPosition = WorkExperienceEntity.builder()
                .user(testUser)
                .companyName("Current Company")
                .positionTitle("Current Position")
                .startDate(LocalDate.now().minusYears(1))
                .endDate(null) // No end date = current position
                .isCurrentPosition(true)
                .build();

        // Then - should be marked as current position
        assertThat(currentPosition.getIsCurrentPosition()).isTrue();
        assertThat(currentPosition.getEndDate()).isNull();

        // When - setting end date (leaving position)
        currentPosition.setEndDate(LocalDate.now());
        currentPosition.setIsCurrentPosition(false);

        // Then - should no longer be current position
        assertThat(currentPosition.getIsCurrentPosition()).isFalse();
        assertThat(currentPosition.getEndDate()).isNotNull();
    }

    @Test
    @DisplayName("Should handle verification status transitions")
    void verificationStatus_shouldHandleTransitions() {
        // Given - work experience with pending verification
        assertThat(workExperience.getVerificationStatus()).isEqualTo(VerificationStatus.PENDING);

        // When - verifying the experience
        workExperience.setVerificationStatus(VerificationStatus.VERIFIED);
        workExperience.setVerificationNotes("Verified by HR department");

        // Then - status should be updated
        assertThat(workExperience.getVerificationStatus()).isEqualTo(VerificationStatus.VERIFIED);
        assertThat(workExperience.getVerificationNotes()).isEqualTo("Verified by HR department");

        // When - rejecting the experience
        workExperience.setVerificationStatus(VerificationStatus.REJECTED);
        workExperience.setVerificationNotes("Invalid employment dates");

        // Then - status should be rejected
        assertThat(workExperience.getVerificationStatus()).isEqualTo(VerificationStatus.REJECTED);
        assertThat(workExperience.getVerificationNotes()).isEqualTo("Invalid employment dates");
    }

    @Test
    @DisplayName("Should handle supporting document URL")
    void supportingDocument_shouldHandleCorrectly() {
        // Given - work experience without document
        assertThat(workExperience.getSupportingDocumentUrl()).isNull();

        // When - adding supporting document
        String documentUrl = "/api/documentos/123e4567-e89b-12d3-a456-426614174000/file";
        workExperience.setSupportingDocumentUrl(documentUrl);

        // Then - document URL should be set
        assertThat(workExperience.getSupportingDocumentUrl()).isEqualTo(documentUrl);
    }

    @Test
    @DisplayName("Should get user ID correctly")
    void getUserId_shouldReturnCorrectUserId() {
        // Given - work experience with user
        UUID expectedUserId = testUser.getId();

        // When - getting user ID
        UUID actualUserId = workExperience.getUserId();

        // Then - should return correct user ID
        assertThat(actualUserId).isEqualTo(expectedUserId);
    }

    @Test
    @DisplayName("Should handle null user gracefully")
    void getUserId_withNullUser_shouldReturnNull() {
        // Given - work experience without user
        workExperience.setUser(null);

        // When - getting user ID
        UUID userId = workExperience.getUserId();

        // Then - should return null
        assertThat(userId).isNull();
    }

    @Test
    @DisplayName("Should handle builder pattern correctly")
    void builder_shouldCreateValidEntity() {
        // When - using builder pattern
        WorkExperienceEntity entity = WorkExperienceEntity.builder()
                .id(UUID.randomUUID())
                .user(testUser)
                .companyName("Builder Test Company")
                .positionTitle("Builder Test Position")
                .startDate(LocalDate.of(2023, 1, 1))
                .endDate(LocalDate.of(2023, 12, 31))
                .jobDescription("Test description")
                .keyAchievements("Test achievements")
                .technologiesUsed("Test technologies")
                .location("Test location")
                .supportingDocumentUrl("test-url")
                .verificationStatus(VerificationStatus.VERIFIED)
                .verificationNotes("Test notes")
                .isCurrentPosition(false)
                .isDeleted(false)
                .build();

        // Then - all fields should be set correctly
        assertThat(entity.getId()).isNotNull();
        assertThat(entity.getUser()).isEqualTo(testUser);
        assertThat(entity.getCompanyName()).isEqualTo("Builder Test Company");
        assertThat(entity.getPositionTitle()).isEqualTo("Builder Test Position");
        assertThat(entity.getStartDate()).isEqualTo(LocalDate.of(2023, 1, 1));
        assertThat(entity.getEndDate()).isEqualTo(LocalDate.of(2023, 12, 31));
        assertThat(entity.getJobDescription()).isEqualTo("Test description");
        assertThat(entity.getKeyAchievements()).isEqualTo("Test achievements");
        assertThat(entity.getTechnologiesUsed()).isEqualTo("Test technologies");
        assertThat(entity.getLocation()).isEqualTo("Test location");
        assertThat(entity.getSupportingDocumentUrl()).isEqualTo("test-url");
        assertThat(entity.getVerificationStatus()).isEqualTo(VerificationStatus.VERIFIED);
        assertThat(entity.getVerificationNotes()).isEqualTo("Test notes");
        assertThat(entity.getIsCurrentPosition()).isFalse();
        assertThat(entity.getIsDeleted()).isFalse();
    }

    // Helper methods

    private UserEntity createTestUser() {
        UserEntity user = new UserEntity();
        user.setId(UUID.randomUUID());
        user.setUsername("testuser");
        user.setFirstName("Test");
        user.setLastName("User");
        user.setEmail("test@example.com");
        return user;
    }

    private WorkExperienceEntity createValidWorkExperience() {
        return WorkExperienceEntity.builder()
                .user(testUser)
                .companyName("Test Company")
                .positionTitle("Test Position")
                .startDate(LocalDate.of(2022, 1, 1))
                .endDate(LocalDate.of(2022, 12, 31))
                .jobDescription("Test job description")
                .isCurrentPosition(false)
                .verificationStatus(VerificationStatus.PENDING)
                .build();
    }
}
