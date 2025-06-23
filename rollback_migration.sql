-- =====================================================================================
-- ROLLBACK MIGRATION SCRIPT
-- =====================================================================================
-- Purpose: Emergency rollback script to revert CV schema unification
-- Use Case: If migration fails or causes issues in production
-- Date: 2025-06-21
-- =====================================================================================

-- WARNING: This script will drop the unified tables and restore the original state
-- Only use this script if the migration has failed and you need to revert changes

-- Enable safe mode and transaction handling
SET SQL_SAFE_UPDATES = 0;
SET FOREIGN_KEY_CHECKS = 0;

-- Start transaction for rollback capability
START TRANSACTION;

-- =====================================================================================
-- STEP 1: BACKUP UNIFIED TABLES (if they contain data)
-- =====================================================================================

-- Create backup tables with timestamp
SET @backup_suffix = DATE_FORMAT(NOW(), '%Y%m%d_%H%i%s');

-- Backup work_experience table
SET @sql = CONCAT('CREATE TABLE work_experience_backup_', @backup_suffix, ' AS SELECT * FROM work_experience');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Backup education_record table  
SET @sql = CONCAT('CREATE TABLE education_record_backup_', @backup_suffix, ' AS SELECT * FROM education_record');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT CONCAT('Backup tables created with suffix: ', @backup_suffix) as backup_status;

-- =====================================================================================
-- STEP 2: DROP UNIFIED TABLES
-- =====================================================================================

-- Drop indexes first
DROP INDEX IF EXISTS idx_work_experience_user_id ON work_experience;
DROP INDEX IF EXISTS idx_work_experience_dates ON work_experience;
DROP INDEX IF EXISTS idx_work_experience_status ON work_experience;
DROP INDEX IF EXISTS idx_work_experience_current ON work_experience;

DROP INDEX IF EXISTS idx_education_record_user_id ON education_record;
DROP INDEX IF EXISTS idx_education_record_type ON education_record;
DROP INDEX IF EXISTS idx_education_record_status ON education_record;
DROP INDEX IF EXISTS idx_education_record_dates ON education_record;
DROP INDEX IF EXISTS idx_education_record_verification ON education_record;
DROP INDEX IF EXISTS idx_education_record_ongoing ON education_record;

-- Drop foreign key constraints
ALTER TABLE work_experience DROP FOREIGN KEY IF EXISTS fk_work_experience_user;
ALTER TABLE work_experience DROP FOREIGN KEY IF EXISTS fk_work_experience_created_by;
ALTER TABLE work_experience DROP FOREIGN KEY IF EXISTS fk_work_experience_updated_by;

ALTER TABLE education_record DROP FOREIGN KEY IF EXISTS fk_education_record_user;
ALTER TABLE education_record DROP FOREIGN KEY IF EXISTS fk_education_record_created_by;
ALTER TABLE education_record DROP FOREIGN KEY IF EXISTS fk_education_record_updated_by;

-- Drop the unified tables
DROP TABLE IF EXISTS work_experience;
DROP TABLE IF EXISTS education_record;

SELECT 'Unified tables dropped successfully' as rollback_status;

-- =====================================================================================
-- STEP 3: VERIFY ORIGINAL TABLES EXIST
-- =====================================================================================

-- Check if original tables still exist
SELECT 
    'ORIGINAL TABLES STATUS' as check_type,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'experiencia') as experiencia_exists,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'experience') as experience_exists,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'experiencias') as experiencias_exists,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'education') as education_exists;

-- =====================================================================================
-- STEP 4: RESTORE ORIGINAL TABLE STRUCTURE (if needed)
-- =====================================================================================

-- If original tables were dropped during migration, recreate them
-- This section should only be used if the original tables were accidentally dropped

-- Recreate experiencia table (legacy)
CREATE TABLE IF NOT EXISTS experiencia (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    empresa VARCHAR(255) NOT NULL,
    cargo VARCHAR(255) NOT NULL,
    fechaInicio DATE NOT NULL,
    fechaFin DATE,
    descripcion TEXT,
    comentario TEXT,
    user_id BINARY(16) NOT NULL,
    CONSTRAINT fk_experiencia_user FOREIGN KEY (user_id) REFERENCES user_entity(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Recreate experience table (current)
CREATE TABLE IF NOT EXISTS experience (
    id BINARY(16) PRIMARY KEY,
    user_id BINARY(16) NOT NULL,
    company VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    description TEXT,
    comments TEXT,
    document_url VARCHAR(255),
    CONSTRAINT fk_experience_user FOREIGN KEY (user_id) REFERENCES user_entity(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Recreate experiencias table (plural)
CREATE TABLE IF NOT EXISTS experiencias (
    id BINARY(16) PRIMARY KEY,
    userId BINARY(16) NOT NULL,
    empresa VARCHAR(255) NOT NULL,
    cargo VARCHAR(255) NOT NULL,
    fechaInicio DATE NOT NULL,
    fechaFin DATE,
    descripcion TEXT,
    comentario TEXT,
    documentUrl VARCHAR(255),
    CONSTRAINT fk_experiencias_user FOREIGN KEY (userId) REFERENCES user_entity(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Recreate education table
CREATE TABLE IF NOT EXISTS education (
    id BINARY(16) PRIMARY KEY,
    user_id BINARY(16) NOT NULL,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    institution VARCHAR(255) NOT NULL,
    issue_date DATE,
    average DECIMAL(4,2),
    duration_years INTEGER,
    hourly_load INTEGER,
    thesis_topic TEXT,
    activity_type VARCHAR(100),
    activity_role VARCHAR(100),
    exposition_place_date VARCHAR(255),
    document_url VARCHAR(255),
    comments TEXT,
    CONSTRAINT fk_education_user FOREIGN KEY (user_id) REFERENCES user_entity(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================================================
-- STEP 5: RESTORE DATA FROM BACKUP (if needed)
-- =====================================================================================

-- This section would restore data from the backup tables back to original tables
-- Only use if data was lost during migration

-- Note: This would require complex reverse mapping from unified schema back to original schemas
-- It's recommended to restore from a database backup instead of trying to reverse-migrate

SELECT 'Original table structure restored' as rollback_status;

-- =====================================================================================
-- STEP 6: VERIFY ROLLBACK SUCCESS
-- =====================================================================================

-- Check table counts
SELECT 'POST-ROLLBACK VERIFICATION' as status;

SELECT 'experiencia' as table_name, COUNT(*) as record_count FROM experiencia
UNION ALL
SELECT 'experience' as table_name, COUNT(*) as record_count FROM experience
UNION ALL
SELECT 'experiencias' as table_name, COUNT(*) as record_count FROM experiencias
UNION ALL
SELECT 'education' as table_name, COUNT(*) as record_count FROM education;

-- Verify no unified tables exist
SELECT 
    'UNIFIED TABLES CLEANUP CHECK' as check_type,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'work_experience') as work_experience_exists,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'education_record') as education_record_exists;

-- =====================================================================================
-- STEP 7: COMMIT ROLLBACK
-- =====================================================================================

-- Commit the rollback changes
COMMIT;

-- Re-enable safety checks
SET FOREIGN_KEY_CHECKS = 1;
SET SQL_SAFE_UPDATES = 1;

-- =====================================================================================
-- ROLLBACK COMPLETE
-- =====================================================================================

SELECT 'ROLLBACK COMPLETED SUCCESSFULLY' as final_status;
SELECT CONCAT('Backup tables available: work_experience_backup_', @backup_suffix, ', education_record_backup_', @backup_suffix) as backup_info;

-- =====================================================================================
-- POST-ROLLBACK ACTIONS REQUIRED
-- =====================================================================================
-- 1. Update application configuration to use original table names
-- 2. Restart application services
-- 3. Verify application functionality
-- 4. Investigate root cause of migration failure
-- 5. Plan corrective actions for next migration attempt
-- 6. Clean up backup tables after verification (optional)
-- =====================================================================================

-- To clean up backup tables later (run manually after verification):
-- SET @cleanup_sql = CONCAT('DROP TABLE IF EXISTS work_experience_backup_', @backup_suffix);
-- PREPARE cleanup_stmt FROM @cleanup_sql;
-- EXECUTE cleanup_stmt;
-- DEALLOCATE PREPARE cleanup_stmt;

-- SET @cleanup_sql = CONCAT('DROP TABLE IF EXISTS education_record_backup_', @backup_suffix);
-- PREPARE cleanup_stmt FROM @cleanup_sql;
-- EXECUTE cleanup_stmt;
-- DEALLOCATE PREPARE cleanup_stmt;
