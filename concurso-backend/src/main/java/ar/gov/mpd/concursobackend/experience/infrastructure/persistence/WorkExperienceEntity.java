package ar.gov.mpd.concursobackend.experience.infrastructure.persistence;

import ar.gov.mpd.concursobackend.auth.infrastructure.database.entities.UserEntity;
import ar.gov.mpd.concursobackend.shared.domain.model.SoftDeletableEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * JPA Entity for persisting work experiences
 * Maps to unified work_experience table with English naming convention
 */
@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "work_experience")
public class WorkExperienceEntity implements SoftDeletableEntity {

    /**
     * Verification status for work experience entries
     */
    public enum VerificationStatus {
        PENDING, VERIFIED, REJECTED
    }

    @Id
    @GeneratedValue(strategy = jakarta.persistence.GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    // Core experience information (English names)
    @Column(name = "company_name", nullable = false)
    private String companyName;

    @Column(name = "position_title", nullable = false)
    private String positionTitle;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Builder.Default
    @Column(name = "is_current_position", nullable = false)
    private Boolean isCurrentPosition = false;

    // Detailed information
    @Column(name = "job_description", columnDefinition = "TEXT")
    private String jobDescription;

    @Column(name = "key_achievements", columnDefinition = "TEXT")
    private String keyAchievements;

    @Column(name = "technologies_used", columnDefinition = "TEXT")
    private String technologiesUsed;

    @Column(name = "location")
    private String location;

    // Documentation and validation
    @Column(name = "supporting_document_url", length = 500)
    private String supportingDocumentUrl;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status", nullable = false)
    private VerificationStatus verificationStatus = VerificationStatus.PENDING;

    @Column(name = "verification_notes", columnDefinition = "TEXT")
    private String verificationNotes;

    // Audit fields
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private UserEntity createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by")
    private UserEntity updatedBy;

    // Soft delete fields
    @Builder.Default
    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = false;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deleted_by")
    private UserEntity deletedByUser;

    @PrePersist
    public void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.verificationStatus == null) {
            this.verificationStatus = VerificationStatus.PENDING;
        }
        if (this.isCurrentPosition == null) {
            this.isCurrentPosition = false;
        }
        if (this.isDeleted == null) {
            this.isDeleted = false;
        }
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Helper methods for soft delete interface compatibility
    public UUID getUserId() {
        return this.user != null ? this.user.getId() : null;
    }

    public void setDeletedBy(UUID deletedBy) {
        // Note: This sets the UUID directly, not the UserEntity
        // The UserEntity relationship (deletedByUser) should be set separately if needed
        this.deletedByUser = null; // Clear the entity relationship for now
    }

    public UUID getDeletedBy() {
        return this.deletedByUser != null ? this.deletedByUser.getId() : null;
    }
}