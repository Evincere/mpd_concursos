package ar.gov.mpd.concursobackend.experience.infrastructure.adapter;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import ar.gov.mpd.concursobackend.auth.application.dto.ExperienciaDto;
import ar.gov.mpd.concursobackend.auth.domain.model.Experiencia;
import ar.gov.mpd.concursobackend.experience.application.service.ExperienceService;
import ar.gov.mpd.concursobackend.experience.application.dto.ExperienceRequestDto;
import ar.gov.mpd.concursobackend.experience.application.dto.ExperienceResponseDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Adapter to integrate the new Experience module with the existing UserProfile
 * system.
 * This acts as a bridge between the old data model and the new one.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class UserProfileExperienceAdapter {

    private final ExperienceService experienceService;

    /**
     * Converts from the legacy DTO to our new domain model
     */
    public ExperienceRequestDto toExperienceRequestDto(ExperienciaDto legacyDto) {
        if (legacyDto == null) {
            return null;
        }

        return ExperienceRequestDto.builder()
                .company(legacyDto.getEmpresa())
                .position(legacyDto.getCargo())
                .startDate(parseDate(legacyDto.getFechaInicio()))
                .endDate(parseDate(legacyDto.getFechaFin()))
                .description(legacyDto.getDescripcion())
                .comments(legacyDto.getComentario())
                .build();
    }

    /**
     * Converts from our new response DTO to the legacy domain model
     */
    public Experiencia toLegacyDomain(ExperienceResponseDto responseDto) {
        if (responseDto == null) {
            return null;
        }

        Experiencia legacy = new Experiencia();
        legacy.setEmpresa(responseDto.getCompany());
        legacy.setCargo(responseDto.getPosition());
        legacy.setFechaInicio(responseDto.getStartDate());
        legacy.setFechaFin(responseDto.getEndDate());
        legacy.setDescripcion(responseDto.getDescription());
        legacy.setComentario(responseDto.getComments());

        return legacy;
    }

    /**
     * Converts from the legacy domain model to our new request DTO
     */
    public ExperienceRequestDto fromLegacyDomain(Experiencia legacy) {
        if (legacy == null) {
            return null;
        }

        return ExperienceRequestDto.builder()
                .company(legacy.getEmpresa())
                .position(legacy.getCargo())
                .startDate(legacy.getFechaInicio())
                .endDate(legacy.getFechaFin())
                .description(legacy.getDescripcion())
                .comments(legacy.getComentario())
                .build();
    }

    /**
     * Converts from our new response DTO to the legacy DTO model
     */
    public ExperienciaDto toLegacyDto(ExperienceResponseDto responseDto) {
        if (responseDto == null) {
            return null;
        }

        ExperienciaDto legacy = new ExperienciaDto();
        legacy.setEmpresa(responseDto.getCompany());
        legacy.setCargo(responseDto.getPosition());
        legacy.setFechaInicio(responseDto.getStartDate() != null ? responseDto.getStartDate().toString() : null);
        legacy.setFechaFin(responseDto.getEndDate() != null ? responseDto.getEndDate().toString() : null);
        legacy.setDescripcion(responseDto.getDescription());
        legacy.setComentario(responseDto.getComments());

        return legacy;
    }

    /**
     * Synchronizes legacy experiences with the new experience system
     */
    public List<Experiencia> syncLegacyExperiences(List<ExperienciaDto> legacyDtos, UUID userId) {
        if (legacyDtos == null || legacyDtos.isEmpty()) {
            return new ArrayList<>();
        }

        log.info("Synchronizing {} experiences for user {}", legacyDtos.size(), userId);

        // Process each legacy DTO
        List<ExperienceResponseDto> updatedExperiences = new ArrayList<>();

        for (ExperienciaDto legacyDto : legacyDtos) {
            ExperienceRequestDto requestDto = toExperienceRequestDto(legacyDto);

            // This is a simplified approach. In a real system, we'd need a more
            // sophisticated
            // way to match existing experiences with incoming ones.
            ExperienceResponseDto createdExperience = experienceService.createExperience(userId, requestDto);
            updatedExperiences.add(createdExperience);
        }

        // Convert back to legacy domain model for compatibility
        return updatedExperiences.stream()
                .map(this::toLegacyDomain)
                .collect(Collectors.toList());
    }

    /**
     * Helper method to parse a date string
     */
    private LocalDate parseDate(String dateStr) {
        if (dateStr == null || dateStr.isEmpty()) {
            return null;
        }
        try {
            return LocalDate.parse(dateStr);
        } catch (Exception e) {
            log.warn("Could not parse date: {}", dateStr);
            return null;
        }
    }
}