-- =====================================================================================
-- EXPERIENCE DATA MIGRATION SCRIPT
-- =====================================================================================
-- Purpose: Migrate data from fragmented experience tables to unified work_experience table
-- Source Tables: experiencia, experience, experiencias
-- Target Table: work_experience
-- Date: 2025-06-21
-- =====================================================================================

-- Enable safe mode and transaction handling
SET SQL_SAFE_UPDATES = 0;
SET FOREIGN_KEY_CHECKS = 0;

-- Start transaction for rollback capability
START TRANSACTION;

-- =====================================================================================
-- STEP 1: CREATE UNIFIED WORK_EXPERIENCE TABLE
-- =====================================================================================

CREATE TABLE IF NOT EXISTS work_experience (
    -- Primary identification
    id BINARY(16) PRIMARY KEY,
    user_id BINARY(16) NOT NULL,
    
    -- Core experience information (English names)
    company_name VARCHAR(255) NOT NULL,
    position_title VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NULL,
    is_current_position BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Detailed information
    job_description TEXT NULL,
    key_achievements TEXT NULL,
    technologies_used TEXT NULL,
    location VARCHAR(255) NULL,
    
    -- Documentation and validation
    supporting_document_url VARCHAR(500) NULL,
    verification_status ENUM('PENDING', 'VERIFIED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    verification_notes TEXT NULL,
    
    -- Audit fields
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BINARY(16) NULL,
    updated_by BINARY(16) NULL,
    
    -- Constraints
    CONSTRAINT fk_work_experience_user 
        FOREIGN KEY (user_id) REFERENCES user_entity(id) ON DELETE CASCADE,
    CONSTRAINT chk_work_experience_dates 
        CHECK (end_date IS NULL OR end_date >= start_date),
    CONSTRAINT chk_work_experience_current 
        CHECK ((is_current_position = TRUE AND end_date IS NULL) OR 
               (is_current_position = FALSE))
) ENGINE=InnoDB;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_work_experience_user_id ON work_experience(user_id);
CREATE INDEX IF NOT EXISTS idx_work_experience_dates ON work_experience(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_work_experience_status ON work_experience(verification_status);
CREATE INDEX IF NOT EXISTS idx_work_experience_current ON work_experience(is_current_position);

-- =====================================================================================
-- STEP 2: PRE-MIGRATION VALIDATION
-- =====================================================================================

-- Check source table counts
SELECT 'PRE-MIGRATION COUNTS' as status;
SELECT 'experiencia' as source_table, COUNT(*) as record_count FROM experiencia
UNION ALL
SELECT 'experience' as source_table, COUNT(*) as record_count FROM experience  
UNION ALL
SELECT 'experiencias' as source_table, COUNT(*) as record_count FROM experiencias;

-- =====================================================================================
-- STEP 3: MIGRATE FROM EXPERIENCIA (Legacy Table)
-- =====================================================================================

INSERT INTO work_experience (
    id, user_id, company_name, position_title, start_date, end_date, 
    is_current_position, job_description, verification_notes,
    created_at, updated_at, created_by
)
SELECT 
    UUID_TO_BIN(UUID()) as id,                    -- Generate new UUID
    user_id,                                      -- Direct mapping
    empresa as company_name,                      -- Spanish → English
    cargo as position_title,                      -- Spanish → English  
    fechaInicio as start_date,                    -- Spanish → English
    fechaFin as end_date,                         -- Spanish → English
    CASE 
        WHEN fechaFin IS NULL THEN TRUE 
        ELSE FALSE 
    END as is_current_position,                   -- Derived field
    descripcion as job_description,               -- Spanish → English
    comentario as verification_notes,             -- Spanish → English
    NOW() as created_at,                          -- Current timestamp
    NOW() as updated_at,                          -- Current timestamp
    user_id as created_by                         -- Assume user created it
FROM experiencia
WHERE user_id IS NOT NULL;                       -- Only valid user references

-- Log migration progress
SELECT CONCAT('Migrated ', ROW_COUNT(), ' records from experiencia table') as migration_status;

-- =====================================================================================
-- STEP 4: MIGRATE FROM EXPERIENCE (Current Table)
-- =====================================================================================

INSERT INTO work_experience (
    id, user_id, company_name, position_title, start_date, end_date, 
    is_current_position, job_description, supporting_document_url,
    verification_notes, created_at, updated_at, created_by
)
SELECT 
    id,                                           -- Direct mapping (UUID)
    user_id,                                      -- Direct mapping
    company as company_name,                      -- Rename for clarity
    position as position_title,                   -- Rename for clarity
    start_date,                                   -- Direct mapping
    end_date,                                     -- Direct mapping
    CASE 
        WHEN end_date IS NULL THEN TRUE 
        ELSE FALSE 
    END as is_current_position,                   -- Derived field
    description as job_description,               -- Direct mapping
    document_url as supporting_document_url,      -- Direct mapping
    comments as verification_notes,               -- Repurpose field
    NOW() as created_at,                          -- Current timestamp
    NOW() as updated_at,                          -- Current timestamp
    user_id as created_by                         -- Assume user created it
FROM experience
WHERE user_id IS NOT NULL                        -- Only valid user references
AND id NOT IN (SELECT id FROM work_experience);  -- Avoid duplicates

-- Log migration progress
SELECT CONCAT('Migrated ', ROW_COUNT(), ' records from experience table') as migration_status;

-- =====================================================================================
-- STEP 5: MIGRATE FROM EXPERIENCIAS (Plural Table)
-- =====================================================================================

INSERT INTO work_experience (
    id, user_id, company_name, position_title, start_date, end_date, 
    is_current_position, job_description, supporting_document_url,
    verification_notes, created_at, updated_at, created_by
)
SELECT 
    id,                                           -- Direct mapping (UUID)
    userId as user_id,                            -- camelCase → snake_case
    empresa as company_name,                      -- Spanish → English
    cargo as position_title,                      -- Spanish → English
    fechaInicio as start_date,                    -- Spanish → English
    fechaFin as end_date,                         -- Spanish → English
    CASE 
        WHEN fechaFin IS NULL THEN TRUE 
        ELSE FALSE 
    END as is_current_position,                   -- Derived field
    descripcion as job_description,               -- Spanish → English
    documentUrl as supporting_document_url,       -- camelCase → snake_case
    comentario as verification_notes,             -- Spanish → English
    NOW() as created_at,                          -- Current timestamp
    NOW() as updated_at,                          -- Current timestamp
    userId as created_by                          -- Assume user created it
FROM experiencias
WHERE userId IS NOT NULL                         -- Only valid user references
AND id NOT IN (SELECT id FROM work_experience);  -- Avoid duplicates

-- Log migration progress
SELECT CONCAT('Migrated ', ROW_COUNT(), ' records from experiencias table') as migration_status;

-- =====================================================================================
-- STEP 6: POST-MIGRATION VALIDATION
-- =====================================================================================

-- Check target table count
SELECT 'POST-MIGRATION VALIDATION' as status;
SELECT 'work_experience' as target_table, COUNT(*) as record_count FROM work_experience;

-- Verify no orphaned records
SELECT 'ORPHANED RECORDS CHECK' as validation_type, COUNT(*) as orphaned_count
FROM work_experience we 
LEFT JOIN user_entity ue ON we.user_id = ue.id 
WHERE ue.id IS NULL;

-- Verify date constraints
SELECT 'DATE CONSTRAINT VIOLATIONS' as validation_type, COUNT(*) as violation_count
FROM work_experience 
WHERE end_date < start_date;

-- Verify required fields
SELECT 'MISSING REQUIRED FIELDS' as validation_type, COUNT(*) as missing_count
FROM work_experience 
WHERE company_name IS NULL OR company_name = '' 
   OR position_title IS NULL OR position_title = '';

-- Verify current position logic
SELECT 'CURRENT POSITION LOGIC ERRORS' as validation_type, COUNT(*) as error_count
FROM work_experience 
WHERE (is_current_position = TRUE AND end_date IS NOT NULL)
   OR (is_current_position = FALSE AND end_date IS NULL);

-- Show sample migrated data
SELECT 'SAMPLE MIGRATED DATA' as info;
SELECT id, BIN_TO_UUID(user_id) as user_uuid, company_name, position_title, 
       start_date, end_date, is_current_position
FROM work_experience 
LIMIT 5;

-- =====================================================================================
-- STEP 7: COMMIT OR ROLLBACK
-- =====================================================================================

-- If all validations pass, commit the transaction
-- If any validation fails, rollback the transaction

-- Check if we should commit (all validation counts should be 0 except record_count)
SET @orphaned_count = (SELECT COUNT(*) FROM work_experience we LEFT JOIN user_entity ue ON we.user_id = ue.id WHERE ue.id IS NULL);
SET @date_violations = (SELECT COUNT(*) FROM work_experience WHERE end_date < start_date);
SET @missing_fields = (SELECT COUNT(*) FROM work_experience WHERE company_name IS NULL OR position_title IS NULL);
SET @logic_errors = (SELECT COUNT(*) FROM work_experience WHERE (is_current_position = TRUE AND end_date IS NOT NULL) OR (is_current_position = FALSE AND end_date IS NULL));

-- Display final validation summary
SELECT 
    'FINAL VALIDATION SUMMARY' as summary,
    @orphaned_count as orphaned_records,
    @date_violations as date_violations,
    @missing_fields as missing_required_fields,
    @logic_errors as logic_errors,
    CASE 
        WHEN @orphaned_count = 0 AND @date_violations = 0 AND @missing_fields = 0 AND @logic_errors = 0 
        THEN 'READY_TO_COMMIT' 
        ELSE 'VALIDATION_FAILED' 
    END as migration_status;

-- Commit if validation passes
-- COMMIT;

-- If validation fails, uncomment the next line to rollback
-- ROLLBACK;

-- Re-enable safety checks
SET FOREIGN_KEY_CHECKS = 1;
SET SQL_SAFE_UPDATES = 1;

-- =====================================================================================
-- MIGRATION COMPLETE
-- =====================================================================================
-- Next steps:
-- 1. Review validation results
-- 2. If all validations pass, execute COMMIT;
-- 3. If any validation fails, execute ROLLBACK; and investigate
-- 4. Update application code to use work_experience table
-- 5. After successful application deployment, drop old tables
-- =====================================================================================
