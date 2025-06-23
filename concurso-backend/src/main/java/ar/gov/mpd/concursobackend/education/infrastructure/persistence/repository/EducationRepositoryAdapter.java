package ar.gov.mpd.concursobackend.education.infrastructure.persistence.repository;

import java.math.BigDecimal;
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
import ar.gov.mpd.concursobackend.education.infrastructure.persistence.entity.EducationRecordEntity;
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
        EducationRecordEntity entity = toEntity(education);
        EducationRecordEntity savedEntity = jpaRepository.save(entity);
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
    private EducationRecordEntity toEntity(Education education) {
        if (education == null) {
            return null;
        }

        EducationRecordEntity.EducationRecordEntityBuilder builder = EducationRecordEntity.builder()
                .id(education.getId())
                .programTitle(education.getTitle())
                .institutionName(education.getInstitution())
                .issueDate(education.getIssueDate())
                .supportingDocumentUrl(education.getDocumentUrl())
                .durationYears(education.getDurationYears())
                .finalGrade(education.getAverage() != null ? BigDecimal.valueOf(education.getAverage()) : null)
                .thesisTopic(education.getThesisTopic())
                .durationHours(education.getHourlyLoad())
                .presentationLocation(education.getExpositionPlaceDate())
                .comments(education.getComments());

        // Map education type
        if (education.getType() != null) {
            builder.educationType(mapToEntityEducationType(education.getType()));
        }

        // Map education status
        if (education.getStatus() != null) {
            builder.educationStatus(mapToEntityEducationStatus(education.getStatus()));
        }

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
    private Education toDomainModel(EducationRecordEntity entity) {
        if (entity == null) {
            return null;
        }

        EducationType type = mapFromEntityEducationType(entity.getEducationType());
        EducationStatus status = mapFromEntityEducationStatus(entity.getEducationStatus());

        Education.EducationBuilder builder = Education.builder()
                .id(entity.getId())
                .userId(entity.getUser() != null ? entity.getUser().getId() : null)
                .type(type)
                .status(status)
                .title(entity.getProgramTitle())
                .institution(entity.getInstitutionName())
                .issueDate(entity.getIssueDate())
                .documentUrl(entity.getSupportingDocumentUrl())
                .durationYears(entity.getDurationYears())
                .average(entity.getFinalGrade() != null ? entity.getFinalGrade().doubleValue() : null)
                .thesisTopic(entity.getThesisTopic())
                .hourlyLoad(entity.getDurationHours())
                .expositionPlaceDate(entity.getPresentationLocation())
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

    /**
     * Map domain EducationType to entity EducationType
     */
    private EducationRecordEntity.EducationType mapToEntityEducationType(EducationType domainType) {
        if (domainType == null) {
            return null;
        }

        switch (domainType) {
            case HIGHER_EDUCATION_DEGREE:
                return EducationRecordEntity.EducationType.TECHNICAL_DEGREE;
            case UNDERGRADUATE_DEGREE:
                return EducationRecordEntity.EducationType.UNIVERSITY_DEGREE;
            case POSTGRADUATE_SPECIALIZATION:
                return EducationRecordEntity.EducationType.POSTGRADUATE_DEGREE;
            case POSTGRADUATE_MASTERS:
                return EducationRecordEntity.EducationType.MASTER_DEGREE;
            case POSTGRADUATE_DOCTORATE:
                return EducationRecordEntity.EducationType.DOCTORAL_DEGREE;
            case DIPLOMA:
                return EducationRecordEntity.EducationType.DIPLOMA;
            case TRAINING_COURSE:
                return EducationRecordEntity.EducationType.TRAINING_COURSE;
            case SCIENTIFIC_ACTIVITY:
                return EducationRecordEntity.EducationType.SCIENTIFIC_ACTIVITY;
            default:
                throw new IllegalArgumentException("Unknown education type: " + domainType);
        }
    }

    /**
     * Map domain EducationStatus to entity EducationStatus
     */
    private EducationRecordEntity.EducationStatus mapToEntityEducationStatus(EducationStatus domainStatus) {
        if (domainStatus == null) {
            return null;
        }

        switch (domainStatus) {
            case IN_PROGRESS:
                return EducationRecordEntity.EducationStatus.IN_PROGRESS;
            case COMPLETED:
                return EducationRecordEntity.EducationStatus.COMPLETED;
            case ABANDONED:
                return EducationRecordEntity.EducationStatus.ABANDONED;
            default:
                throw new IllegalArgumentException("Unknown education status: " + domainStatus);
        }
    }

    /**
     * Map entity EducationType to domain EducationType
     */
    private EducationType mapFromEntityEducationType(EducationRecordEntity.EducationType entityType) {
        if (entityType == null) {
            return null;
        }

        switch (entityType) {
            case TECHNICAL_DEGREE:
                return EducationType.HIGHER_EDUCATION_DEGREE;
            case UNIVERSITY_DEGREE:
                return EducationType.UNDERGRADUATE_DEGREE;
            case POSTGRADUATE_DEGREE:
                return EducationType.POSTGRADUATE_SPECIALIZATION;
            case MASTER_DEGREE:
                return EducationType.POSTGRADUATE_MASTERS;
            case DOCTORAL_DEGREE:
                return EducationType.POSTGRADUATE_DOCTORATE;
            case DIPLOMA:
                return EducationType.DIPLOMA;
            case TRAINING_COURSE:
                return EducationType.TRAINING_COURSE;
            case SCIENTIFIC_ACTIVITY:
                return EducationType.SCIENTIFIC_ACTIVITY;
            // For entity types that don't have direct domain equivalents, map to closest match
            case PRIMARY_EDUCATION:
            case SECONDARY_EDUCATION:
            case CERTIFICATION:
                return EducationType.TRAINING_COURSE; // Default mapping
            default:
                throw new IllegalArgumentException("Unknown entity education type: " + entityType);
        }
    }

    /**
     * Map entity EducationStatus to domain EducationStatus
     */
    private EducationStatus mapFromEntityEducationStatus(EducationRecordEntity.EducationStatus entityStatus) {
        if (entityStatus == null) {
            return null;
        }

        switch (entityStatus) {
            case IN_PROGRESS:
                return EducationStatus.IN_PROGRESS;
            case COMPLETED:
                return EducationStatus.COMPLETED;
            case ABANDONED:
                return EducationStatus.ABANDONED;
            case SUSPENDED:
                return EducationStatus.ABANDONED; // Map SUSPENDED to ABANDONED as closest match
            default:
                throw new IllegalArgumentException("Unknown entity education status: " + entityStatus);
        }
    }
}