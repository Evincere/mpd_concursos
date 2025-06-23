-- =====================================================
-- SCRIPT: ADD SOFT DELETE FIELDS TO CV ENTITIES
-- Purpose: Add soft delete support to work_experience and education_record tables
-- Author: System Migration
-- Date: 2024-12-21
-- =====================================================

-- Start transaction for atomic operation
START TRANSACTION;

-- =====================================================
-- 1. ADD SOFT DELETE FIELDS TO WORK_EXPERIENCE TABLE
-- =====================================================

-- Add soft delete fields to work_experience table
ALTER TABLE work_experience 
ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Indicates if the record is soft deleted',
ADD COLUMN deleted_at DATETIME NULL COMMENT 'Timestamp when the record was deleted',
ADD COLUMN deleted_by BINARY(16) NULL COMMENT 'UUID of the user who deleted the record';

-- Add foreign key constraint for deleted_by
ALTER TABLE work_experience 
ADD CONSTRAINT fk_work_experience_deleted_by 
FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL;

-- Add index for soft delete queries
CREATE INDEX idx_work_experience_soft_delete ON work_experience(is_deleted, deleted_at);
CREATE INDEX idx_work_experience_user_active ON work_experience(user_id, is_deleted);

-- =====================================================
-- 2. ADD SOFT DELETE FIELDS TO EDUCATION_RECORD TABLE
-- =====================================================

-- Add soft delete fields to education_record table
ALTER TABLE education_record 
ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Indicates if the record is soft deleted',
ADD COLUMN deleted_at DATETIME NULL COMMENT 'Timestamp when the record was deleted',
ADD COLUMN deleted_by BINARY(16) NULL COMMENT 'UUID of the user who deleted the record';

-- Add foreign key constraint for deleted_by
ALTER TABLE education_record 
ADD CONSTRAINT fk_education_record_deleted_by 
FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL;

-- Add index for soft delete queries
CREATE INDEX idx_education_record_soft_delete ON education_record(is_deleted, deleted_at);
CREATE INDEX idx_education_record_user_active ON education_record(user_id, is_deleted);

-- =====================================================
-- 3. UPDATE EXISTING RECORDS
-- =====================================================

-- Set default values for existing records
UPDATE work_experience 
SET is_deleted = FALSE 
WHERE is_deleted IS NULL;

UPDATE education_record 
SET is_deleted = FALSE 
WHERE is_deleted IS NULL;

-- =====================================================
-- 4. CREATE VIEWS FOR ACTIVE RECORDS
-- =====================================================

-- Create view for active work experiences
CREATE OR REPLACE VIEW active_work_experience AS
SELECT * FROM work_experience 
WHERE is_deleted = FALSE;

-- Create view for active education records
CREATE OR REPLACE VIEW active_education_record AS
SELECT * FROM education_record 
WHERE is_deleted = FALSE;

-- =====================================================
-- 5. CREATE STORED PROCEDURES FOR SOFT DELETE OPERATIONS
-- =====================================================

-- Procedure to soft delete work experience
DELIMITER //
CREATE PROCEDURE SoftDeleteWorkExperience(
    IN p_experience_id BINARY(16),
    IN p_deleted_by BINARY(16)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Check if record exists and is not already deleted
    IF NOT EXISTS (
        SELECT 1 FROM work_experience 
        WHERE id = p_experience_id AND is_deleted = FALSE
    ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Work experience not found or already deleted';
    END IF;
    
    -- Perform soft delete
    UPDATE work_experience 
    SET 
        is_deleted = TRUE,
        deleted_at = NOW(),
        deleted_by = p_deleted_by,
        updated_at = NOW()
    WHERE id = p_experience_id;
    
    COMMIT;
END //
DELIMITER ;

-- Procedure to soft delete education record
DELIMITER //
CREATE PROCEDURE SoftDeleteEducationRecord(
    IN p_education_id BINARY(16),
    IN p_deleted_by BINARY(16)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Check if record exists and is not already deleted
    IF NOT EXISTS (
        SELECT 1 FROM education_record 
        WHERE id = p_education_id AND is_deleted = FALSE
    ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Education record not found or already deleted';
    END IF;
    
    -- Perform soft delete
    UPDATE education_record 
    SET 
        is_deleted = TRUE,
        deleted_at = NOW(),
        deleted_by = p_deleted_by,
        updated_at = NOW()
    WHERE id = p_education_id;
    
    COMMIT;
END //
DELIMITER ;

-- Procedure to recover soft deleted work experience
DELIMITER //
CREATE PROCEDURE RecoverWorkExperience(
    IN p_experience_id BINARY(16),
    IN p_recovered_by BINARY(16)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Check if record exists and is deleted
    IF NOT EXISTS (
        SELECT 1 FROM work_experience 
        WHERE id = p_experience_id AND is_deleted = TRUE
    ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Work experience not found or not deleted';
    END IF;
    
    -- Check if within recovery window (24 hours)
    IF NOT EXISTS (
        SELECT 1 FROM work_experience 
        WHERE id = p_experience_id 
        AND is_deleted = TRUE 
        AND deleted_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
    ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Recovery window expired (24 hours)';
    END IF;
    
    -- Perform recovery
    UPDATE work_experience 
    SET 
        is_deleted = FALSE,
        deleted_at = NULL,
        deleted_by = NULL,
        updated_at = NOW(),
        updated_by = p_recovered_by
    WHERE id = p_experience_id;
    
    COMMIT;
END //
DELIMITER ;

-- =====================================================
-- 6. VALIDATION QUERIES
-- =====================================================

-- Verify soft delete fields were added correctly
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME IN ('work_experience', 'education_record')
AND COLUMN_NAME IN ('is_deleted', 'deleted_at', 'deleted_by')
ORDER BY TABLE_NAME, COLUMN_NAME;

-- Verify indexes were created
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME IN ('work_experience', 'education_record')
AND INDEX_NAME LIKE '%soft_delete%' OR INDEX_NAME LIKE '%active%'
ORDER BY TABLE_NAME, INDEX_NAME;

-- Count records by deletion status
SELECT 
    'work_experience' as table_name,
    is_deleted,
    COUNT(*) as record_count
FROM work_experience 
GROUP BY is_deleted

UNION ALL

SELECT 
    'education_record' as table_name,
    is_deleted,
    COUNT(*) as record_count
FROM education_record 
GROUP BY is_deleted;

-- Commit the transaction
COMMIT;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
SELECT 'Soft delete fields added successfully to CV entities' AS status;
