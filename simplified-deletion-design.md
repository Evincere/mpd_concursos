# 🗑️ SIMPLIFIED DELETION LOGIC DESIGN

## 🎯 **OBJECTIVES**

### **Primary Goals**
- ✅ Simplify deletion logic from 3 methods to 1 unified approach
- ✅ Ensure consistent behavior across all CV entities
- ✅ Implement proper cascade deletion for associated documents
- ✅ Add comprehensive audit trail for deletions
- ✅ Maintain data integrity with proper validations

### **Success Criteria**
- ✅ Single deletion method per entity type
- ✅ Consistent error handling across services
- ✅ Proper transaction management
- ✅ Audit trail for all deletions
- ✅ Frontend-backend integration working

---

## 🏗️ **UNIFIED DELETION ARCHITECTURE**

### **1. DELETION STRATEGY PATTERN**

```java
public interface DeletionStrategy<T> {
    void validateDeletion(UUID id, T entity);
    void handleAssociatedResources(T entity);
    void performDeletion(UUID id);
    void auditDeletion(UUID id, T entity, String deletedBy);
}
```

### **2. SOFT DELETE VS HARD DELETE**

**Recommendation: SOFT DELETE for CV entities**

**Benefits:**
- ✅ Data recovery capability
- ✅ Audit trail preservation
- ✅ Referential integrity maintenance
- ✅ Better user experience (undo functionality)

**Implementation:**
```java
@Column(name = "deleted_at")
private LocalDateTime deletedAt;

@Column(name = "deleted_by")
private UUID deletedBy;

@Column(name = "is_deleted", nullable = false)
private Boolean isDeleted = false;
```

### **3. CASCADE DELETION RULES**

| **Entity** | **Associated Resources** | **Action** |
|------------|-------------------------|------------|
| **WorkExperience** | Supporting Documents | Soft delete document metadata, mark files for cleanup |
| **EducationRecord** | Supporting Documents | Soft delete document metadata, mark files for cleanup |
| **User** | All CV Data | Cascade soft delete all related CV entries |

---

## 🔧 **IMPLEMENTATION DESIGN**

### **1. BASE DELETION SERVICE**

```java
@Service
@Transactional
public abstract class BaseCvDeletionService<T extends BaseEntity> {
    
    protected abstract void validateBusinessRules(UUID id, T entity);
    protected abstract void handleAssociatedDocuments(T entity);
    protected abstract String getEntityTypeName();
    
    public final void delete(UUID id, String deletedBy) {
        log.info("Starting deletion of {} with id: {}", getEntityTypeName(), id);
        
        // 1. Validate existence
        T entity = findEntityOrThrow(id);
        
        // 2. Validate business rules
        validateBusinessRules(id, entity);
        
        // 3. Handle associated resources
        handleAssociatedDocuments(entity);
        
        // 4. Perform soft deletion
        performSoftDeletion(entity, deletedBy);
        
        // 5. Audit the deletion
        auditDeletion(id, entity, deletedBy);
        
        log.info("{} with id: {} deleted successfully", getEntityTypeName(), id);
    }
    
    private void performSoftDeletion(T entity, String deletedBy) {
        entity.setDeletedAt(LocalDateTime.now());
        entity.setDeletedBy(UUID.fromString(deletedBy));
        entity.setIsDeleted(true);
        repository.save(entity);
    }
}
```

### **2. WORK EXPERIENCE DELETION SERVICE**

```java
@Service
public class WorkExperienceDeletionService extends BaseCvDeletionService<WorkExperienceEntity> {
    
    private final ExperienceRepository experienceRepository;
    private final DocumentDeletionService documentDeletionService;
    
    @Override
    protected void validateBusinessRules(UUID id, WorkExperienceEntity entity) {
        // Check if user owns this experience
        String currentUser = getCurrentUserId();
        if (!entity.getUser().getId().toString().equals(currentUser)) {
            throw new UnauthorizedException("User cannot delete experience owned by another user");
        }
        
        // Check if experience is not already deleted
        if (entity.getIsDeleted()) {
            throw new IllegalStateException("Experience is already deleted");
        }
    }
    
    @Override
    protected void handleAssociatedDocuments(WorkExperienceEntity entity) {
        if (entity.getSupportingDocumentUrl() != null) {
            try {
                UUID documentId = extractDocumentIdFromUrl(entity.getSupportingDocumentUrl());
                documentDeletionService.markDocumentForDeletion(documentId, "Experience deletion");
            } catch (Exception e) {
                log.warn("Failed to handle associated document for experience {}: {}", 
                        entity.getId(), e.getMessage());
                // Don't fail the deletion if document handling fails
            }
        }
    }
    
    @Override
    protected String getEntityTypeName() {
        return "WorkExperience";
    }
}
```

### **3. EDUCATION DELETION SERVICE**

```java
@Service
public class EducationDeletionService extends BaseCvDeletionService<EducationRecordEntity> {
    
    private final EducationRepository educationRepository;
    private final DocumentDeletionService documentDeletionService;
    
    @Override
    protected void validateBusinessRules(UUID id, EducationRecordEntity entity) {
        // Check if user owns this education record
        String currentUser = getCurrentUserId();
        if (!entity.getUser().getId().toString().equals(currentUser)) {
            throw new UnauthorizedException("User cannot delete education record owned by another user");
        }
        
        // Check if education is not already deleted
        if (entity.getIsDeleted()) {
            throw new IllegalStateException("Education record is already deleted");
        }
    }
    
    @Override
    protected void handleAssociatedDocuments(EducationRecordEntity entity) {
        if (entity.getSupportingDocumentUrl() != null) {
            try {
                UUID documentId = extractDocumentIdFromUrl(entity.getSupportingDocumentUrl());
                documentDeletionService.markDocumentForDeletion(documentId, "Education deletion");
            } catch (Exception e) {
                log.warn("Failed to handle associated document for education {}: {}", 
                        entity.getId(), e.getMessage());
                // Don't fail the deletion if document handling fails
            }
        }
    }
    
    @Override
    protected String getEntityTypeName() {
        return "EducationRecord";
    }
}
```

### **4. DOCUMENT DELETION SERVICE**

```java
@Service
@Transactional
public class DocumentDeletionService {
    
    private final DocumentRepository documentRepository;
    private final FileStorageService fileStorageService;
    
    public void markDocumentForDeletion(UUID documentId, String reason) {
        log.info("Marking document {} for deletion. Reason: {}", documentId, reason);
        
        DocumentEntity document = documentRepository.findById(documentId)
            .orElseThrow(() -> new ResourceNotFoundException("Document not found: " + documentId));
        
        // Soft delete the document metadata
        document.setDeletedAt(LocalDateTime.now());
        document.setIsDeleted(true);
        document.setDeletionReason(reason);
        
        documentRepository.save(document);
        
        // Schedule physical file deletion (async)
        schedulePhysicalFileDeletion(document.getFilePath());
    }
    
    @Async
    private void schedulePhysicalFileDeletion(String filePath) {
        try {
            // Wait 24 hours before physical deletion (recovery window)
            Thread.sleep(24 * 60 * 60 * 1000);
            fileStorageService.deleteFile(filePath);
            log.info("Physical file deleted: {}", filePath);
        } catch (Exception e) {
            log.error("Failed to delete physical file: {}", filePath, e);
        }
    }
}
```

---

## 📊 **REPOSITORY UPDATES**

### **1. REMOVE COMPLEX DELETION METHODS**

```java
// REMOVE these methods from ExperienceRepository:
// int deleteExperienceDirectly(@Param("id") UUID id);
// int deleteExperienceWithNativeQuery(@Param("id") UUID id);

// ADD soft delete query methods:
@Query("SELECT e FROM WorkExperienceEntity e WHERE e.user.id = :userId AND e.isDeleted = false")
List<WorkExperienceEntity> findActiveByUserId(@Param("userId") UUID userId);

@Query("SELECT e FROM EducationRecordEntity e WHERE e.user.id = :userId AND e.isDeleted = false")
List<EducationRecordEntity> findActiveByUserId(@Param("userId") UUID userId);
```

### **2. ADD SOFT DELETE SUPPORT**

```java
public interface SoftDeletableRepository<T, ID> extends JpaRepository<T, ID> {
    
    @Query("SELECT e FROM #{#entityName} e WHERE e.isDeleted = false")
    List<T> findAllActive();
    
    @Query("SELECT e FROM #{#entityName} e WHERE e.id = :id AND e.isDeleted = false")
    Optional<T> findActiveById(@Param("id") ID id);
    
    @Modifying
    @Query("UPDATE #{#entityName} e SET e.isDeleted = true, e.deletedAt = :deletedAt, e.deletedBy = :deletedBy WHERE e.id = :id")
    int softDelete(@Param("id") ID id, @Param("deletedAt") LocalDateTime deletedAt, @Param("deletedBy") UUID deletedBy);
}
```

---

## 🎯 **CONTROLLER UPDATES**

### **1. SIMPLIFIED DELETION ENDPOINTS**

```java
@DeleteMapping("/{id}")
@PreAuthorize("hasRole('ROLE_USER')")
public ResponseEntity<DeletionResponseDto> deleteExperience(@PathVariable UUID id) {
    try {
        String currentUser = getCurrentUserId();
        workExperienceDeletionService.delete(id, currentUser);
        
        return ResponseEntity.ok(DeletionResponseDto.builder()
            .success(true)
            .message("Experience deleted successfully")
            .deletedAt(LocalDateTime.now())
            .recoverable(true)
            .recoveryWindowHours(24)
            .build());
            
    } catch (ResourceNotFoundException ex) {
        return ResponseEntity.notFound().build();
    } catch (UnauthorizedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }
}
```

### **2. RECOVERY ENDPOINT**

```java
@PostMapping("/{id}/recover")
@PreAuthorize("hasRole('ROLE_USER')")
public ResponseEntity<ExperienceResponseDto> recoverExperience(@PathVariable UUID id) {
    try {
        String currentUser = getCurrentUserId();
        ExperienceResponseDto recovered = workExperienceRecoveryService.recover(id, currentUser);
        return ResponseEntity.ok(recovered);
    } catch (Exception ex) {
        return ResponseEntity.badRequest().build();
    }
}
```

---

## 📈 **BENEFITS OF SIMPLIFIED DESIGN**

### **1. MAINTAINABILITY**
- ✅ Single deletion path per entity
- ✅ Consistent error handling
- ✅ Reusable base classes
- ✅ Clear separation of concerns

### **2. RELIABILITY**
- ✅ Proper transaction management
- ✅ Data recovery capability
- ✅ Audit trail preservation
- ✅ Referential integrity maintenance

### **3. USER EXPERIENCE**
- ✅ Undo functionality
- ✅ Clear feedback messages
- ✅ Recovery window
- ✅ Consistent behavior

### **4. TESTING**
- ✅ Easier to unit test
- ✅ Predictable behavior
- ✅ Mockable dependencies
- ✅ Clear test scenarios

---

## 🔄 **MIGRATION STRATEGY**

### **Phase 1: Add Soft Delete Fields**
1. Add `deleted_at`, `deleted_by`, `is_deleted` to entities
2. Update database schema
3. Add default values for existing records

### **Phase 2: Implement New Services**
1. Create base deletion service
2. Implement specific deletion services
3. Add document deletion service

### **Phase 3: Update Controllers**
1. Replace complex deletion logic
2. Add recovery endpoints
3. Update response DTOs

### **Phase 4: Frontend Integration**
1. Update deletion calls
2. Add recovery functionality
3. Improve user feedback

### **Phase 5: Cleanup**
1. Remove old deletion methods
2. Clean up unused code
3. Update documentation
