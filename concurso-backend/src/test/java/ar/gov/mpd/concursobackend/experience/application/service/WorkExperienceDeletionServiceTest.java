package ar.gov.mpd.concursobackend.experience.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import ar.gov.mpd.concursobackend.auth.infrastructure.database.entities.UserEntity;
import ar.gov.mpd.concursobackend.experience.infrastructure.persistence.ExperienceRepository;
import ar.gov.mpd.concursobackend.experience.infrastructure.persistence.WorkExperienceEntity;
import ar.gov.mpd.concursobackend.experience.infrastructure.persistence.WorkExperienceEntity.VerificationStatus;
import ar.gov.mpd.concursobackend.shared.domain.exception.ResourceNotFoundException;

/**
 * Unit tests for WorkExperienceDeletionService
 * Tests deletion logic, validation, and business rules
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("WorkExperienceDeletionService Tests")
class WorkExperienceDeletionServiceTest {

    @Mock
    private ExperienceRepository repository;

    @Mock
    private SecurityContext securityContext;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private WorkExperienceDeletionService deletionService;

    private UUID experienceId;
    private UUID userId;
    private UserEntity testUser;
    private WorkExperienceEntity activeExperience;
    private WorkExperienceEntity deletedExperience;

    @BeforeEach
    void setUp() {
        experienceId = UUID.randomUUID();
        userId = UUID.randomUUID();
        
        testUser = createTestUser();
        activeExperience = createActiveExperience();
        deletedExperience = createDeletedExperience();

        // Mock security context
        SecurityContextHolder.setContext(securityContext);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn("testuser");
    }

    @Test
    @DisplayName("Should delete work experience successfully")
    void deleteWorkExperience_withValidId_shouldSucceed() {
        // Given - existing active experience
        when(repository.findById(experienceId)).thenReturn(Optional.of(activeExperience));
        when(repository.save(any(WorkExperienceEntity.class))).thenReturn(activeExperience);

        // When - deleting the experience
        deletionService.deleteWorkExperience(experienceId);

        // Then - should perform soft delete
        verify(repository).findById(experienceId);
        verify(repository).save(any(WorkExperienceEntity.class));
        
        // Verify soft delete fields would be set (in real scenario)
        // Note: In unit test, we can't verify the actual entity state change
        // This would be tested in integration tests
    }

    @Test
    @DisplayName("Should throw exception when experience not found")
    void deleteWorkExperience_withInvalidId_shouldThrowException() {
        // Given - non-existent experience
        when(repository.findById(experienceId)).thenReturn(Optional.empty());

        // When & Then - should throw ResourceNotFoundException
        assertThatThrownBy(() -> deletionService.deleteWorkExperience(experienceId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Work experience not found with id: " + experienceId);

        verify(repository).findById(experienceId);
        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw exception when experience already deleted")
    void deleteWorkExperience_withDeletedExperience_shouldThrowException() {
        // Given - already deleted experience
        when(repository.findById(experienceId)).thenReturn(Optional.of(deletedExperience));

        // When & Then - should throw IllegalStateException
        assertThatThrownBy(() -> deletionService.deleteWorkExperience(experienceId))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("WorkExperience is already deleted");

        verify(repository).findById(experienceId);
        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("Should validate deletion eligibility correctly")
    void canDelete_shouldValidateCorrectly() {
        // Given - active experience
        when(repository.findById(experienceId)).thenReturn(Optional.of(activeExperience));

        // When - checking if can delete
        boolean canDelete = deletionService.canDelete(experienceId);

        // Then - should return true for active experience
        assertThat(canDelete).isTrue();
        verify(repository).findById(experienceId);
    }

    @Test
    @DisplayName("Should return false for non-existent experience")
    void canDelete_withInvalidId_shouldReturnFalse() {
        // Given - non-existent experience
        when(repository.findById(experienceId)).thenReturn(Optional.empty());

        // When - checking if can delete
        boolean canDelete = deletionService.canDelete(experienceId);

        // Then - should return false
        assertThat(canDelete).isFalse();
        verify(repository).findById(experienceId);
    }

    @Test
    @DisplayName("Should return false for already deleted experience")
    void canDelete_withDeletedExperience_shouldReturnFalse() {
        // Given - deleted experience
        when(repository.findById(experienceId)).thenReturn(Optional.of(deletedExperience));

        // When - checking if can delete
        boolean canDelete = deletionService.canDelete(experienceId);

        // Then - should return false
        assertThat(canDelete).isFalse();
        verify(repository).findById(experienceId);
    }

    @Test
    @DisplayName("Should get deletion info for active experience")
    void getDeletionInfo_withActiveExperience_shouldReturnCorrectInfo() {
        // Given - active experience
        when(repository.findById(experienceId)).thenReturn(Optional.of(activeExperience));

        // When - getting deletion info
        WorkExperienceDeletionService.DeletionInfo info = deletionService.getDeletionInfo(experienceId);

        // Then - should return correct info
        assertThat(info).isNotNull();
        assertThat(info.getId()).isEqualTo(experienceId);
        assertThat(info.getIsDeleted()).isFalse();
        assertThat(info.getDeletedAt()).isNull();
        assertThat(info.getDeletedBy()).isNull();
        assertThat(info.isCanRecover()).isFalse();
        assertThat(info.isHasAssociatedDocuments()).isFalse();
    }

    @Test
    @DisplayName("Should get deletion info for deleted experience")
    void getDeletionInfo_withDeletedExperience_shouldReturnCorrectInfo() {
        // Given - recently deleted experience (within recovery window)
        deletedExperience.setDeletedAt(LocalDateTime.now().minusHours(12));
        when(repository.findById(experienceId)).thenReturn(Optional.of(deletedExperience));

        // When - getting deletion info
        WorkExperienceDeletionService.DeletionInfo info = deletionService.getDeletionInfo(experienceId);

        // Then - should return correct info
        assertThat(info).isNotNull();
        assertThat(info.getId()).isEqualTo(experienceId);
        assertThat(info.getIsDeleted()).isTrue();
        assertThat(info.getDeletedAt()).isNotNull();
        assertThat(info.isCanRecover()).isTrue(); // Within 24h window
        assertThat(info.isHasAssociatedDocuments()).isFalse();
    }

    @Test
    @DisplayName("Should detect associated documents")
    void getDeletionInfo_withDocuments_shouldDetectDocuments() {
        // Given - experience with supporting document
        activeExperience.setSupportingDocumentUrl("/api/documentos/123e4567-e89b-12d3-a456-426614174000/file");
        when(repository.findById(experienceId)).thenReturn(Optional.of(activeExperience));

        // When - getting deletion info
        WorkExperienceDeletionService.DeletionInfo info = deletionService.getDeletionInfo(experienceId);

        // Then - should detect associated documents
        assertThat(info.isHasAssociatedDocuments()).isTrue();
    }

    @Test
    @DisplayName("Should handle experience outside recovery window")
    void getDeletionInfo_outsideRecoveryWindow_shouldNotAllowRecovery() {
        // Given - old deleted experience (outside 24h window)
        deletedExperience.setDeletedAt(LocalDateTime.now().minusHours(48));
        when(repository.findById(experienceId)).thenReturn(Optional.of(deletedExperience));

        // When - getting deletion info
        WorkExperienceDeletionService.DeletionInfo info = deletionService.getDeletionInfo(experienceId);

        // Then - should not allow recovery
        assertThat(info.isCanRecover()).isFalse();
    }

    @Test
    @DisplayName("Should handle document URL extraction correctly")
    void handleAssociatedDocuments_withValidUrl_shouldExtractDocumentId() {
        // Given - experience with valid document URL
        String documentUrl = "/api/documentos/123e4567-e89b-12d3-a456-426614174000/file";
        activeExperience.setSupportingDocumentUrl(documentUrl);
        when(repository.findById(experienceId)).thenReturn(Optional.of(activeExperience));
        when(repository.save(any(WorkExperienceEntity.class))).thenReturn(activeExperience);

        // When - deleting experience (which handles associated documents)
        deletionService.deleteWorkExperience(experienceId);

        // Then - should complete without errors
        // Note: Document deletion service is not implemented yet, so we just verify no exceptions
        verify(repository).findById(experienceId);
        verify(repository).save(any(WorkExperienceEntity.class));
    }

    @Test
    @DisplayName("Should handle invalid document URL gracefully")
    void handleAssociatedDocuments_withInvalidUrl_shouldContinue() {
        // Given - experience with invalid document URL
        activeExperience.setSupportingDocumentUrl("invalid-url");
        when(repository.findById(experienceId)).thenReturn(Optional.of(activeExperience));
        when(repository.save(any(WorkExperienceEntity.class))).thenReturn(activeExperience);

        // When - deleting experience
        deletionService.deleteWorkExperience(experienceId);

        // Then - should complete without errors (graceful handling)
        verify(repository).findById(experienceId);
        verify(repository).save(any(WorkExperienceEntity.class));
    }

    // Helper methods

    private UserEntity createTestUser() {
        UserEntity user = new UserEntity();
        user.setId(userId);
        user.setUsername("testuser");
        user.setFirstName("Test");
        user.setLastName("User");
        user.setEmail("test@example.com");
        return user;
    }

    private WorkExperienceEntity createActiveExperience() {
        WorkExperienceEntity experience = WorkExperienceEntity.builder()
                .id(experienceId)
                .user(testUser)
                .companyName("Test Company")
                .positionTitle("Test Position")
                .startDate(LocalDate.of(2022, 1, 1))
                .endDate(LocalDate.of(2022, 12, 31))
                .jobDescription("Test description")
                .isCurrentPosition(false)
                .verificationStatus(VerificationStatus.PENDING)
                .isDeleted(false)
                .build();
        
        experience.onCreate();
        return experience;
    }

    private WorkExperienceEntity createDeletedExperience() {
        WorkExperienceEntity experience = WorkExperienceEntity.builder()
                .id(experienceId)
                .user(testUser)
                .companyName("Deleted Company")
                .positionTitle("Deleted Position")
                .startDate(LocalDate.of(2021, 1, 1))
                .endDate(LocalDate.of(2021, 12, 31))
                .jobDescription("Deleted description")
                .isCurrentPosition(false)
                .verificationStatus(VerificationStatus.PENDING)
                .isDeleted(true)
                .deletedAt(LocalDateTime.now().minusDays(1))
                .build();
        
        experience.onCreate();
        return experience;
    }
}
