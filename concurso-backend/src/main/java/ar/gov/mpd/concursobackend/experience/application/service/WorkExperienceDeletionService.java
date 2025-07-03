package ar.gov.mpd.concursobackend.experience.application.service;

import ar.gov.mpd.concursobackend.experience.infrastructure.persistence.ExperienceRepository;
import ar.gov.mpd.concursobackend.experience.infrastructure.persistence.WorkExperienceEntity;
import ar.gov.mpd.concursobackend.shared.application.service.BaseCvDeletionService;
import ar.gov.mpd.concursobackend.shared.domain.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Service for handling work experience deletions with simplified logic
 * Extends the base deletion service to provide consistent behavior
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class WorkExperienceDeletionService extends BaseCvDeletionService<WorkExperienceEntity> {

    private final ExperienceRepository experienceRepository;
    // TODO: Inject DocumentDeletionService when implemented
    // private final DocumentDeletionService documentDeletionService;

    @Override
    protected void validateBusinessRules(UUID id, WorkExperienceEntity entity) {
        log.debug("Validating business rules for work experience deletion: {}", id);

        // Check if experience is not already deleted
        validateNotAlreadyDeleted(entity);

        // Check user ownership (currently logs warning due to missing user resolution)
        validateUserOwnership(entity);

        log.debug("Business rules validation completed for work experience: {}", id);
    }

    @Override
    protected void handleAssociatedDocuments(WorkExperienceEntity entity) {
        log.debug("Handling associated documents for work experience: {}", entity.getId());

        if (entity.getSupportingDocumentUrl() != null && !entity.getSupportingDocumentUrl().trim().isEmpty()) {
            try {
                UUID documentId = extractDocumentIdFromUrl(entity.getSupportingDocumentUrl());
                log.info("Found associated document {} for work experience {}", documentId, entity.getId());

                // TODO: Implement document deletion when DocumentDeletionService is available
                // documentDeletionService.markDocumentForDeletion(documentId, "Work experience deletion");
                
                log.warn("Document deletion not yet implemented - document {} will remain", documentId);

            } catch (Exception e) {
                log.warn("Failed to handle associated document for work experience {}: {}", 
                        entity.getId(), e.getMessage());
                // Don't fail the deletion if document handling fails
            }
        } else {
            log.debug("No associated documents found for work experience: {}", entity.getId());
        }
    }

    @Override
    protected String getEntityTypeName() {
        return "WorkExperience";
    }

    @Override
    protected WorkExperienceEntity findEntityOrThrow(UUID id) {
        log.debug("Finding work experience entity: {}", id);
        
        return experienceRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("Work experience not found: {}", id);
                    return new ResourceNotFoundException("Work experience not found with id: " + id);
                });
    }

    @Override
    protected WorkExperienceEntity saveEntity(WorkExperienceEntity entity) {
        log.debug("Saving work experience entity after soft deletion: {}", entity.getId());
        
        WorkExperienceEntity saved = experienceRepository.save(entity);
        
        log.debug("Work experience entity saved successfully: {}", saved.getId());
        return saved;
    }

    /**
     * Public method to delete a work experience by ID
     * Uses the current authenticated user as the deletedBy parameter
     * 
     * @param id The ID of the work experience to delete
     */
    public void deleteWorkExperience(UUID id) {
        String currentUser = getCurrentUserId();
        log.info("Deleting work experience {} by user: {}", id, currentUser);
        
        delete(id, currentUser);
    }

    /**
     * Public method to check if a work experience can be deleted
     * Performs validation without actually deleting
     * 
     * @param id The ID of the work experience to check
     * @return true if the experience can be deleted, false otherwise
     */
    public boolean canDelete(UUID id) {
        try {
            WorkExperienceEntity entity = findEntityOrThrow(id);
            validateBusinessRules(id, entity);
            return true;
        } catch (Exception e) {
            log.debug("Work experience {} cannot be deleted: {}", id, e.getMessage());
            return false;
        }
    }

    /**
     * Gets deletion information for a work experience
     * 
     * @param id The ID of the work experience
     * @return DeletionInfo containing deletion status and metadata
     */
    public DeletionInfo getDeletionInfo(UUID id) {
        WorkExperienceEntity entity = findEntityOrThrow(id);
        
        return DeletionInfo.builder()
                .id(id)
                .isDeleted(entity.getIsDeleted())
                .deletedAt(entity.getDeletedAt())
                .deletedBy(entity.getDeletedBy())
                .canRecover(entity.getIsDeleted() && isWithinRecoveryWindow(entity.getDeletedAt()))
                .hasAssociatedDocuments(entity.getSupportingDocumentUrl() != null)
                .build();
    }

    /**
     * Checks if the deletion is within the recovery window (24 hours)
     * 
     * @param deletedAt The deletion timestamp
     * @return true if within recovery window, false otherwise
     */
    private boolean isWithinRecoveryWindow(java.time.LocalDateTime deletedAt) {
        if (deletedAt == null) {
            return false;
        }
        
        java.time.LocalDateTime recoveryDeadline = deletedAt.plusHours(24);
        return java.time.LocalDateTime.now().isBefore(recoveryDeadline);
    }

    /**
     * Data class for deletion information
     */
    @lombok.Builder
    @lombok.Data
    public static class DeletionInfo {
        private UUID id;
        private Boolean isDeleted;
        private java.time.LocalDateTime deletedAt;
        private UUID deletedBy;
        private boolean canRecover;
        private boolean hasAssociatedDocuments;
    }
}
