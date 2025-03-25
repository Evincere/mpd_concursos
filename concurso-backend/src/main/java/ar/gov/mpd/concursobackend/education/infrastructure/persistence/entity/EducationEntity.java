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
    
    @Column(name = "user_id", nullable = false)
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
    
    @Column(name = "issue_date")
    private LocalDate issueDate;
    
    @Column(name = "document_url")
    private String documentUrl;
    
    // Fields for higher education and undergraduate degrees
    
    @Column(name = "duration_years")
    private Integer durationYears;
    
    @Column(name = "average")
    private Double average;
    
    // Fields for postgraduate studies
    
    @Column(name = "thesis_topic")
    private String thesisTopic;
    
    // Fields for diplomas and training courses
    
    @Column(name = "hourly_load")
    private Integer hourlyLoad;
    
    @Column(name = "had_final_evaluation")
    private Boolean hadFinalEvaluation;
    
    // Fields for scientific activities
    
    @Column(name = "activity_type")
    private String activityType;
    
    @Column(name = "topic")
    private String topic;
    
    @Column(name = "activity_role")
    private String activityRole;
    
    @Column(name = "exposition_place_date")
    private String expositionPlaceDate;
    
    @Column(name = "comments")
    private String comments;
} 