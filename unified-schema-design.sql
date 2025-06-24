-- =====================================================================================
-- UNIFIED DATABASE SCHEMA DESIGN - CV SYSTEM
-- =====================================================================================
-- Purpose: Define unified schema for experience and education tables
-- Language: English (consistent naming convention)
-- ID Strategy: UUID (BINARY(16)) for all entities
-- Date: 2025-06-21
-- =====================================================================================

-- =====================================================================================
-- 1. UNIFIED EXPERIENCE TABLE
-- =====================================================================================
-- Consolidates: experiencia, experience, experiencias → work_experience
-- Naming: English, snake_case, descriptive
-- Primary Key: UUID (BINARY(16))

CREATE TABLE work_experience (
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
    CONSTRAINT fk_work_experience_created_by 
        FOREIGN KEY (created_by) REFERENCES user_entity(id) ON DELETE SET NULL,
    CONSTRAINT fk_work_experience_updated_by 
        FOREIGN KEY (updated_by) REFERENCES user_entity(id) ON DELETE SET NULL,
    CONSTRAINT chk_work_experience_dates 
        CHECK (end_date IS NULL OR end_date >= start_date),
    CONSTRAINT chk_work_experience_current 
        CHECK ((is_current_position = TRUE AND end_date IS NULL) OR 
               (is_current_position = FALSE))
) ENGINE=InnoDB;

-- Indexes for performance
CREATE INDEX idx_work_experience_user_id ON work_experience(user_id);
CREATE INDEX idx_work_experience_dates ON work_experience(start_date, end_date);
CREATE INDEX idx_work_experience_status ON work_experience(verification_status);
CREATE INDEX idx_work_experience_current ON work_experience(is_current_position);

-- =====================================================================================
-- 2. UNIFIED EDUCATION TABLE
-- =====================================================================================
-- Consolidates: education, educacion → education_record
-- Naming: English, snake_case, comprehensive
-- Primary Key: UUID (BINARY(16))

CREATE TABLE education_record (
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
    CONSTRAINT fk_education_record_created_by 
        FOREIGN KEY (created_by) REFERENCES user_entity(id) ON DELETE SET NULL,
    CONSTRAINT fk_education_record_updated_by 
        FOREIGN KEY (updated_by) REFERENCES user_entity(id) ON DELETE SET NULL,
    CONSTRAINT chk_education_record_dates 
        CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date),
    CONSTRAINT chk_education_record_ongoing 
        CHECK ((is_ongoing = TRUE AND end_date IS NULL) OR 
               (is_ongoing = FALSE)),
    CONSTRAINT chk_education_record_grade 
        CHECK (final_grade IS NULL OR (final_grade >= 0 AND final_grade <= 10))
) ENGINE=InnoDB;

-- Indexes for performance
CREATE INDEX idx_education_record_user_id ON education_record(user_id);
CREATE INDEX idx_education_record_type ON education_record(education_type);
CREATE INDEX idx_education_record_status ON education_record(education_status);
CREATE INDEX idx_education_record_dates ON education_record(start_date, end_date);
CREATE INDEX idx_education_record_verification ON education_record(verification_status);
CREATE INDEX idx_education_record_ongoing ON education_record(is_ongoing);

-- =====================================================================================
-- 3. MIGRATION STRATEGY
-- =====================================================================================
-- This section defines the strategy to migrate from current fragmented tables
-- to the unified schema while preserving data integrity

-- Step 1: Create new unified tables (above)
-- Step 2: Migrate data from existing tables
-- Step 3: Update application code to use new tables
-- Step 4: Drop old tables after verification

-- =====================================================================================
-- 4. BENEFITS OF UNIFIED SCHEMA
-- =====================================================================================
-- ✅ Single source of truth for each entity type
-- ✅ Consistent English naming convention
-- ✅ Comprehensive field coverage for all use cases
-- ✅ Proper audit trail with created/updated tracking
-- ✅ Robust constraints and validation
-- ✅ Optimized indexes for common queries
-- ✅ Extensible design for future requirements
-- ✅ Clear separation between work experience and education
-- ✅ Support for verification workflow
-- ✅ Flexible document attachment system
