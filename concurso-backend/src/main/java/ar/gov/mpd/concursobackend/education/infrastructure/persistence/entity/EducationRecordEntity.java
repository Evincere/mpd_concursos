package ar.gov.mpd.concursobackend.education.infrastructure.persistence.entity;

import ar.gov.mpd.concursobackend.auth.infrastructure.database.entities.UserEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * JPA entity for education records
 * Maps to unified education_record table with English naming convention
 */
@Entity
@Table(name = "education_record")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EducationRecordEntity {

    /**
     * Education type enumeration
     */
    public enum EducationType {
        PRIMARY_EDUCATION,
        SECONDARY_EDUCATION,
        TECHNICAL_DEGREE,
        UNIVERSITY_DEGREE,
        POSTGRADUATE_DEGREE,
        MASTER_DEGREE,
        DOCTORAL_DEGREE,
        CERTIFICATION,
        DIPLOMA,
        TRAINING_COURSE,
        SCIENTIFIC_ACTIVITY
    }

    /**
     * Education status enumeration
     */
    public enum EducationStatus {
        IN_PROGRESS,
        COMPLETED,
        SUSPENDED,
        ABANDONED
    }

    /**
     * Verification status enumeration
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

    // Core education information
    @Enumerated(EnumType.STRING)
    @Column(name = "education_type", nullable = false)
    private EducationType educationType;

    @Enumerated(EnumType.STRING)
    @Column(name = "education_status", nullable = false)
    private EducationStatus educationStatus;

    // Institution and program details
    @Column(name = "institution_name", nullable = false)
    private String institutionName;

    @Column(name = "program_title", nullable = false)
    private String programTitle;

    @Column(name = "field_of_study")
    private String fieldOfStudy;

    // Dates
    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "graduation_date")
    private LocalDate graduationDate;

    @Column(name = "issue_date")
    private LocalDate issueDate;

    // Academic performance
    @Column(name = "final_grade", precision = 4, scale = 2)
    private BigDecimal finalGrade;

    @Column(name = "grade_scale", length = 50)
    private String gradeScale;

    @Column(name = "academic_honors")
    private String academicHonors;

    // Program details
    @Column(name = "duration_years")
    private Integer durationYears;

    @Column(name = "duration_hours")
    private Integer durationHours;

    @Column(name = "credit_hours")
    private Integer creditHours;

    // Thesis/Research (for advanced degrees)
    @Column(name = "thesis_title", length = 500)
    private String thesisTitle;

    @Column(name = "thesis_topic", columnDefinition = "TEXT")
    private String thesisTopic;

    @Column(name = "thesis_advisor")
    private String thesisAdvisor;

    // Certification details
    @Column(name = "certification_number", length = 100)
    private String certificationNumber;

    @Column(name = "issuing_authority")
    private String issuingAuthority;

    @Column(name = "expiration_date")
    private LocalDate expirationDate;

    // Scientific activity details (for research)
    @Column(name = "activity_type", length = 100)
    private String activityType;

    @Column(name = "activity_role", length = 100)
    private String activityRole;

    @Column(name = "presentation_location")
    private String presentationLocation;

    @Column(name = "presentation_date")
    private LocalDate presentationDate;

    // Documentation and validation
    @Column(name = "supporting_document_url", length = 500)
    private String supportingDocumentUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status", nullable = false)
    private VerificationStatus verificationStatus = VerificationStatus.PENDING;

    @Column(name = "verification_notes", columnDefinition = "TEXT")
    private String verificationNotes;

    // Additional information
    @Column(name = "comments", columnDefinition = "TEXT")
    private String comments;

    @Column(name = "is_ongoing", nullable = false)
    private Boolean isOngoing = false;

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

    // Campo para optimistic locking - JPA maneja automáticamente
    @Version
    @Column(name = "version")
    private int version;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.verificationStatus == null) {
            this.verificationStatus = VerificationStatus.PENDING;
        }
        if (this.isOngoing == null) {
            this.isOngoing = false;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}