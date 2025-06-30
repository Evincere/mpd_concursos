-- =====================================================
-- PRUEBA FINAL DE INTEGRACIÓN - SISTEMA EDUCACIÓN
-- Fecha: 2025-06-29
-- Propósito: Validar que todas las correcciones funcionen
-- =====================================================

SELECT '========================================' as info;
SELECT 'PRUEBA FINAL DE INTEGRACIÓN' as title;
SELECT '========================================' as info;

-- 1. Verificar que solo existe education_record
SELECT 
    'VERIFICACIÓN TABLAS' as test_name,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = DATABASE() 
     AND table_name = 'education') as education_legacy_exists,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = DATABASE() 
     AND table_name = 'education_record') as education_record_exists,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.tables 
              WHERE table_schema = DATABASE() 
              AND table_name = 'education') = 0 
        AND (SELECT COUNT(*) FROM information_schema.tables 
             WHERE table_schema = DATABASE() 
             AND table_name = 'education_record') = 1 
        THEN 'PASS - Solo education_record existe'
        ELSE 'FAIL - Configuración incorrecta'
    END as result;

-- 2. Verificar estructura de education_record
SELECT 
    'VERIFICACIÓN ESTRUCTURA' as test_name,
    COUNT(*) as total_columns,
    CASE 
        WHEN COUNT(*) >= 25 THEN 'PASS - Estructura completa'
        ELSE 'FAIL - Faltan columnas'
    END as result
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'education_record';

-- 3. Verificar que hay datos en education_record
SELECT 
    'VERIFICACIÓN DATOS' as test_name,
    COUNT(*) as record_count,
    CASE 
        WHEN COUNT(*) > 0 THEN 'PASS - Contiene datos'
        ELSE 'INFO - Sin datos (normal en desarrollo)'
    END as result
FROM education_record;

-- 4. Verificar tipos de educación válidos en enum
SELECT 
    'VERIFICACIÓN ENUM TIPOS' as test_name,
    'education_type' as column_name,
    COLUMN_TYPE as enum_values,
    CASE 
        WHEN COLUMN_TYPE LIKE '%SCIENTIFIC_ACTIVITY%' 
        AND COLUMN_TYPE LIKE '%UNIVERSITY_DEGREE%'
        AND COLUMN_TYPE LIKE '%TRAINING_COURSE%'
        THEN 'PASS - Enum contiene tipos esperados'
        ELSE 'FAIL - Enum incompleto'
    END as result
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'education_record'
AND COLUMN_NAME = 'education_type';

-- 5. Verificar estados de educación válidos en enum
SELECT 
    'VERIFICACIÓN ENUM ESTADOS' as test_name,
    'education_status' as column_name,
    COLUMN_TYPE as enum_values,
    CASE 
        WHEN COLUMN_TYPE LIKE '%IN_PROGRESS%' 
        AND COLUMN_TYPE LIKE '%COMPLETED%'
        THEN 'PASS - Enum contiene estados esperados'
        ELSE 'FAIL - Enum incompleto'
    END as result
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'education_record'
AND COLUMN_NAME = 'education_status';

-- 6. Verificar campos específicos para actividad científica
SELECT 
    'VERIFICACIÓN CAMPOS CIENTÍFICOS' as test_name,
    COUNT(*) as scientific_fields,
    CASE 
        WHEN COUNT(*) >= 4 THEN 'PASS - Campos científicos presentes'
        ELSE 'FAIL - Faltan campos científicos'
    END as result
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'education_record'
AND COLUMN_NAME IN ('scientific_activity_type', 'scientific_activity_role', 'topic', 'comments');

-- 7. Verificar campos para diferentes tipos de educación
SELECT 
    'VERIFICACIÓN CAMPOS DIVERSOS' as test_name,
    COUNT(*) as education_fields,
    CASE 
        WHEN COUNT(*) >= 6 THEN 'PASS - Campos diversos presentes'
        ELSE 'FAIL - Faltan campos diversos'
    END as result
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'education_record'
AND COLUMN_NAME IN ('duration_years', 'average', 'thesis_topic', 'hourly_load', 'had_final_evaluation', 'exposition_place_date');

-- 8. Verificar campos de auditoría
SELECT 
    'VERIFICACIÓN AUDITORÍA' as test_name,
    COUNT(*) as audit_fields,
    CASE 
        WHEN COUNT(*) >= 3 THEN 'PASS - Campos de auditoría presentes'
        ELSE 'FAIL - Faltan campos de auditoría'
    END as result
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'education_record'
AND COLUMN_NAME IN ('created_at', 'updated_at', 'verification_status');

-- 9. Resumen final
SELECT 
    'RESUMEN FINAL' as test_name,
    'Sistema de Educación' as component,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.tables 
              WHERE table_schema = DATABASE() 
              AND table_name = 'education') = 0 
        AND (SELECT COUNT(*) FROM information_schema.tables 
             WHERE table_schema = DATABASE() 
             AND table_name = 'education_record') = 1
        THEN 'PASS - Sistema unificado correctamente'
        ELSE 'FAIL - Requiere revisión'
    END as final_result;

SELECT '========================================' as info;
SELECT 'PRUEBA COMPLETADA' as end_message;
SELECT '========================================' as info;
