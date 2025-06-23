package ar.gov.mpd.concursobackend.experience;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

import ar.gov.mpd.concursobackend.auth.infrastructure.database.entities.UserEntity;
import ar.gov.mpd.concursobackend.auth.infrastructure.database.repository.spring.IUserSpringRepository;
import ar.gov.mpd.concursobackend.experience.application.dto.ExperienceRequestDto;
import ar.gov.mpd.concursobackend.experience.application.dto.ExperienceResponseDto;
import ar.gov.mpd.concursobackend.experience.application.service.ExperienceService;
import ar.gov.mpd.concursobackend.experience.application.service.WorkExperienceDeletionService;
import ar.gov.mpd.concursobackend.experience.infrastructure.persistence.ExperienceRepository;
import ar.gov.mpd.concursobackend.experience.infrastructure.persistence.WorkExperienceEntity;
import ar.gov.mpd.concursobackend.shared.domain.exception.ResourceNotFoundException;
import ar.gov.mpd.concursobackend.shared.testutil.CvTestDataBuilder;

/**
 * Integration tests for CV persistence functionality
 * Tests the complete flow from service to database
 */
@SpringBootTest
@TestPropertySource(locations = "classpath:application-test.properties")
@Transactional
@DisplayName("CV Persistence Integration Tests")
class CvPersistenceIntegrationTest {

    @Autowired
    private ExperienceService experienceService;

    @Autowired
    private WorkExperienceDeletionService deletionService;

    @Autowired
    private ExperienceRepository experienceRepository;

    @Autowired
    private IUserSpringRepository userRepository;

    private UserEntity testUser;
    private UUID userId;

    @BeforeEach
    void setUp() {
        // Create and persist test user
        testUser = CvTestDataBuilder.createTestUser("integrationuser", "integration@test.com");
        testUser = userRepository.save(testUser);
        userId = testUser.getId();
    }

    @Test
    @DisplayName("Should create work experience successfully")
    void createWorkExperience_withValidData_shouldPersist() {
        // Given - valid experience request
        ExperienceRequestDto request = ExperienceRequestDto.builder()
                .company("Integration Test Corp")
                .position("Integration Developer")
                .startDate(LocalDate.of(2022, 1, 1))
                .endDate(LocalDate.of(2023, 12, 31))
                .description("Integration testing experience")
                .comments("Test comments")
                .build();

        // When - creating experience
        ExperienceResponseDto response = experienceService.createExperience(userId, request);

        // Then - should be created and persisted
        assertThat(response).isNotNull();
        assertThat(response.getId()).isNotNull();
        assertThat(response.getCompany()).isEqualTo("Integration Test Corp");
        assertThat(response.getPosition()).isEqualTo("Integration Developer");
        assertThat(response.getStartDate()).isEqualTo(LocalDate.of(2022, 1, 1));
        assertThat(response.getEndDate()).isEqualTo(LocalDate.of(2023, 12, 31));

        // Verify persistence
        WorkExperienceEntity persisted = experienceRepository.findById(response.getId()).orElse(null);
        assertThat(persisted).isNotNull();
        assertThat(persisted.getCompanyName()).isEqualTo("Integration Test Corp");
        assertThat(persisted.getIsDeleted()).isFalse();
        assertThat(persisted.getCreatedAt()).isNotNull();
        assertThat(persisted.getUpdatedAt()).isNotNull();
    }

    @Test
    @DisplayName("Should retrieve all user experiences")
    void getAllExperiences_shouldReturnUserExperiences() {
        // Given - multiple experiences for user
        createTestExperience("Company A", "Developer A");
        createTestExperience("Company B", "Developer B");
        createTestExperience("Company C", "Developer C");

        // When - getting all experiences
        List<ExperienceResponseDto> experiences = experienceService.getAllExperiencesByUserId(userId);

        // Then - should return all experiences
        assertThat(experiences).hasSize(3);
        assertThat(experiences).extracting(ExperienceResponseDto::getCompany)
                .containsExactlyInAnyOrder("Company A", "Company B", "Company C");
    }

    @Test
    @DisplayName("Should update work experience successfully")
    void updateWorkExperience_withValidData_shouldPersist() {
        // Given - existing experience
        ExperienceResponseDto created = createTestExperience("Original Company", "Original Position");
        
        ExperienceRequestDto updateRequest = ExperienceRequestDto.builder()
                .company("Updated Company")
                .position("Updated Position")
                .startDate(LocalDate.of(2022, 6, 1))
                .endDate(LocalDate.of(2023, 6, 30))
                .description("Updated description")
                .comments("Updated comments")
                .build();

        // When - updating experience
        ExperienceResponseDto updated = experienceService.updateExperience(created.getId(), updateRequest);

        // Then - should be updated
        assertThat(updated.getCompany()).isEqualTo("Updated Company");
        assertThat(updated.getPosition()).isEqualTo("Updated Position");
        assertThat(updated.getStartDate()).isEqualTo(LocalDate.of(2022, 6, 1));

        // Verify persistence
        WorkExperienceEntity persisted = experienceRepository.findById(created.getId()).orElse(null);
        assertThat(persisted).isNotNull();
        assertThat(persisted.getCompanyName()).isEqualTo("Updated Company");
        assertThat(persisted.getUpdatedAt()).isAfter(persisted.getCreatedAt());
    }

    @Test
    @DisplayName("Should soft delete work experience")
    void deleteWorkExperience_shouldPerformSoftDelete() {
        // Given - existing experience
        ExperienceResponseDto created = createTestExperience("Delete Test Company", "Delete Test Position");

        // When - deleting experience
        experienceService.deleteExperience(created.getId());

        // Then - should be soft deleted
        WorkExperienceEntity deleted = experienceRepository.findById(created.getId()).orElse(null);
        assertThat(deleted).isNotNull();
        assertThat(deleted.getIsDeleted()).isTrue();
        assertThat(deleted.getDeletedAt()).isNotNull();
        assertThat(deleted.getDeletedAt()).isBeforeOrEqualTo(LocalDateTime.now());

        // And - should not appear in active queries
        List<ExperienceResponseDto> activeExperiences = experienceService.getAllExperiencesByUserId(userId);
        assertThat(activeExperiences).isEmpty();
    }

    @Test
    @DisplayName("Should not find soft deleted experiences in active queries")
    void findActiveExperiences_shouldExcludeSoftDeleted() {
        // Given - active and deleted experiences
        ExperienceResponseDto active1 = createTestExperience("Active Company 1", "Active Position 1");
        ExperienceResponseDto active2 = createTestExperience("Active Company 2", "Active Position 2");
        ExperienceResponseDto toDelete = createTestExperience("Delete Company", "Delete Position");

        // When - deleting one experience
        experienceService.deleteExperience(toDelete.getId());

        // Then - only active experiences should be returned
        List<ExperienceResponseDto> activeExperiences = experienceService.getAllExperiencesByUserId(userId);
        assertThat(activeExperiences).hasSize(2);
        assertThat(activeExperiences).extracting(ExperienceResponseDto::getCompany)
                .containsExactlyInAnyOrder("Active Company 1", "Active Company 2");
    }

    @Test
    @DisplayName("Should handle deletion of non-existent experience")
    void deleteWorkExperience_withInvalidId_shouldThrowException() {
        // Given - non-existent experience ID
        UUID nonExistentId = UUID.randomUUID();

        // When & Then - should throw ResourceNotFoundException
        assertThatThrownBy(() -> experienceService.deleteExperience(nonExistentId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Work experience not found with id: " + nonExistentId);
    }

    @Test
    @DisplayName("Should prevent double deletion")
    void deleteWorkExperience_alreadyDeleted_shouldThrowException() {
        // Given - existing experience
        ExperienceResponseDto created = createTestExperience("Double Delete Test", "Test Position");

        // When - deleting experience first time
        experienceService.deleteExperience(created.getId());

        // Then - second deletion should throw exception
        assertThatThrownBy(() -> experienceService.deleteExperience(created.getId()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("WorkExperience is already deleted");
    }

    @Test
    @DisplayName("Should get deletion info correctly")
    void getDeletionInfo_shouldReturnCorrectInformation() {
        // Given - existing experience
        ExperienceResponseDto created = createTestExperience("Info Test Company", "Info Test Position");

        // When - getting deletion info before deletion
        WorkExperienceDeletionService.DeletionInfo infoBefore = deletionService.getDeletionInfo(created.getId());

        // Then - should show as not deleted
        assertThat(infoBefore.getIsDeleted()).isFalse();
        assertThat(infoBefore.isCanRecover()).isFalse();

        // When - deleting and getting info after
        experienceService.deleteExperience(created.getId());
        WorkExperienceDeletionService.DeletionInfo infoAfter = deletionService.getDeletionInfo(created.getId());

        // Then - should show as deleted and recoverable
        assertThat(infoAfter.getIsDeleted()).isTrue();
        assertThat(infoAfter.getDeletedAt()).isNotNull();
        assertThat(infoAfter.isCanRecover()).isTrue(); // Within 24h window
    }

    @Test
    @DisplayName("Should validate deletion eligibility")
    void canDelete_shouldValidateCorrectly() {
        // Given - existing experience
        ExperienceResponseDto created = createTestExperience("Validation Test", "Test Position");

        // When - checking if can delete active experience
        boolean canDeleteActive = deletionService.canDelete(created.getId());

        // Then - should be able to delete
        assertThat(canDeleteActive).isTrue();

        // When - deleting and checking again
        experienceService.deleteExperience(created.getId());
        boolean canDeleteDeleted = deletionService.canDelete(created.getId());

        // Then - should not be able to delete again
        assertThat(canDeleteDeleted).isFalse();
    }

    @Test
    @DisplayName("Should handle concurrent access correctly")
    void concurrentAccess_shouldMaintainDataIntegrity() {
        // Given - existing experience
        ExperienceResponseDto created = createTestExperience("Concurrent Test", "Test Position");

        // When - simulating concurrent access (update and delete)
        ExperienceRequestDto updateRequest = ExperienceRequestDto.builder()
                .company("Concurrent Updated Company")
                .position("Concurrent Updated Position")
                .startDate(LocalDate.of(2022, 1, 1))
                .endDate(LocalDate.of(2023, 12, 31))
                .description("Concurrent update")
                .build();

        // Update first
        ExperienceResponseDto updated = experienceService.updateExperience(created.getId(), updateRequest);
        assertThat(updated.getCompany()).isEqualTo("Concurrent Updated Company");

        // Then delete
        experienceService.deleteExperience(created.getId());

        // Then - should be soft deleted with updated data
        WorkExperienceEntity final_entity = experienceRepository.findById(created.getId()).orElse(null);
        assertThat(final_entity).isNotNull();
        assertThat(final_entity.getCompanyName()).isEqualTo("Concurrent Updated Company");
        assertThat(final_entity.getIsDeleted()).isTrue();
    }

    // Helper methods

    private ExperienceResponseDto createTestExperience(String company, String position) {
        ExperienceRequestDto request = ExperienceRequestDto.builder()
                .company(company)
                .position(position)
                .startDate(LocalDate.of(2022, 1, 1))
                .endDate(LocalDate.of(2023, 12, 31))
                .description("Test description for " + position)
                .comments("Test comments")
                .build();

        return experienceService.createExperience(userId, request);
    }
}
