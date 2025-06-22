package ar.gov.mpd.concursobackend.shared.testutil;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import ar.gov.mpd.concursobackend.auth.domain.model.UserStatus;
import ar.gov.mpd.concursobackend.auth.infrastructure.database.entities.UserEntity;
import ar.gov.mpd.concursobackend.experience.infrastructure.persistence.WorkExperienceEntity;
import ar.gov.mpd.concursobackend.experience.infrastructure.persistence.WorkExperienceEntity.VerificationStatus;

/**
 * Test data builder for CV entities
 * Provides convenient methods to create test data with sensible defaults
 */
public class CvTestDataBuilder {

    // =====================================================
    // USER ENTITY BUILDERS
    // =====================================================

    /**
     * Creates a basic test user with default values
     */
    public static UserEntity createTestUser() {
        return createTestUser("testuser", "test@example.com");
    }

    /**
     * Creates a test user with specified username and email
     */
    public static UserEntity createTestUser(String username, String email) {
        UserEntity user = new UserEntity();
        user.setId(UUID.randomUUID());
        user.setUsername(username);
        user.setFirstName("Test");
        user.setLastName("User");
        user.setEmail(email);
        user.setDni("12345678");
        user.setTelefono("1234567890");
        user.setDireccion("Test Address 123");
        user.setStatus(UserStatus.ACTIVE);
        return user;
    }

    /**
     * Creates a test user with specific ID
     */
    public static UserEntity createTestUserWithId(UUID userId, String username, String email) {
        UserEntity user = createTestUser(username, email);
        user.setId(userId);
        return user;
    }

    // =====================================================
    // WORK EXPERIENCE ENTITY BUILDERS
    // =====================================================

    /**
     * Creates a valid work experience with default values
     */
    public static WorkExperienceEntity createValidWorkExperience(UserEntity user) {
        return WorkExperienceEntity.builder()
                .user(user)
                .companyName("TechCorp Inc.")
                .positionTitle("Software Developer")
                .startDate(LocalDate.of(2022, 1, 15))
                .endDate(LocalDate.of(2023, 12, 31))
                .jobDescription("Developed enterprise applications using Spring Boot and Angular")
                .keyAchievements("Led team of 3 developers, improved system performance by 30%")
                .technologiesUsed("Java, Spring Boot, Angular, MySQL, Docker")
                .location("Buenos Aires, Argentina")
                .isCurrentPosition(false)
                .verificationStatus(VerificationStatus.PENDING)
                .isDeleted(false)
                .build();
    }

    /**
     * Creates a current position (no end date)
     */
    public static WorkExperienceEntity createCurrentPosition(UserEntity user) {
        return WorkExperienceEntity.builder()
                .user(user)
                .companyName("Current Corp")
                .positionTitle("Senior Developer")
                .startDate(LocalDate.now().minusYears(1))
                .endDate(null) // Current position
                .jobDescription("Currently working on microservices architecture")
                .keyAchievements("Migrated monolith to microservices")
                .technologiesUsed("Java, Spring Cloud, Kubernetes")
                .location("Remote")
                .isCurrentPosition(true)
                .verificationStatus(VerificationStatus.PENDING)
                .isDeleted(false)
                .build();
    }

    /**
     * Creates a work experience with custom company and position
     */
    public static WorkExperienceEntity createWorkExperience(UserEntity user, String company, String position) {
        return WorkExperienceEntity.builder()
                .user(user)
                .companyName(company)
                .positionTitle(position)
                .startDate(LocalDate.now().minusYears(2))
                .endDate(LocalDate.now().minusYears(1))
                .jobDescription("Job description for " + position + " at " + company)
                .isCurrentPosition(false)
                .verificationStatus(VerificationStatus.PENDING)
                .isDeleted(false)
                .build();
    }

    /**
     * Creates a work experience with custom dates
     */
    public static WorkExperienceEntity createWorkExperienceWithDates(UserEntity user, 
            LocalDate startDate, LocalDate endDate) {
        return WorkExperienceEntity.builder()
                .user(user)
                .companyName("Date Test Company")
                .positionTitle("Date Test Position")
                .startDate(startDate)
                .endDate(endDate)
                .jobDescription("Testing date ranges")
                .isCurrentPosition(endDate == null)
                .verificationStatus(VerificationStatus.PENDING)
                .isDeleted(false)
                .build();
    }

    /**
     * Creates a verified work experience
     */
    public static WorkExperienceEntity createVerifiedWorkExperience(UserEntity user) {
        WorkExperienceEntity experience = createValidWorkExperience(user);
        experience.setVerificationStatus(VerificationStatus.VERIFIED);
        experience.setVerificationNotes("Verified by HR department");
        return experience;
    }

    /**
     * Creates a rejected work experience
     */
    public static WorkExperienceEntity createRejectedWorkExperience(UserEntity user) {
        WorkExperienceEntity experience = createValidWorkExperience(user);
        experience.setVerificationStatus(VerificationStatus.REJECTED);
        experience.setVerificationNotes("Invalid employment dates");
        return experience;
    }

    /**
     * Creates a work experience with supporting document
     */
    public static WorkExperienceEntity createWorkExperienceWithDocument(UserEntity user) {
        WorkExperienceEntity experience = createValidWorkExperience(user);
        experience.setSupportingDocumentUrl("/api/documentos/" + UUID.randomUUID() + "/file");
        return experience;
    }

    /**
     * Creates a soft-deleted work experience
     */
    public static WorkExperienceEntity createDeletedWorkExperience(UserEntity user) {
        WorkExperienceEntity experience = createValidWorkExperience(user);
        experience.setIsDeleted(true);
        experience.setDeletedAt(LocalDateTime.now().minusHours(12));
        experience.setDeletedBy(UUID.randomUUID());
        return experience;
    }

    /**
     * Creates a work experience deleted outside recovery window
     */
    public static WorkExperienceEntity createOldDeletedWorkExperience(UserEntity user) {
        WorkExperienceEntity experience = createValidWorkExperience(user);
        experience.setIsDeleted(true);
        experience.setDeletedAt(LocalDateTime.now().minusHours(48)); // 48 hours ago
        experience.setDeletedBy(UUID.randomUUID());
        return experience;
    }

    // =====================================================
    // BUILDER PATTERN HELPERS
    // =====================================================

    /**
     * Builder class for more complex work experience creation
     */
    public static class WorkExperienceBuilder {
        private WorkExperienceEntity experience;

        private WorkExperienceBuilder(UserEntity user) {
            this.experience = createValidWorkExperience(user);
        }

        public static WorkExperienceBuilder forUser(UserEntity user) {
            return new WorkExperienceBuilder(user);
        }

        public WorkExperienceBuilder withCompany(String company) {
            experience.setCompanyName(company);
            return this;
        }

        public WorkExperienceBuilder withPosition(String position) {
            experience.setPositionTitle(position);
            return this;
        }

        public WorkExperienceBuilder withDates(LocalDate startDate, LocalDate endDate) {
            experience.setStartDate(startDate);
            experience.setEndDate(endDate);
            experience.setIsCurrentPosition(endDate == null);
            return this;
        }

        public WorkExperienceBuilder withDescription(String description) {
            experience.setJobDescription(description);
            return this;
        }

        public WorkExperienceBuilder withTechnologies(String technologies) {
            experience.setTechnologiesUsed(technologies);
            return this;
        }

        public WorkExperienceBuilder withLocation(String location) {
            experience.setLocation(location);
            return this;
        }

        public WorkExperienceBuilder withVerificationStatus(VerificationStatus status) {
            experience.setVerificationStatus(status);
            return this;
        }

        public WorkExperienceBuilder withDocument(String documentUrl) {
            experience.setSupportingDocumentUrl(documentUrl);
            return this;
        }

        public WorkExperienceBuilder asCurrentPosition() {
            experience.setEndDate(null);
            experience.setIsCurrentPosition(true);
            return this;
        }

        public WorkExperienceBuilder asDeleted() {
            experience.setIsDeleted(true);
            experience.setDeletedAt(LocalDateTime.now().minusHours(12));
            experience.setDeletedBy(UUID.randomUUID());
            return this;
        }

        public WorkExperienceBuilder asOldDeleted() {
            experience.setIsDeleted(true);
            experience.setDeletedAt(LocalDateTime.now().minusHours(48));
            experience.setDeletedBy(UUID.randomUUID());
            return this;
        }

        public WorkExperienceEntity build() {
            // Simulate @PrePersist
            if (experience.getId() == null) {
                experience.setId(UUID.randomUUID());
            }
            experience.onCreate();
            return experience;
        }
    }

    // =====================================================
    // UTILITY METHODS
    // =====================================================

    /**
     * Creates a list of work experiences for testing pagination
     */
    public static WorkExperienceEntity[] createMultipleWorkExperiences(UserEntity user, int count) {
        WorkExperienceEntity[] experiences = new WorkExperienceEntity[count];
        
        for (int i = 0; i < count; i++) {
            experiences[i] = WorkExperienceBuilder.forUser(user)
                    .withCompany("Company " + (i + 1))
                    .withPosition("Position " + (i + 1))
                    .withDates(
                        LocalDate.now().minusYears(count - i),
                        LocalDate.now().minusYears(count - i - 1)
                    )
                    .build();
        }
        
        return experiences;
    }

    /**
     * Creates work experiences with mixed verification statuses
     */
    public static WorkExperienceEntity[] createMixedVerificationExperiences(UserEntity user) {
        return new WorkExperienceEntity[] {
            WorkExperienceBuilder.forUser(user)
                    .withCompany("Verified Corp")
                    .withVerificationStatus(VerificationStatus.VERIFIED)
                    .build(),
            WorkExperienceBuilder.forUser(user)
                    .withCompany("Pending Corp")
                    .withVerificationStatus(VerificationStatus.PENDING)
                    .build(),
            WorkExperienceBuilder.forUser(user)
                    .withCompany("Rejected Corp")
                    .withVerificationStatus(VerificationStatus.REJECTED)
                    .build()
        };
    }
}
