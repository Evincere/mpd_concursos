package ar.gov.mpd.concursobackend.education.application.service;

import java.io.InputStream;
import java.util.List;
import java.util.UUID;

import ar.gov.mpd.concursobackend.education.application.dto.EducationRequestDto;
import ar.gov.mpd.concursobackend.education.application.dto.EducationResponseDto;

/**
 * Service interface for managing education records
 */
public interface EducationService {
    
    /**
     * Get all education records for a user
     * 
     * @param userId the user ID
     * @return list of education records
     */
    List<EducationResponseDto> getAllEducationByUserId(UUID userId);
    
    /**
     * Get an education record by ID
     * 
     * @param id the education record ID
     * @return the education record
     */
    EducationResponseDto getEducationById(UUID id);
    
    /**
     * Create a new education record
     * 
     * @param userId the user ID
     * @param educationDto the education data
     * @return the created education record
     */
    EducationResponseDto createEducation(UUID userId, EducationRequestDto educationDto);
    
    /**
     * Update an existing education record
     * 
     * @param id the education record ID
     * @param educationDto the updated education data
     * @return the updated education record
     */
    EducationResponseDto updateEducation(UUID id, EducationRequestDto educationDto);
    
    /**
     * Delete an education record
     * 
     * @param id the education record ID
     */
    void deleteEducation(UUID id);
    
    /**
     * Upload a document for an education record
     * 
     * @param id the education record ID
     * @param inputStream the document input stream
     * @param filename the original filename
     * @return the updated education record
     */
    EducationResponseDto uploadDocument(UUID id, InputStream inputStream, String filename);
} 