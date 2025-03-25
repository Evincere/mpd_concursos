package ar.gov.mpd.concursobackend.education.application.dto;

import java.time.LocalDate;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for education record responses
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class EducationResponseDto {
    
    private UUID id;
    
    private String type;
    private String status;
    private String title;
    private String institution;
    private LocalDate issueDate;
    private String documentUrl;
    
    // Fields for higher education and undergraduate degrees
    private Integer durationYears;
    private Double average;
    
    // Fields for postgraduate studies
    private String thesisTopic;
    
    // Fields for diplomas and training courses
    private Integer hourlyLoad;
    private Boolean hadFinalEvaluation;
    
    // Fields for scientific activities
    private String activityType;
    private String topic;
    private String activityRole;
    private String expositionPlaceDate;
    private String comments;
} 