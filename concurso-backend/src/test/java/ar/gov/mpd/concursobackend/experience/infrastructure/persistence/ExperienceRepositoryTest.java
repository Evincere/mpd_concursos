package ar.gov.mpd.concursobackend.experience.infrastructure.persistence;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.TestPropertySource;

import ar.gov.mpd.concursobackend.auth.infrastructure.database.entities.UserEntity;
import ar.gov.mpd.concursobackend.experience.infrastructure.persistence.WorkExperienceEntity.VerificationStatus;

/**
 * Repository tests for ExperienceRepository
 * Tests JPA repository methods with H2 in-memory database
 */
@DataJpaTest
@TestPropertySource(locations = "classpath:application-test.properties")
@DisplayName("ExperienceRepository Tests")
class ExperienceRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private ExperienceRepository repository;

    private UserEntity testUser1;
    private UserEntity testUser2;
    private WorkExperienceEntity activeExperience1;
    private WorkExperienceEntity activeExperience2;
    private WorkExperienceEntity deletedExperience;

    @BeforeEach
    void setUp() {
        // Create test users
        testUser1 = createAndPersistUser("user1", "test1@example.com");
        testUser2 = createAndPersistUser("user2", "test2@example.com");

        // Create test experiences
        activeExperience1 = createAndPersistExperience(testUser1, "Company A", "Developer", 
                LocalDate.of(2023, 1, 1), LocalDate.of(2023, 12, 31), false);
        
        activeExperience2 = createAndPersistExperience(testUser1, "Company B", "Senior Developer", 
                LocalDate.of(2022, 1, 1), LocalDate.of(2022, 12, 31), false);
        
        deletedExperience = createAndPersistExperience(testUser1, "Company C", "Lead Developer", 
                LocalDate.of(2021, 1, 1), LocalDate.of(2021, 12, 31), true);

        entityManager.flush();
        entityManager.clear();
    }

    @Test
    @DisplayName("Should find active experiences by user")
    void findByUser_shouldReturnActiveExperiencesOnly() {
        // When - finding experiences by user
        List<WorkExperienceEntity> experiences = repository.findByUser(testUser1);

        // Then - should return only active experiences, ordered by start date desc
        assertThat(experiences).hasSize(2);
        assertThat(experiences).extracting(WorkExperienceEntity::getCompanyName)
                .containsExactly("Company A", "Company B"); // Ordered by start date desc
        assertThat(experiences).allMatch(exp -> !exp.getIsDeleted());
    }

    @Test
    @DisplayName("Should find active experiences by user ID")
    void findByUserId_shouldReturnActiveExperiencesOnly() {
        // When - finding experiences by user ID
        List<WorkExperienceEntity> experiences = repository.findByUserId(testUser1.getId());

        // Then - should return only active experiences
        assertThat(experiences).hasSize(2);
        assertThat(experiences).extracting(WorkExperienceEntity::getCompanyName)
                .containsExactly("Company A", "Company B");
        assertThat(experiences).allMatch(exp -> !exp.getIsDeleted());
    }

    @Test
    @DisplayName("Should find experience by ID and user")
    void findByIdAndUser_shouldReturnActiveExperienceOnly() {
        // When - finding active experience by ID and user
        Optional<WorkExperienceEntity> found = repository.findByIdAndUser(activeExperience1.getId(), testUser1);

        // Then - should find the experience
        assertThat(found).isPresent();
        assertThat(found.get().getCompanyName()).isEqualTo("Company A");

        // When - trying to find deleted experience by ID and user
        Optional<WorkExperienceEntity> notFound = repository.findByIdAndUser(deletedExperience.getId(), testUser1);

        // Then - should not find deleted experience
        assertThat(notFound).isEmpty();
    }

    @Test
    @DisplayName("Should find all experiences including deleted")
    void findAllByUserId_shouldReturnAllExperiences() {
        // When - finding all experiences by user ID
        List<WorkExperienceEntity> experiences = repository.findAllByUserId(testUser1.getId());

        // Then - should return all experiences including deleted
        assertThat(experiences).hasSize(3);
        assertThat(experiences).extracting(WorkExperienceEntity::getCompanyName)
                .containsExactly("Company A", "Company B", "Company C");
    }

    @Test
    @DisplayName("Should find recoverable experiences within 24 hours")
    void findRecoverableByUserId_shouldReturnRecentlyDeleted() {
        // Given - recently deleted experience (within 24 hours)
        LocalDateTime cutoffTime = LocalDateTime.now().minusHours(24);
        deletedExperience.setDeletedAt(LocalDateTime.now().minusHours(12)); // 12 hours ago
        entityManager.merge(deletedExperience);
        entityManager.flush();

        // When - finding recoverable experiences
        List<WorkExperienceEntity> recoverable = repository.findRecoverableByUserId(testUser1.getId(), cutoffTime);

        // Then - should find the recently deleted experience
        assertThat(recoverable).hasSize(1);
        assertThat(recoverable.get(0).getCompanyName()).isEqualTo("Company C");
        assertThat(recoverable.get(0).getIsDeleted()).isTrue();
    }

    @Test
    @DisplayName("Should not find recoverable experiences older than 24 hours")
    void findRecoverableByUserId_shouldNotReturnOldDeleted() {
        // Given - old deleted experience (older than 24 hours)
        LocalDateTime cutoffTime = LocalDateTime.now().minusHours(24);
        deletedExperience.setDeletedAt(LocalDateTime.now().minusHours(48)); // 48 hours ago
        entityManager.merge(deletedExperience);
        entityManager.flush();

        // When - finding recoverable experiences
        List<WorkExperienceEntity> recoverable = repository.findRecoverableByUserId(testUser1.getId(), cutoffTime);

        // Then - should not find old deleted experiences
        assertThat(recoverable).isEmpty();
    }

    @Test
    @DisplayName("Should return empty list for user with no experiences")
    void findByUserId_withNoExperiences_shouldReturnEmptyList() {
        // When - finding experiences for user with no experiences
        List<WorkExperienceEntity> experiences = repository.findByUserId(testUser2.getId());

        // Then - should return empty list
        assertThat(experiences).isEmpty();
    }

    @Test
    @DisplayName("Should save experience with audit fields")
    void save_shouldPersistWithAuditFields() {
        // Given - new work experience
        WorkExperienceEntity newExperience = WorkExperienceEntity.builder()
                .user(testUser2)
                .companyName("New Company")
                .positionTitle("New Position")
                .startDate(LocalDate.now().minusYears(1))
                .endDate(LocalDate.now())
                .jobDescription("New job description")
                .isCurrentPosition(false)
                .verificationStatus(VerificationStatus.PENDING)
                .build();

        // Simulate @PrePersist
        newExperience.onCreate();

        // When - saving the experience
        WorkExperienceEntity saved = repository.save(newExperience);

        // Then - should be persisted with audit fields
        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getCreatedAt()).isNotNull();
        assertThat(saved.getUpdatedAt()).isNotNull();
        assertThat(saved.getIsDeleted()).isFalse();
        assertThat(saved.getVerificationStatus()).isEqualTo(VerificationStatus.PENDING);
    }

    @Test
    @DisplayName("Should update experience and modify updatedAt")
    void save_onUpdate_shouldModifyUpdatedAt() {
        // Given - existing experience
        LocalDateTime originalUpdatedAt = activeExperience1.getUpdatedAt();

        // When - updating the experience
        activeExperience1.setJobDescription("Updated job description");
        activeExperience1.onUpdate(); // Simulate @PreUpdate
        WorkExperienceEntity updated = repository.save(activeExperience1);

        // Then - updatedAt should be modified
        assertThat(updated.getUpdatedAt()).isAfter(originalUpdatedAt);
        assertThat(updated.getJobDescription()).isEqualTo("Updated job description");
    }

    @Test
    @DisplayName("Should handle soft delete correctly")
    void save_withSoftDelete_shouldPersistDeletionFields() {
        // Given - active experience
        assertThat(activeExperience1.getIsDeleted()).isFalse();

        // When - performing soft delete
        LocalDateTime deletionTime = LocalDateTime.now();
        activeExperience1.setIsDeleted(true);
        activeExperience1.setDeletedAt(deletionTime);
        WorkExperienceEntity softDeleted = repository.save(activeExperience1);

        // Then - soft delete fields should be persisted
        assertThat(softDeleted.getIsDeleted()).isTrue();
        assertThat(softDeleted.getDeletedAt()).isEqualTo(deletionTime);

        // And - should not appear in active queries
        List<WorkExperienceEntity> activeExperiences = repository.findByUserId(testUser1.getId());
        assertThat(activeExperiences).hasSize(1); // Only activeExperience2 should remain
        assertThat(activeExperiences.get(0).getCompanyName()).isEqualTo("Company B");
    }

    @Test
    @DisplayName("Should handle current position correctly")
    void save_withCurrentPosition_shouldPersistCorrectly() {
        // Given - current position (no end date)
        WorkExperienceEntity currentPosition = WorkExperienceEntity.builder()
                .user(testUser2)
                .companyName("Current Company")
                .positionTitle("Current Position")
                .startDate(LocalDate.now().minusYears(1))
                .endDate(null) // No end date
                .isCurrentPosition(true)
                .jobDescription("Current job")
                .verificationStatus(VerificationStatus.PENDING)
                .build();

        currentPosition.onCreate();

        // When - saving current position
        WorkExperienceEntity saved = repository.save(currentPosition);

        // Then - should be saved correctly
        assertThat(saved.getIsCurrentPosition()).isTrue();
        assertThat(saved.getEndDate()).isNull();
        assertThat(saved.getCompanyName()).isEqualTo("Current Company");
    }

    // Helper methods

    private UserEntity createAndPersistUser(String username, String email) {
        UserEntity user = new UserEntity();
        user.setId(UUID.randomUUID());
        user.setUsername(username);
        user.setFirstName("Test");
        user.setLastName("User");
        user.setEmail(email);
        return entityManager.persistAndFlush(user);
    }

    private WorkExperienceEntity createAndPersistExperience(UserEntity user, String company, 
            String position, LocalDate startDate, LocalDate endDate, boolean isDeleted) {
        
        WorkExperienceEntity experience = WorkExperienceEntity.builder()
                .user(user)
                .companyName(company)
                .positionTitle(position)
                .startDate(startDate)
                .endDate(endDate)
                .jobDescription("Job description for " + position)
                .isCurrentPosition(endDate == null)
                .verificationStatus(VerificationStatus.PENDING)
                .isDeleted(isDeleted)
                .build();

        experience.onCreate();
        
        if (isDeleted) {
            experience.setDeletedAt(LocalDateTime.now().minusDays(1));
        }

        return entityManager.persistAndFlush(experience);
    }
}
