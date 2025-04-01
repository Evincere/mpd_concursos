package ar.gov.mpd.concursobackend.experience.infrastructure.persistence;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import ar.gov.mpd.concursobackend.auth.infrastructure.database.entities.UserEntity;
import ar.gov.mpd.concursobackend.experience.domain.model.Experience;

/**
 * Mapper for converting between Experience domain model and JPA entity
 */
@Component
public class ExperienceEntityMapper {

    /**
     * Converts a domain Experience to a JPA entity
     * 
     * @param experience Domain model
     * @param userEntity User entity to associate with the experience
     * @return JPA entity
     */
    public ExperienceEntity toEntity(Experience experience, UserEntity userEntity) {
        if (experience == null) {
            return null;
        }

        return ExperienceEntity.builder()
                .id(experience.getId())
                .user(userEntity)
                .company(experience.getCompany())
                .position(experience.getPosition())
                .startDate(experience.getStartDate())
                .endDate(experience.getEndDate())
                .description(experience.getDescription())
                .comments(experience.getComments())
                .documentUrl(experience.getDocumentUrl())
                .build();
    }

    /**
     * Converts a JPA entity to a domain Experience
     * 
     * @param entity JPA entity
     * @return Domain model
     */
    public Experience toDomain(ExperienceEntity entity) {
        if (entity == null) {
            return null;
        }

        return Experience.builder()
                .id(entity.getId())
                .userId(entity.getUser().getId())
                .company(entity.getCompany())
                .position(entity.getPosition())
                .startDate(entity.getStartDate())
                .endDate(entity.getEndDate())
                .description(entity.getDescription())
                .comments(entity.getComments())
                .documentUrl(entity.getDocumentUrl())
                .build();
    }

    /**
     * Converts a list of JPA entities to domain models
     * 
     * @param entities List of JPA entities
     * @return List of domain models
     */
    public List<Experience> toDomainList(List<ExperienceEntity> entities) {
        if (entities == null) {
            return List.of();
        }

        return entities.stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }
}