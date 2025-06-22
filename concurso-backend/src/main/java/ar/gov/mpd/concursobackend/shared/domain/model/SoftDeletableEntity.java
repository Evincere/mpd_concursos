package ar.gov.mpd.concursobackend.shared.domain.model;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Interface that entities must implement to support soft deletion
 */
public interface SoftDeletableEntity {
    UUID getId();
    UUID getUserId();
    Boolean getIsDeleted();
    void setIsDeleted(Boolean isDeleted);
    LocalDateTime getDeletedAt();
    void setDeletedAt(LocalDateTime deletedAt);
    UUID getDeletedBy();
    void setDeletedBy(UUID deletedBy);
}
