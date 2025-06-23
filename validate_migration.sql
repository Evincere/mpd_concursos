-- =====================================================================================
-- MIGRATION VALIDATION SCRIPT
-- =====================================================================================
-- Purpose: Comprehensive validation of CV schema migration
-- Tables: work_experience, education_record
-- Date: 2025-06-21
-- =====================================================================================

-- =====================================================================================
-- SECTION 1: BASIC TABLE VALIDATION
-- =====================================================================================

SELECT '========================================' as separator;
SELECT 'MIGRATION VALIDATION REPORT' as title;
SELECT '========================================' as separator;

-- Check if unified tables exist
SELECT 'TABLE EXISTENCE CHECK' as validation_type;
SELECT 
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'work_experience') as work_experience_exists,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'education_record') as education_record_exists,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'work_experience') = 1 
         AND (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'education_record') = 1
        THEN 'PASS'
        ELSE 'FAIL'
    END as table_existence_status;

-- =====================================================================================
-- SECTION 2: DATA COUNT VALIDATION
-- =====================================================================================

SELECT 'DATA COUNT VALIDATION' as validation_type;

-- Count records in unified tables
SELECT 'work_experience' as table_name, COUNT(*) as record_count FROM work_experience
UNION ALL
SELECT 'education_record' as table_name, COUNT(*) as record_count FROM education_record;

-- Count records in original tables (if they still exist)
SELECT 'ORIGINAL TABLE COUNTS (for comparison)' as info;
SELECT 'experiencia' as original_table, COUNT(*) as record_count FROM experiencia
UNION ALL
SELECT 'experience' as original_table, COUNT(*) as record_count FROM experience
UNION ALL
SELECT 'experiencias' as original_table, COUNT(*) as record_count FROM experiencias
UNION ALL
SELECT 'education' as original_table, COUNT(*) as record_count FROM education;

-- =====================================================================================
-- SECTION 3: DATA INTEGRITY VALIDATION
-- =====================================================================================

SELECT 'DATA INTEGRITY VALIDATION' as validation_type;

-- Check for orphaned work experience records
SELECT 'WORK EXPERIENCE - Orphaned Records' as check_name, COUNT(*) as violation_count
FROM work_experience we 
LEFT JOIN user_entity ue ON we.user_id = ue.id 
WHERE ue.id IS NULL;

-- Check for orphaned education records
SELECT 'EDUCATION RECORD - Orphaned Records' as check_name, COUNT(*) as violation_count
FROM education_record er 
LEFT JOIN user_entity ue ON er.user_id = ue.id 
WHERE ue.id IS NULL;

-- Check work experience date constraints
SELECT 'WORK EXPERIENCE - Date Constraint Violations' as check_name, COUNT(*) as violation_count
FROM work_experience 
WHERE end_date IS NOT NULL AND start_date IS NOT NULL AND end_date < start_date;

-- Check education date constraints
SELECT 'EDUCATION RECORD - Date Constraint Violations' as check_name, COUNT(*) as violation_count
FROM education_record 
WHERE end_date IS NOT NULL AND start_date IS NOT NULL AND end_date < start_date;

-- Check work experience required fields
SELECT 'WORK EXPERIENCE - Missing Required Fields' as check_name, COUNT(*) as violation_count
FROM work_experience 
WHERE company_name IS NULL OR company_name = '' 
   OR position_title IS NULL OR position_title = '';

-- Check education required fields
SELECT 'EDUCATION RECORD - Missing Required Fields' as check_name, COUNT(*) as violation_count
FROM education_record 
WHERE institution_name IS NULL OR institution_name = '' 
   OR program_title IS NULL OR program_title = '';

-- Check work experience current position logic
SELECT 'WORK EXPERIENCE - Current Position Logic Errors' as check_name, COUNT(*) as violation_count
FROM work_experience 
WHERE (is_current_position = TRUE AND end_date IS NOT NULL)
   OR (is_current_position = FALSE AND end_date IS NULL);

-- Check education ongoing logic
SELECT 'EDUCATION RECORD - Ongoing Logic Errors' as check_name, COUNT(*) as violation_count
FROM education_record 
WHERE (is_ongoing = TRUE AND education_status != 'IN_PROGRESS')
   OR (is_ongoing = FALSE AND education_status = 'IN_PROGRESS');

-- Check education grade constraints
SELECT 'EDUCATION RECORD - Grade Constraint Violations' as check_name, COUNT(*) as violation_count
FROM education_record 
WHERE final_grade IS NOT NULL AND (final_grade < 0 OR final_grade > 10);

-- =====================================================================================
-- SECTION 4: SCHEMA VALIDATION
-- =====================================================================================

SELECT 'SCHEMA VALIDATION' as validation_type;

-- Check work_experience table structure
SELECT 'WORK EXPERIENCE - Column Count' as check_name, COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'work_experience';

-- Check education_record table structure
SELECT 'EDUCATION RECORD - Column Count' as check_name, COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'education_record';

-- Check foreign key constraints
SELECT 'FOREIGN KEY CONSTRAINTS' as check_name, COUNT(*) as constraint_count
FROM information_schema.table_constraints 
WHERE table_name IN ('work_experience', 'education_record') 
AND constraint_type = 'FOREIGN KEY';

-- Check indexes
SELECT 'INDEXES' as check_name, COUNT(*) as index_count
FROM information_schema.statistics 
WHERE table_name IN ('work_experience', 'education_record');

-- =====================================================================================
-- SECTION 5: DATA QUALITY VALIDATION
-- =====================================================================================

SELECT 'DATA QUALITY VALIDATION' as validation_type;

-- Check for duplicate work experience records
SELECT 'WORK EXPERIENCE - Potential Duplicates' as check_name, COUNT(*) as duplicate_count
FROM (
    SELECT user_id, company_name, position_title, start_date, COUNT(*) as cnt
    FROM work_experience 
    GROUP BY user_id, company_name, position_title, start_date
    HAVING COUNT(*) > 1
) duplicates;

-- Check for duplicate education records
SELECT 'EDUCATION RECORD - Potential Duplicates' as check_name, COUNT(*) as duplicate_count
FROM (
    SELECT user_id, institution_name, program_title, education_type, COUNT(*) as cnt
    FROM education_record 
    GROUP BY user_id, institution_name, program_title, education_type
    HAVING COUNT(*) > 1
) duplicates;

-- Check data distribution by user
SELECT 'WORK EXPERIENCE - Users with Records' as check_name, COUNT(DISTINCT user_id) as user_count
FROM work_experience;

SELECT 'EDUCATION RECORD - Users with Records' as check_name, COUNT(DISTINCT user_id) as user_count
FROM education_record;

-- =====================================================================================
-- SECTION 6: SAMPLE DATA VERIFICATION
-- =====================================================================================

SELECT 'SAMPLE DATA VERIFICATION' as validation_type;

-- Show sample work experience records
SELECT 'WORK EXPERIENCE - Sample Records' as info;
SELECT 
    BIN_TO_UUID(id) as id,
    BIN_TO_UUID(user_id) as user_id,
    company_name,
    position_title,
    start_date,
    end_date,
    is_current_position,
    verification_status
FROM work_experience 
ORDER BY created_at DESC
LIMIT 3;

-- Show sample education records
SELECT 'EDUCATION RECORD - Sample Records' as info;
SELECT 
    BIN_TO_UUID(id) as id,
    BIN_TO_UUID(user_id) as user_id,
    education_type,
    education_status,
    institution_name,
    program_title,
    final_grade,
    is_ongoing
FROM education_record 
ORDER BY created_at DESC
LIMIT 3;

-- =====================================================================================
-- SECTION 7: PERFORMANCE VALIDATION
-- =====================================================================================

SELECT 'PERFORMANCE VALIDATION' as validation_type;

-- Test query performance on work_experience
EXPLAIN SELECT * FROM work_experience WHERE user_id = UUID_TO_BIN('123e4567-e89b-12d3-a456-426614174000');

-- Test query performance on education_record
EXPLAIN SELECT * FROM education_record WHERE user_id = UUID_TO_BIN('123e4567-e89b-12d3-a456-426614174000');

-- =====================================================================================
-- SECTION 8: FINAL VALIDATION SUMMARY
-- =====================================================================================

SELECT 'FINAL VALIDATION SUMMARY' as summary_type;

-- Calculate overall validation score
SET @orphaned_work = (SELECT COUNT(*) FROM work_experience we LEFT JOIN user_entity ue ON we.user_id = ue.id WHERE ue.id IS NULL);
SET @orphaned_edu = (SELECT COUNT(*) FROM education_record er LEFT JOIN user_entity ue ON er.user_id = ue.id WHERE ue.id IS NULL);
SET @date_violations_work = (SELECT COUNT(*) FROM work_experience WHERE end_date IS NOT NULL AND start_date IS NOT NULL AND end_date < start_date);
SET @date_violations_edu = (SELECT COUNT(*) FROM education_record WHERE end_date IS NOT NULL AND start_date IS NOT NULL AND end_date < start_date);
SET @missing_fields_work = (SELECT COUNT(*) FROM work_experience WHERE company_name IS NULL OR position_title IS NULL);
SET @missing_fields_edu = (SELECT COUNT(*) FROM education_record WHERE institution_name IS NULL OR program_title IS NULL);
SET @logic_errors_work = (SELECT COUNT(*) FROM work_experience WHERE (is_current_position = TRUE AND end_date IS NOT NULL) OR (is_current_position = FALSE AND end_date IS NULL));
SET @logic_errors_edu = (SELECT COUNT(*) FROM education_record WHERE (is_ongoing = TRUE AND education_status != 'IN_PROGRESS') OR (is_ongoing = FALSE AND education_status = 'IN_PROGRESS'));
SET @grade_violations = (SELECT COUNT(*) FROM education_record WHERE final_grade IS NOT NULL AND (final_grade < 0 OR final_grade > 10));

SELECT 
    'VALIDATION SUMMARY' as summary,
    @orphaned_work as orphaned_work_experience,
    @orphaned_edu as orphaned_education,
    @date_violations_work as date_violations_work,
    @date_violations_edu as date_violations_education,
    @missing_fields_work as missing_fields_work,
    @missing_fields_edu as missing_fields_education,
    @logic_errors_work as logic_errors_work,
    @logic_errors_edu as logic_errors_education,
    @grade_violations as grade_violations,
    CASE 
        WHEN @orphaned_work = 0 AND @orphaned_edu = 0 AND @date_violations_work = 0 AND @date_violations_edu = 0 
         AND @missing_fields_work = 0 AND @missing_fields_edu = 0 AND @logic_errors_work = 0 AND @logic_errors_edu = 0 
         AND @grade_violations = 0
        THEN 'MIGRATION_SUCCESS'
        ELSE 'MIGRATION_ISSUES_DETECTED'
    END as overall_status;

SELECT '========================================' as separator;
SELECT 'VALIDATION REPORT COMPLETE' as title;
SELECT '========================================' as separator;

-- =====================================================================================
-- VALIDATION COMPLETE
-- =====================================================================================
-- If overall_status = 'MIGRATION_SUCCESS', the migration was successful
-- If overall_status = 'MIGRATION_ISSUES_DETECTED', review the specific violations above
-- =====================================================================================
