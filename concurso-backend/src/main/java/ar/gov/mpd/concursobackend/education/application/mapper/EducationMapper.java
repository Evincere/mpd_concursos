package ar.gov.mpd.concursobackend.education.application.mapper;

import ar.gov.mpd.concursobackend.education.application.dto.EducationRequestDto;
import ar.gov.mpd.concursobackend.education.application.dto.EducationResponseDto;
import ar.gov.mpd.concursobackend.education.domain.model.*;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Mapper for converting between Education domain entities and DTOs
 */
@Component
public class EducationMapper {
    
    /**
     * Convert a domain entity to a response DTO
     */
    public EducationResponseDto toResponseDto(Education education) {
        if (education == null) {
            return null;
        }
        
        EducationResponseDto.EducationResponseDtoBuilder builder = EducationResponseDto.builder()
                .id(education.getId())
                .type(education.getType().getDisplayName())
                .status(education.getStatus().getDisplayName())
                .title(education.getTitle())
                .institution(education.getInstitution())
                .startDate(education.getStartDate())
                .endDate(education.getEndDate())
                .issueDate(education.getIssueDate())
                .documentUrl(education.getDocumentUrl());
        
        // Set fields based on education type
        switch (education.getType()) {
            case SECONDARY:
                // Educación secundaria no requiere campos adicionales específicos
                break;

            case HIGHER_EDUCATION_CAREER:
            case UNDERGRADUATE_CAREER:
                builder.durationYears(education.getDurationYears())
                       .average(education.getAverage());
                break;

            case POSTGRADUATE_SPECIALIZATION:
            case POSTGRADUATE_MASTERS:
            case POSTGRADUATE_DOCTORATE:
                builder.thesisTopic(education.getThesisTopic());
                break;

            case DIPLOMA:
            case TRAINING_COURSE:
                builder.hourlyLoad(education.getHourlyLoad())
                       .hadFinalEvaluation(education.getHadFinalEvaluation());
                break;

            case SCIENTIFIC_ACTIVITY:
                if (education.getActivityType() != null) {
                    builder.activityType(education.getActivityType().getDisplayName());
                }
                
                builder.topic(education.getTopic());
                
                if (education.getActivityRole() != null) {
                    builder.activityRole(education.getActivityRole().getDisplayName());
                }
                
                builder.expositionPlaceDate(education.getExpositionPlaceDate())
                       .comments(education.getComments());
                break;
        }
        
        return builder.build();
    }
    
    /**
     * Convert a list of domain entities to response DTOs
     */
    public List<EducationResponseDto> toResponseDtoList(List<Education> educationList) {
        return educationList.stream()
                .map(this::toResponseDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Convert a request DTO to a domain entity
     */
    public Education toDomainEntity(EducationRequestDto dto, UUID userId) {
        if (dto == null) {
            return null;
        }
        
        EducationType type = EducationType.fromDisplayName(dto.getType());
        EducationStatus status = EducationStatus.fromDisplayName(dto.getStatus());
        
        Education.EducationBuilder builder = Education.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .type(type)
                .status(status)
                .title(dto.getTitle())
                .institution(dto.getInstitution())
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .issueDate(dto.getIssueDate());
        
        // Set fields based on education type
        switch (type) {
            case SECONDARY:
                // Educación secundaria no requiere campos adicionales específicos
                break;

            case HIGHER_EDUCATION_CAREER:
            case UNDERGRADUATE_CAREER:
                builder.durationYears(dto.getDurationYears())
                      .average(dto.getAverage());
                break;

            case POSTGRADUATE_SPECIALIZATION:
            case POSTGRADUATE_MASTERS:
            case POSTGRADUATE_DOCTORATE:
                builder.thesisTopic(dto.getThesisTopic());
                break;

            case DIPLOMA:
            case TRAINING_COURSE:
                builder.hourlyLoad(dto.getHourlyLoad())
                      .hadFinalEvaluation(dto.getHadFinalEvaluation());
                break;
                
            case SCIENTIFIC_ACTIVITY:
                if (dto.getActivityType() != null) {
                    builder.activityType(ScientificActivityType.fromDisplayName(dto.getActivityType()));
                }
                
                builder.topic(dto.getTopic());
                
                if (dto.getActivityRole() != null) {
                    builder.activityRole(ScientificActivityRole.fromDisplayName(dto.getActivityRole()));
                }
                
                builder.expositionPlaceDate(dto.getExpositionPlaceDate())
                      .comments(dto.getComments());
                break;
        }
        
        return builder.build();
    }
    
    /**
     * Update an existing domain entity with values from a request DTO
     */
    public Education updateEntityFromDto(Education education, EducationRequestDto dto) {
        if (dto == null) {
            return education;
        }
        
        EducationType type = EducationType.fromDisplayName(dto.getType());
        EducationStatus status = EducationStatus.fromDisplayName(dto.getStatus());
        
        // Create a new builder with the existing ID and user ID
        Education.EducationBuilder builder = Education.builder()
                .id(education.getId())
                .userId(education.getUserId())
                .type(type)
                .status(status)
                .title(dto.getTitle())
                .institution(dto.getInstitution())
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .issueDate(dto.getIssueDate());
        
        // Set fields based on education type
        switch (type) {
            case SECONDARY:
                // Educación secundaria no requiere campos adicionales específicos
                break;

            case HIGHER_EDUCATION_CAREER:
            case UNDERGRADUATE_CAREER:
                builder.durationYears(dto.getDurationYears())
                      .average(dto.getAverage());
                break;

            case POSTGRADUATE_SPECIALIZATION:
            case POSTGRADUATE_MASTERS:
            case POSTGRADUATE_DOCTORATE:
                builder.thesisTopic(dto.getThesisTopic());
                break;

            case DIPLOMA:
            case TRAINING_COURSE:
                builder.hourlyLoad(dto.getHourlyLoad())
                      .hadFinalEvaluation(dto.getHadFinalEvaluation());
                break;
                
            case SCIENTIFIC_ACTIVITY:
                if (dto.getActivityType() != null) {
                    builder.activityType(ScientificActivityType.fromDisplayName(dto.getActivityType()));
                }
                
                builder.topic(dto.getTopic());
                
                if (dto.getActivityRole() != null) {
                    builder.activityRole(ScientificActivityRole.fromDisplayName(dto.getActivityRole()));
                }
                
                builder.expositionPlaceDate(dto.getExpositionPlaceDate())
                      .comments(dto.getComments());
                break;
        }
        
        return builder.build();
    }
} 