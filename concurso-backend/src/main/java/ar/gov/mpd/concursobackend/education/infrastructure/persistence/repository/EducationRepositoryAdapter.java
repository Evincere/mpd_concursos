package ar.gov.mpd.concursobackend.education.infrastructure.persistence.repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import ar.gov.mpd.concursobackend.auth.infrastructure.database.entities.UserEntity;
import ar.gov.mpd.concursobackend.auth.infrastructure.database.repository.spring.IUserSpringRepository;
import ar.gov.mpd.concursobackend.education.domain.model.Education;
import ar.gov.mpd.concursobackend.education.domain.model.EducationStatus;
import ar.gov.mpd.concursobackend.education.domain.model.EducationType;
import ar.gov.mpd.concursobackend.education.domain.model.ScientificActivityRole;
import ar.gov.mpd.concursobackend.education.domain.model.ScientificActivityType;
import ar.gov.mpd.concursobackend.education.domain.repository.EducationRepository;
import ar.gov.mpd.concursobackend.education.infrastructure.persistence.entity.EducationRecordEntity;
import ar.gov.mpd.concursobackend.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;

/**
 * Adapter for EducationRepository that uses JPA
 */
@Component
@RequiredArgsConstructor
public class EducationRepositoryAdapter implements EducationRepository {

    private final JpaEducationRepository jpaRepository;
    private final IUserSpringRepository userRepository;
    
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

        // Buscar el usuario por ID
        UserEntity userEntity = null;
        if (education.getUserId() != null) {
            userEntity = userRepository.findById(education.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + education.getUserId()));
        }

        EducationRecordEntity.EducationRecordEntityBuilder builder = EducationRecordEntity.builder()
                .id(education.getId())
                .user(userEntity)  // Asignar la entidad de usuario
                .programTitle(education.getTitle())
                .institutionName(education.getInstitution())
                .startDate(education.getStartDate())
                .endDate(education.getEndDate())
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
                .startDate(entity.getStartDate())
                .endDate(entity.getEndDate())
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
     * Map domain EducationType to entity EducationType using unified mapping
     */
    private EducationRecordEntity.EducationType mapToEntityEducationType(EducationType domainType) {
        if (domainType == null) {
            return null;
        }
        return domainType.getPersistenceType();
    }

    /**
     * Map domain EducationStatus to entity EducationStatus using unified mapping
     */
    private EducationRecordEntity.EducationStatus mapToEntityEducationStatus(EducationStatus domainStatus) {
        if (domainStatus == null) {
            return null;
        }
        return domainStatus.getPersistenceStatus();
    }

    /**
     * Map entity EducationType to domain EducationType using unified mapping
     */
    private EducationType mapFromEntityEducationType(EducationRecordEntity.EducationType entityType) {
        if (entityType == null) {
            return null;
        }

        try {
            return EducationType.fromPersistenceType(entityType);
        } catch (IllegalArgumentException e) {
            // For entity types that don't have direct domain equivalents, map to closest match
            switch (entityType) {
                case PRIMARY_EDUCATION:
                case CERTIFICATION:
                    return EducationType.TRAINING_COURSE; // Default mapping
                default:
                    throw new IllegalArgumentException("Unknown entity education type: " + entityType);
            }
        }
    }

    /**
     * Map entity EducationStatus to domain EducationStatus using unified mapping
     */
    private EducationStatus mapFromEntityEducationStatus(EducationRecordEntity.EducationStatus entityStatus) {
        if (entityStatus == null) {
            return null;
        }

        try {
            return EducationStatus.fromPersistenceStatus(entityStatus);
        } catch (IllegalArgumentException e) {
            // Map legacy statuses to closest match
            switch (entityStatus) {
                case ABANDONED:
                case SUSPENDED:
                    return EducationStatus.IN_PROGRESS; // Map legacy statuses to IN_PROGRESS as closest match
                default:
                    throw new IllegalArgumentException("Unknown entity education status: " + entityStatus);
            }
        }
    }
}