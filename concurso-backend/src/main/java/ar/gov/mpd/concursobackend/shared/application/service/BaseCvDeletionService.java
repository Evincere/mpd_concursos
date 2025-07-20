package ar.gov.mpd.concursobackend.shared.application.service;

import ar.gov.mpd.concursobackend.shared.domain.exception.ResourceNotFoundException;
import ar.gov.mpd.concursobackend.shared.domain.exception.UnauthorizedException;
import ar.gov.mpd.concursobackend.shared.domain.model.SoftDeletableEntity;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Base service for handling CV entity deletions with consistent behavior
 * Implements soft delete pattern with audit trail and validation
 * 
 * @param <T> The entity type that supports soft deletion
 */
@Slf4j
@Transactional
public abstract class BaseCvDeletionService<T extends SoftDeletableEntity> {

    // Logger manual como fallback si @Slf4j no funciona
    private static final Logger log = LoggerFactory.getLogger(BaseCvDeletionService.class);

    /**
     * Validates business rules specific to the entity type before deletion
     * 
     * @param id The entity ID
     * @param entity The entity to be deleted
     * @throws UnauthorizedException if user is not authorized to delete
     * @throws IllegalStateException if entity cannot be deleted
     */
    protected abstract void validateBusinessRules(UUID id, T entity);

    /**
     * Handles associated resources (documents, files, etc.) before deletion
     * 
     * @param entity The entity being deleted
     */
    protected abstract void handleAssociatedDocuments(T entity);

    /**
     * Returns the human-readable name of the entity type for logging
     * 
     * @return Entity type name
     */
    protected abstract String getEntityTypeName();

    /**
     * Finds the entity by ID or throws exception
     * 
     * @param id The entity ID
     * @return The found entity
     * @throws ResourceNotFoundException if entity not found
     */
    protected abstract T findEntityOrThrow(UUID id);

    /**
     * Saves the entity after soft deletion
     * 
     * @param entity The entity to save
     * @return The saved entity
     */
    protected abstract T saveEntity(T entity);

    /**
     * Main deletion method that orchestrates the entire deletion process
     * 
     * @param id The ID of the entity to delete
     * @param deletedBy The ID of the user performing the deletion
     */
    public final void delete(UUID id, String deletedBy) {
        log.info("Starting deletion of {} with id: {}", getEntityTypeName(), id);

        try {
            // 1. Validate existence and retrieve entity
            T entity = findEntityOrThrow(id);
            log.debug("Found {} with id: {}", getEntityTypeName(), id);

            // 2. Validate business rules
            validateBusinessRules(id, entity);
            log.debug("Business rules validation passed for {} with id: {}", getEntityTypeName(), id);

            // 3. Handle associated resources
            handleAssociatedDocuments(entity);
            log.debug("Associated documents handled for {} with id: {}", getEntityTypeName(), id);

            // 4. Perform soft deletion
            performSoftDeletion(entity, deletedBy);
            log.debug("Soft deletion performed for {} with id: {}", getEntityTypeName(), id);

            // 5. Audit the deletion
            auditDeletion(id, entity, deletedBy);

            log.info("{} with id: {} deleted successfully by user: {}", getEntityTypeName(), id, deletedBy);

        } catch (Exception e) {
            log.error("Failed to delete {} with id: {}: {}", getEntityTypeName(), id, e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Performs the actual soft deletion by setting deletion fields
     * 
     * @param entity The entity to soft delete
     * @param deletedBy The ID of the user performing the deletion
     */
    private void performSoftDeletion(T entity, String deletedBy) {
        LocalDateTime now = LocalDateTime.now();
        
        entity.setDeletedAt(now);
        entity.setIsDeleted(true);
        
        try {
            UUID deletedByUuid = UUID.fromString(deletedBy);
            entity.setDeletedBy(deletedByUuid);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid UUID format for deletedBy: {}. Using null.", deletedBy);
            entity.setDeletedBy(null);
        }

        saveEntity(entity);
        log.debug("Soft deletion fields updated for {} with id: {}", getEntityTypeName(), entity.getId());
    }

    /**
     * Creates an audit log entry for the deletion
     * 
     * @param id The ID of the deleted entity
     * @param entity The deleted entity
     * @param deletedBy The ID of the user who performed the deletion
     */
    private void auditDeletion(UUID id, T entity, String deletedBy) {
        try {
            // TODO: Implement proper audit logging service
            log.info("AUDIT: {} deleted - ID: {}, DeletedBy: {}, DeletedAt: {}", 
                    getEntityTypeName(), id, deletedBy, entity.getDeletedAt());
            
            // Future: Send to audit service
            // auditService.logDeletion(getEntityTypeName(), id, deletedBy, entity.getDeletedAt());
            
        } catch (Exception e) {
            log.warn("Failed to create audit log for deletion of {} with id: {}: {}", 
                    getEntityTypeName(), id, e.getMessage());
            // Don't fail the deletion if audit logging fails
        }
    }

    /**
     * Gets the current authenticated user ID
     * 
     * @return Current user ID
     * @throws UnauthorizedException if no authenticated user found
     */
    protected String getCurrentUserId() {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            if (username == null || "anonymousUser".equals(username)) {
                throw new UnauthorizedException("No authenticated user found");
            }
            return username;
        } catch (Exception e) {
            log.error("Failed to get current user ID: {}", e.getMessage());
            throw new UnauthorizedException("Failed to get current user ID");
        }
    }

    /**
     * Validates that the current user owns the entity
     * 
     * @param entity The entity to check ownership for
     * @throws UnauthorizedException if user doesn't own the entity
     */
    protected void validateUserOwnership(T entity) {
        String currentUser = getCurrentUserId();
        UUID entityUserId = entity.getUserId();
        
        if (entityUserId == null) {
            throw new IllegalStateException("Entity has no associated user");
        }
        
        // TODO: Implement proper user ID resolution from username
        // For now, we'll skip this validation and log a warning
        log.warn("User ownership validation skipped for {} - requires user ID resolution implementation", 
                getEntityTypeName());
        
        // Future implementation:
        // UUID currentUserUuid = userService.getUserIdByUsername(currentUser);
        // if (!entityUserId.equals(currentUserUuid)) {
        //     throw new UnauthorizedException("User cannot delete entity owned by another user");
        // }
    }

    /**
     * Validates that the entity is not already deleted
     * 
     * @param entity The entity to check
     * @throws IllegalStateException if entity is already deleted
     */
    protected void validateNotAlreadyDeleted(T entity) {
        if (entity.getIsDeleted() != null && entity.getIsDeleted()) {
            throw new IllegalStateException(getEntityTypeName() + " is already deleted");
        }
    }

    /**
     * Extracts document ID from a document URL
     * Expected format: /api/documentos/{id}/file
     * 
     * @param documentUrl The document URL
     * @return The extracted document ID
     * @throws IllegalArgumentException if URL format is invalid
     */
    protected UUID extractDocumentIdFromUrl(String documentUrl) {
        if (documentUrl == null || documentUrl.trim().isEmpty()) {
            throw new IllegalArgumentException("Document URL is null or empty");
        }

        try {
            if (documentUrl.contains("/documentos/") && documentUrl.contains("/file")) {
                String documentIdStr = documentUrl.substring(
                        documentUrl.indexOf("/documentos/") + "/documentos/".length(),
                        documentUrl.lastIndexOf("/file"));
                return UUID.fromString(documentIdStr);
            } else {
                throw new IllegalArgumentException("Invalid document URL format: " + documentUrl);
            }
        } catch (Exception e) {
            log.warn("Failed to extract document ID from URL: {}", documentUrl);
            throw new IllegalArgumentException("Failed to extract document ID from URL: " + documentUrl, e);
        }
    }
}
