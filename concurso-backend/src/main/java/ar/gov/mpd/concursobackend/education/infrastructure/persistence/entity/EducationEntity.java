package ar.gov.mpd.concursobackend.education.infrastructure.persistence.entity;

import java.time.LocalDate;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * JPA entity for education records
 */
@Entity
@Table(name = "education")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EducationEntity {
    
    @Id
    @Column(name = "id")
    private UUID id;
    
    @Column(name = "userId", nullable = false)
    private UUID userId;

    // Common fields for all education types

    @Column(name = "type", nullable = false)
    private String type;

    @Column(name = "status", nullable = false)
    private String status;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "institution", nullable = false)
    private String institution;

    @Column(name = "issueDate")
    private LocalDate issueDate;

    @Column(name = "documentUrl")
    private String documentUrl;
    
    // Fields for higher education and undergraduate degrees

    @Column(name = "durationYears")
    private Integer durationYears;

    @Column(name = "average")
    private Double average;

    // Fields for postgraduate studies

    @Column(name = "thesisTopic")
    private String thesisTopic;

    // Fields for diplomas and training courses

    @Column(name = "hourlyLoad")
    private Integer hourlyLoad;

    @Column(name = "hadFinalEvaluation")
    private Boolean hadFinalEvaluation;

    // Fields for scientific activities

    @Column(name = "activityType")
    private String activityType;

    @Column(name = "topic")
    private String topic;

    @Column(name = "activityRole")
    private String activityRole;

    @Column(name = "expositionPlaceDate")
    private String expositionPlaceDate;

    @Column(name = "comments")
    private String comments;
} 