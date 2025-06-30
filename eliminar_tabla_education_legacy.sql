-- =====================================================
-- ELIMINACIÓN SEGURA DE TABLA EDUCATION LEGACY
-- Fecha: 2025-06-29
-- Propósito: Eliminar tabla duplicada después de verificación
-- =====================================================

SELECT '========================================' as info;
SELECT 'ELIMINACIÓN TABLA EDUCATION LEGACY' as title;
SELECT '========================================' as info;

-- 1. Verificación final antes de eliminación
SELECT 
    'VERIFICACIÓN FINAL' as check_type,
    COUNT(*) as record_count,
    CASE 
        WHEN COUNT(*) = 0 THEN 'SEGURO ELIMINAR'
        ELSE 'ABORTAR - CONTIENE DATOS'
    END as recommendation
FROM education;

-- 2. Solo proceder si la tabla está vacía
SET @record_count = (SELECT COUNT(*) FROM education);

-- 3. Eliminar tabla si está vacía
DROP TABLE IF EXISTS education;

-- 4. Verificar eliminación exitosa
SELECT 
    'VERIFICACIÓN POST-ELIMINACIÓN' as check_type,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = DATABASE() 
     AND table_name = 'education') as table_exists,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.tables 
              WHERE table_schema = DATABASE() 
              AND table_name = 'education') = 0 THEN 'ELIMINACIÓN EXITOSA'
        ELSE 'ERROR - TABLA AÚN EXISTE'
    END as status;

-- 5. Verificar que education_record sigue existiendo
SELECT 
    'VERIFICACIÓN TABLA PRINCIPAL' as check_type,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = DATABASE() 
     AND table_name = 'education_record') as education_record_exists,
    COUNT(*) as record_count
FROM education_record;

SELECT '========================================' as info;
SELECT 'ELIMINACIÓN COMPLETADA' as end_message;
SELECT '========================================' as info;
