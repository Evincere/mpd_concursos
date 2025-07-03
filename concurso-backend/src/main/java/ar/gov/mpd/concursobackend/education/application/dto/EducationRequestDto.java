package ar.gov.mpd.concursobackend.education.application.dto;

import ar.gov.mpd.concursobackend.education.application.validation.ValidEducationStatus;
import ar.gov.mpd.concursobackend.education.application.validation.ValidEducationType;
import ar.gov.mpd.concursobackend.education.application.validation.ValidScientificActivityRole;
import ar.gov.mpd.concursobackend.education.application.validation.ValidScientificActivityType;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * DTO for education record requests
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class EducationRequestDto {

    @NotBlank(message = "Education type is required")
    @ValidEducationType
    private String type;

    @NotBlank(message = "Status is required")
    @ValidEducationStatus
    private String status;

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Institution is required")
    private String institution;

    // Fechas del programa educativo
    private LocalDate startDate;

    private LocalDate endDate;

    @Past(message = "La fecha de emisión debe ser en el pasado")
    private LocalDate issueDate;

    // Fields for higher education and undergraduate degrees
    @Positive(message = "Duration must be a positive number")
    private Integer durationYears;

    @PositiveOrZero(message = "Average must be a positive number or zero")
    private Double average;

    // Fields for postgraduate studies
    private String thesisTopic;

    // Fields for diplomas and training courses
    @Positive(message = "Hourly load must be a positive number")
    private Integer hourlyLoad;

    private Boolean hadFinalEvaluation;

    // Fields for scientific activities
    @ValidScientificActivityType
    private String activityType;

    private String topic;

    @ValidScientificActivityRole
    private String activityRole;

    private String expositionPlaceDate;

    private String comments;
}