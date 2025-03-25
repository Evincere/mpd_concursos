package ar.gov.mpd.concursobackend.education.infrastructure.persistence.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import ar.gov.mpd.concursobackend.education.domain.model.Education;
import ar.gov.mpd.concursobackend.education.domain.model.EducationStatus;
import ar.gov.mpd.concursobackend.education.domain.model.EducationType;
import ar.gov.mpd.concursobackend.education.domain.model.ScientificActivityRole;
import ar.gov.mpd.concursobackend.education.domain.model.ScientificActivityType;
import ar.gov.mpd.concursobackend.education.domain.repository.EducationRepository;
import ar.gov.mpd.concursobackend.education.infrastructure.persistence.entity.EducationEntity;
import lombok.RequiredArgsConstructor;

/**
 * Adapter for EducationRepository that uses JPA
 */
@Component
@RequiredArgsConstructor
public class EducationRepositoryAdapter implements EducationRepository {
    
    private final JpaEducationRepository jpaRepository;
    
    @Override
    public Education save(Education education) {
        EducationEntity entity = toEntity(education);
        EducationEntity savedEntity = jpaRepository.save(entity);
        return toDomainModel(savedEntity);
    }
    
    @Override
    public Optional<Education> findById(UUID id) {
        return jpaRepository.findById(id)
                .map(this::toDomainModel);
    }
    
    @Override
    public List<Education> findAllByUserId(UUID userId) {
        return jpaRepository.findAllByUserId(userId)
                .stream()
                .map(this::toDomainModel)
                .collect(Collectors.toList());
    }
    
    @Override
    public void deleteById(UUID id) {
        jpaRepository.deleteById(id);
    }
    
    @Override
    public boolean existsById(UUID id) {
        return jpaRepository.existsById(id);
    }
    
    /**
     * Convert a domain model to a JPA entity
     */
    private EducationEntity toEntity(Education education) {
        if (education == null) {
            return null;
        }
        
        EducationEntity.EducationEntityBuilder builder = EducationEntity.builder()
                .id(education.getId())
                .userId(education.getUserId())
                .type(education.getType().getDisplayName())
                .status(education.getStatus().getDisplayName())
                .title(education.getTitle())
                .institution(education.getInstitution())
                .issueDate(education.getIssueDate())
                .documentUrl(education.getDocumentUrl())
                .durationYears(education.getDurationYears())
                .average(education.getAverage())
                .thesisTopic(education.getThesisTopic())
                .hourlyLoad(education.getHourlyLoad())
                .hadFinalEvaluation(education.getHadFinalEvaluation())
                .topic(education.getTopic())
                .expositionPlaceDate(education.getExpositionPlaceDate())
                .comments(education.getComments());
        
        if (education.getActivityType() != null) {
            builder.activityType(education.getActivityType().getDisplayName());
        }
        
        if (education.getActivityRole() != null) {
            builder.activityRole(education.getActivityRole().getDisplayName());
        }
        
        return builder.build();
    }
    
    /**
     * Convert a JPA entity to a domain model
     */
    private Education toDomainModel(EducationEntity entity) {
        if (entity == null) {
            return null;
        }
        
        EducationType type = EducationType.fromDisplayName(entity.getType());
        EducationStatus status = EducationStatus.fromDisplayName(entity.getStatus());
        
        Education.EducationBuilder builder = Education.builder()
                .id(entity.getId())
                .userId(entity.getUserId())
                .type(type)
                .status(status)
                .title(entity.getTitle())
                .institution(entity.getInstitution())
                .issueDate(entity.getIssueDate())
                .documentUrl(entity.getDocumentUrl())
                .durationYears(entity.getDurationYears())
                .average(entity.getAverage())
                .thesisTopic(entity.getThesisTopic())
                .hourlyLoad(entity.getHourlyLoad())
                .hadFinalEvaluation(entity.getHadFinalEvaluation())
                .topic(entity.getTopic())
                .expositionPlaceDate(entity.getExpositionPlaceDate())
                .comments(entity.getComments());
        
        // Convert the string values to enums for the activity
        if (entity.getActivityType() != null) {
            try {
                builder.activityType(ScientificActivityType.fromDisplayName(entity.getActivityType()));
            } catch (IllegalArgumentException e) {
                // Log or handle invalid activity type
            }
        }
        
        if (entity.getActivityRole() != null) {
            try {
                builder.activityRole(ScientificActivityRole.fromDisplayName(entity.getActivityRole()));
            } catch (IllegalArgumentException e) {
                // Log or handle invalid activity role
            }
        }
        
        return builder.build();
    }
} 