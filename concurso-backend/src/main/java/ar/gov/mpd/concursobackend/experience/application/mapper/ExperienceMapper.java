package ar.gov.mpd.concursobackend.experience.application.mapper;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import ar.gov.mpd.concursobackend.experience.application.dto.ExperienceRequestDto;
import ar.gov.mpd.concursobackend.experience.application.dto.ExperienceResponseDto;
import ar.gov.mpd.concursobackend.experience.domain.model.Experience;

/**
 * Mapper for converting between Experience domain model and DTOs
 */
@Component
public class ExperienceMapper {

    /**
     * Converts a domain Experience to a ResponseDTO
     */
    public ExperienceResponseDto toResponseDto(Experience experience) {
        if (experience == null) {
            return null;
        }

        return ExperienceResponseDto.builder()
                .id(experience.getId())
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
     * Converts a list of domain Experiences to ResponseDTOs
     */
    public List<ExperienceResponseDto> toResponseDtoList(List<Experience> experiences) {
        if (experiences == null) {
            return List.of();
        }

        return experiences.stream()
                .map(this::toResponseDto)
                .collect(Collectors.toList());
    }

    /**
     * Creates a domain Experience from a RequestDTO and userId
     */
    public Experience toDomain(ExperienceRequestDto dto, UUID userId) {
        if (dto == null) {
            return null;
        }

        return Experience.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .company(dto.getCompany())
                .position(dto.getPosition())
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .description(dto.getDescription())
                .comments(dto.getComments())
                .build();
    }

    /**
     * Updates a domain Experience from a RequestDTO
     */
    public Experience updateDomainFromDto(Experience experience, ExperienceRequestDto dto) {
        if (dto == null || experience == null) {
            return experience;
        }

        experience.setCompany(dto.getCompany());
        experience.setPosition(dto.getPosition());
        experience.setStartDate(dto.getStartDate());
        experience.setEndDate(dto.getEndDate());
        experience.setDescription(dto.getDescription());
        experience.setComments(dto.getComments());

        return experience;
    }
}