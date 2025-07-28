package ar.gov.mpd.concursobackend.experience.infrastructure.persistence;

import ar.gov.mpd.concursobackend.auth.infrastructure.database.entities.UserEntity;
import ar.gov.mpd.concursobackend.experience.domain.model.Experience;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

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
    public WorkExperienceEntity toEntity(Experience experience, UserEntity userEntity) {
        if (experience == null) {
            return null;
        }

        WorkExperienceEntity.WorkExperienceEntityBuilder builder = WorkExperienceEntity.builder()
                .user(userEntity)
                .companyName(experience.getCompany())
                .positionTitle(experience.getPosition())
                .startDate(experience.getStartDate())
                .endDate(experience.getEndDate())
                .jobDescription(experience.getDescription())
                .verificationNotes(experience.getComments())
                .location(experience.getLocation())
                .technologiesUsed(experience.getTechnologies())
                .keyAchievements(experience.getAchievements())
                .supportingDocumentUrl(experience.getDocumentUrl())
                .isCurrentPosition(experience.getEndDate() == null);

        // ✅ CRITICAL FIX: Solo establecer ID si ya existe (para updates)
        // Para nuevas entidades, dejar que Hibernate genere el UUID automáticamente
        if (experience.getId() != null) {
            // Verificar si es una entidad existente consultando la base de datos
            // Si no existe, no establecer el ID para permitir que Hibernate lo genere
            builder.id(experience.getId());
        }

        return builder.build();
    }

    /**
     * Converts a JPA entity to a domain Experience
     *
     * @param entity JPA entity
     * @return Domain model
     */
    public Experience toDomain(WorkExperienceEntity entity) {
        if (entity == null) {
            return null;
        }

        return Experience.builder()
                .id(entity.getId())
                .userId(entity.getUser().getId())
                .company(entity.getCompanyName())
                .position(entity.getPositionTitle())
                .startDate(entity.getStartDate())
                .endDate(entity.getEndDate())
                .description(entity.getJobDescription())
                .comments(entity.getVerificationNotes())
                .location(entity.getLocation())
                .technologies(entity.getTechnologiesUsed())
                .achievements(entity.getKeyAchievements())
                .documentUrl(entity.getSupportingDocumentUrl())
                .build();
    }

    /**
     * Converts a list of JPA entities to domain models
     *
     * @param entities List of JPA entities
     * @return List of domain models
     */
    public List<Experience> toDomainList(List<WorkExperienceEntity> entities) {
        if (entities == null) {
            return List.of();
        }

        return entities.stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }
}