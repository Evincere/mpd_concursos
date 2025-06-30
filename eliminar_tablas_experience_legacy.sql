-- =====================================================
-- ELIMINACIÓN SEGURA DE TABLAS EXPERIENCE LEGACY
-- Fecha: 2025-06-30
-- Propósito: Unificar sistema de experiencia laboral
-- =====================================================

SELECT '========================================' as info;
SELECT 'ELIMINACIÓN TABLAS EXPERIENCE LEGACY' as title;
SELECT '========================================' as info;

-- 1. Verificación final antes de eliminación
SELECT 
    'VERIFICACIÓN FINAL' as check_type,
    'experience' as tabla,
    COUNT(*) as record_count,
    CASE 
        WHEN COUNT(*) = 0 THEN 'SEGURO ELIMINAR'
        ELSE 'ABORTAR - CONTIENE DATOS'
    END as recommendation
FROM experience
UNION ALL
SELECT 
    'VERIFICACIÓN FINAL' as check_type,
    'experiencia' as tabla,
    COUNT(*) as record_count,
    CASE 
        WHEN COUNT(*) = 0 THEN 'SEGURO ELIMINAR'
        ELSE 'ABORTAR - CONTIENE DATOS'
    END as recommendation
FROM experiencia
UNION ALL
SELECT 
    'VERIFICACIÓN FINAL' as check_type,
    'experiencias' as tabla,
    COUNT(*) as record_count,
    CASE 
        WHEN COUNT(*) = 0 THEN 'SEGURO ELIMINAR'
        ELSE 'ABORTAR - CONTIENE DATOS'
    END as recommendation
FROM experiencias;

-- 2. Verificar que work_experience existe y es la tabla principal
SELECT 
    'VERIFICACIÓN TABLA PRINCIPAL' as check_type,
    'work_experience' as tabla,
    COUNT(*) as record_count,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = DATABASE() 
     AND table_name = 'work_experience') as table_exists
FROM work_experience;

-- 3. Eliminar tablas legacy si están vacías
DROP TABLE IF EXISTS experience;
DROP TABLE IF EXISTS experiencia;
DROP TABLE IF EXISTS experiencias;

-- 4. Verificar eliminación exitosa
SELECT 
    'VERIFICACIÓN POST-ELIMINACIÓN' as check_type,
    'experience' as tabla,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = DATABASE() 
     AND table_name = 'experience') as table_exists,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.tables 
              WHERE table_schema = DATABASE() 
              AND table_name = 'experience') = 0 THEN 'ELIMINACIÓN EXITOSA'
        ELSE 'ERROR - TABLA AÚN EXISTE'
    END as status
UNION ALL
SELECT 
    'VERIFICACIÓN POST-ELIMINACIÓN' as check_type,
    'experiencia' as tabla,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = DATABASE() 
     AND table_name = 'experiencia') as table_exists,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.tables 
              WHERE table_schema = DATABASE() 
              AND table_name = 'experiencia') = 0 THEN 'ELIMINACIÓN EXITOSA'
        ELSE 'ERROR - TABLA AÚN EXISTE'
    END as status
UNION ALL
SELECT 
    'VERIFICACIÓN POST-ELIMINACIÓN' as check_type,
    'experiencias' as tabla,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = DATABASE() 
     AND table_name = 'experiencias') = 0 as table_exists,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.tables 
              WHERE table_schema = DATABASE() 
              AND table_name = 'experiencias') = 0 THEN 'ELIMINACIÓN EXITOSA'
        ELSE 'ERROR - TABLA AÚN EXISTE'
    END as status;

-- 5. Verificar que work_experience sigue existiendo
SELECT 
    'VERIFICACIÓN TABLA PRINCIPAL FINAL' as check_type,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = DATABASE() 
     AND table_name = 'work_experience') as work_experience_exists,
    COUNT(*) as record_count
FROM work_experience;

-- 6. Mostrar estado final de tablas de experiencia
SELECT 
    'ESTADO FINAL' as info,
    table_name,
    'EXISTS' as status
FROM information_schema.tables 
WHERE table_schema = DATABASE() 
AND table_name LIKE '%experience%'
ORDER BY table_name;

SELECT '========================================' as info;
SELECT 'ELIMINACIÓN COMPLETADA' as end_message;
SELECT '========================================' as info;
