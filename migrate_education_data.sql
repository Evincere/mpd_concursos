-- =====================================================================================
-- EDUCATION DATA MIGRATION SCRIPT
-- =====================================================================================
-- Purpose: Migrate data from education table to unified education_record table
-- Source Table: education
-- Target Table: education_record
-- Date: 2025-06-21
-- =====================================================================================

-- Enable safe mode and transaction handling
SET SQL_SAFE_UPDATES = 0;
SET FOREIGN_KEY_CHECKS = 0;

-- Start transaction for rollback capability
START TRANSACTION;

-- =====================================================================================
-- STEP 1: CREATE UNIFIED EDUCATION_RECORD TABLE
-- =====================================================================================

CREATE TABLE IF NOT EXISTS education_record (
    -- Primary identification
    id BINARY(16) PRIMARY KEY,
    user_id BINARY(16) NOT NULL,
    
    -- Core education information
    education_type ENUM(
        'PRIMARY_EDUCATION',
        'SECONDARY_EDUCATION', 
        'TECHNICAL_DEGREE',
        'UNIVERSITY_DEGREE',
        'POSTGRADUATE_DEGREE',
        'MASTER_DEGREE',
        'DOCTORAL_DEGREE',
        'CERTIFICATION',
        'DIPLOMA',
        'TRAINING_COURSE',
        'SCIENTIFIC_ACTIVITY'
    ) NOT NULL,
    
    education_status ENUM(
        'IN_PROGRESS',
        'COMPLETED',
        'SUSPENDED',
        'ABANDONED'
    ) NOT NULL,
    
    -- Institution and program details
    institution_name VARCHAR(255) NOT NULL,
    program_title VARCHAR(255) NOT NULL,
    field_of_study VARCHAR(255) NULL,
    
    -- Dates
    start_date DATE NULL,
    end_date DATE NULL,
    graduation_date DATE NULL,
    issue_date DATE NULL,
    
    -- Academic performance
    final_grade DECIMAL(4,2) NULL,
    grade_scale VARCHAR(50) NULL,
    academic_honors VARCHAR(255) NULL,
    
    -- Program details
    duration_years INTEGER NULL,
    duration_hours INTEGER NULL,
    credit_hours INTEGER NULL,
    
    -- Thesis/Research (for advanced degrees)
    thesis_title VARCHAR(500) NULL,
    thesis_topic TEXT NULL,
    thesis_advisor VARCHAR(255) NULL,
    
    -- Certification details
    certification_number VARCHAR(100) NULL,
    issuing_authority VARCHAR(255) NULL,
    expiration_date DATE NULL,
    
    -- Scientific activity details (for research)
    activity_type VARCHAR(100) NULL,
    activity_role VARCHAR(100) NULL,
    presentation_location VARCHAR(255) NULL,
    presentation_date DATE NULL,
    
    -- Documentation and validation
    supporting_document_url VARCHAR(500) NULL,
    verification_status ENUM('PENDING', 'VERIFIED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    verification_notes TEXT NULL,
    
    -- Additional information
    comments TEXT NULL,
    is_ongoing BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Audit fields
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BINARY(16) NULL,
    updated_by BINARY(16) NULL,
    
    -- Constraints
    CONSTRAINT fk_education_record_user 
        FOREIGN KEY (user_id) REFERENCES user_entity(id) ON DELETE CASCADE,
    CONSTRAINT chk_education_record_dates 
        CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date),
    CONSTRAINT chk_education_record_ongoing 
        CHECK ((is_ongoing = TRUE AND end_date IS NULL) OR 
               (is_ongoing = FALSE)),
    CONSTRAINT chk_education_record_grade 
        CHECK (final_grade IS NULL OR (final_grade >= 0 AND final_grade <= 10))
) ENGINE=InnoDB;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_education_record_user_id ON education_record(user_id);
CREATE INDEX IF NOT EXISTS idx_education_record_type ON education_record(education_type);
CREATE INDEX IF NOT EXISTS idx_education_record_status ON education_record(education_status);
CREATE INDEX IF NOT EXISTS idx_education_record_dates ON education_record(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_education_record_verification ON education_record(verification_status);
CREATE INDEX IF NOT EXISTS idx_education_record_ongoing ON education_record(is_ongoing);

-- =====================================================================================
-- STEP 2: PRE-MIGRATION VALIDATION
-- =====================================================================================

-- Check source table count
SELECT 'PRE-MIGRATION COUNTS' as status;
SELECT 'education' as source_table, COUNT(*) as record_count FROM education;

-- =====================================================================================
-- STEP 3: MIGRATE FROM EDUCATION TABLE
-- =====================================================================================

INSERT INTO education_record (
    id, user_id, education_type, education_status, institution_name, program_title,
    issue_date, final_grade, grade_scale, duration_years, duration_hours,
    thesis_topic, activity_type, activity_role, presentation_location,
    supporting_document_url, comments, is_ongoing, created_at, updated_at, created_by
)
SELECT 
    id,                                           -- Direct mapping (UUID)
    user_id,                                      -- Direct mapping
    
    -- Map education type with proper enum values
    CASE 
        WHEN type = 'UNIVERSITY_DEGREE' THEN 'UNIVERSITY_DEGREE'
        WHEN type = 'POSTGRADUATE_DEGREE' THEN 'POSTGRADUATE_DEGREE'
        WHEN type = 'MASTER_DEGREE' THEN 'MASTER_DEGREE'
        WHEN type = 'DOCTORAL_DEGREE' THEN 'DOCTORAL_DEGREE'
        WHEN type = 'CERTIFICATION' THEN 'CERTIFICATION'
        WHEN type = 'DIPLOMA' THEN 'DIPLOMA'
        WHEN type = 'TRAINING_COURSE' THEN 'TRAINING_COURSE'
        WHEN type = 'SCIENTIFIC_ACTIVITY' THEN 'SCIENTIFIC_ACTIVITY'
        WHEN type = 'TECHNICAL_DEGREE' THEN 'TECHNICAL_DEGREE'
        WHEN type = 'SECONDARY_EDUCATION' THEN 'SECONDARY_EDUCATION'
        WHEN type = 'PRIMARY_EDUCATION' THEN 'PRIMARY_EDUCATION'
        ELSE 'UNIVERSITY_DEGREE'                  -- Default fallback
    END as education_type,
    
    -- Map education status with proper enum values
    CASE 
        WHEN status = 'COMPLETED' THEN 'COMPLETED'
        WHEN status = 'IN_PROGRESS' THEN 'IN_PROGRESS'
        WHEN status = 'SUSPENDED' THEN 'SUSPENDED'
        WHEN status = 'ABANDONED' THEN 'ABANDONED'
        ELSE 'COMPLETED'                          -- Default fallback
    END as education_status,
    
    institution as institution_name,              -- Rename for clarity
    title as program_title,                       -- Rename for clarity
    issue_date,                                   -- Direct mapping
    
    -- Handle grade conversion (ensure it's within 0-10 range)
    CASE 
        WHEN average IS NOT NULL AND average >= 0 AND average <= 10 THEN average
        WHEN average IS NOT NULL AND average > 10 THEN average / 10  -- Scale down if needed
        ELSE NULL
    END as final_grade,
    
    '1-10' as grade_scale,                        -- Default scale
    duration_years,                               -- Direct mapping
    hourly_load as duration_hours,                -- Rename for clarity
    thesis_topic,                                 -- Direct mapping
    activity_type,                                -- Direct mapping
    activity_role,                                -- Direct mapping
    
    -- Extract location from exposition_place_date if it contains location info
    CASE 
        WHEN exposition_place_date IS NOT NULL AND exposition_place_date != '' 
        THEN exposition_place_date
        ELSE NULL
    END as presentation_location,
    
    document_url as supporting_document_url,      -- Rename for clarity
    comments,                                     -- Direct mapping
    
    -- Determine if ongoing based on status
    CASE 
        WHEN status = 'IN_PROGRESS' THEN TRUE
        ELSE FALSE
    END as is_ongoing,
    
    NOW() as created_at,                          -- Current timestamp
    NOW() as updated_at,                          -- Current timestamp
    user_id as created_by                         -- Assume user created it
    
FROM education
WHERE user_id IS NOT NULL;                       -- Only valid user references

-- Log migration progress
SELECT CONCAT('Migrated ', ROW_COUNT(), ' records from education table') as migration_status;

-- =====================================================================================
-- STEP 4: POST-MIGRATION VALIDATION
-- =====================================================================================

-- Check target table count
SELECT 'POST-MIGRATION VALIDATION' as status;
SELECT 'education_record' as target_table, COUNT(*) as record_count FROM education_record;

-- Verify no orphaned records
SELECT 'ORPHANED RECORDS CHECK' as validation_type, COUNT(*) as orphaned_count
FROM education_record er 
LEFT JOIN user_entity ue ON er.user_id = ue.id 
WHERE ue.id IS NULL;

-- Verify date constraints
SELECT 'DATE CONSTRAINT VIOLATIONS' as validation_type, COUNT(*) as violation_count
FROM education_record 
WHERE end_date IS NOT NULL AND start_date IS NOT NULL AND end_date < start_date;

-- Verify required fields
SELECT 'MISSING REQUIRED FIELDS' as validation_type, COUNT(*) as missing_count
FROM education_record 
WHERE institution_name IS NULL OR institution_name = '' 
   OR program_title IS NULL OR program_title = '';

-- Verify grade constraints
SELECT 'GRADE CONSTRAINT VIOLATIONS' as validation_type, COUNT(*) as violation_count
FROM education_record 
WHERE final_grade IS NOT NULL AND (final_grade < 0 OR final_grade > 10);

-- Verify ongoing logic
SELECT 'ONGOING LOGIC ERRORS' as validation_type, COUNT(*) as error_count
FROM education_record 
WHERE (is_ongoing = TRUE AND education_status != 'IN_PROGRESS')
   OR (is_ongoing = FALSE AND education_status = 'IN_PROGRESS');

-- Show sample migrated data
SELECT 'SAMPLE MIGRATED DATA' as info;
SELECT id, BIN_TO_UUID(user_id) as user_uuid, education_type, education_status,
       institution_name, program_title, final_grade, is_ongoing
FROM education_record 
LIMIT 5;

-- =====================================================================================
-- STEP 5: COMMIT OR ROLLBACK
-- =====================================================================================

-- Check if we should commit (all validation counts should be 0 except record_count)
SET @orphaned_count = (SELECT COUNT(*) FROM education_record er LEFT JOIN user_entity ue ON er.user_id = ue.id WHERE ue.id IS NULL);
SET @date_violations = (SELECT COUNT(*) FROM education_record WHERE end_date IS NOT NULL AND start_date IS NOT NULL AND end_date < start_date);
SET @missing_fields = (SELECT COUNT(*) FROM education_record WHERE institution_name IS NULL OR program_title IS NULL);
SET @grade_violations = (SELECT COUNT(*) FROM education_record WHERE final_grade IS NOT NULL AND (final_grade < 0 OR final_grade > 10));
SET @logic_errors = (SELECT COUNT(*) FROM education_record WHERE (is_ongoing = TRUE AND education_status != 'IN_PROGRESS') OR (is_ongoing = FALSE AND education_status = 'IN_PROGRESS'));

-- Display final validation summary
SELECT 
    'FINAL VALIDATION SUMMARY' as summary,
    @orphaned_count as orphaned_records,
    @date_violations as date_violations,
    @missing_fields as missing_required_fields,
    @grade_violations as grade_violations,
    @logic_errors as logic_errors,
    CASE 
        WHEN @orphaned_count = 0 AND @date_violations = 0 AND @missing_fields = 0 AND @grade_violations = 0 AND @logic_errors = 0
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
-- 4. Update application code to use education_record table
-- 5. After successful application deployment, drop old tables
-- =====================================================================================
