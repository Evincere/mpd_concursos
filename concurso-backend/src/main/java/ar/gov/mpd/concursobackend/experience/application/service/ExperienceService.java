package ar.gov.mpd.concursobackend.experience.application.service;

import java.io.InputStream;
import java.util.List;
import java.util.UUID;

import ar.gov.mpd.concursobackend.experience.application.dto.ExperienceRequestDto;
import ar.gov.mpd.concursobackend.experience.application.dto.ExperienceResponseDto;

/**
 * Service interface for managing work experiences
 */
public interface ExperienceService {

    /**
     * Get all experiences for a user
     * 
     * @param userId User's UUID
     * @return List of experiences
     */
    List<ExperienceResponseDto> getAllExperiencesByUserId(UUID userId);

    /**
     * Get a specific experience by ID
     * 
     * @param id Experience UUID
     * @return Experience data
     */
    ExperienceResponseDto getExperienceById(UUID id);

    /**
     * Create a new experience for a user
     * 
     * @param userId        User's UUID
     * @param experienceDto Experience data
     * @return Created experience
     */
    ExperienceResponseDto createExperience(UUID userId, ExperienceRequestDto experienceDto);

    /**
     * Update an existing experience
     * 
     * @param id            Experience UUID
     * @param experienceDto New experience data
     * @return Updated experience
     */
    ExperienceResponseDto updateExperience(UUID id, ExperienceRequestDto experienceDto);

    /**
     * Delete an experience
     * 
     * @param id Experience UUID
     */
    void deleteExperience(UUID id);

    /**
     * Upload a document for an experience
     * 
     * @param id          Experience UUID
     * @param inputStream Document input stream
     * @param filename    Original filename
     * @return Updated experience
     */
    ExperienceResponseDto uploadDocument(UUID id, InputStream inputStream, String filename);
}