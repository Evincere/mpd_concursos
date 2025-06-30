-- =====================================================
-- VERIFICACIÓN DE TABLA EDUCATION LEGACY
-- Fecha: 2025-06-29
-- Propósito: Verificar estado antes de eliminación
-- =====================================================

SELECT '========================================' as info;
SELECT 'VERIFICACIÓN TABLA EDUCATION LEGACY' as title;
SELECT '========================================' as info;

-- 1. Verificar si la tabla existe
SELECT 
    'EXISTENCIA DE TABLA' as check_type,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = DATABASE() 
     AND table_name = 'education') as table_exists;

-- 2. Contar registros en la tabla education
SELECT 
    'CONTEO DE REGISTROS' as check_type,
    COUNT(*) as record_count 
FROM education;

-- 3. Verificar estructura de la tabla education
SELECT 
    'ESTRUCTURA DE TABLA' as check_type,
    COLUMN_NAME as column_name,
    DATA_TYPE as data_type,
    IS_NULLABLE as nullable,
    COLUMN_DEFAULT as default_value
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'education'
ORDER BY ORDINAL_POSITION;

-- 4. Si hay datos, mostrar muestra de los primeros 5 registros
SELECT 
    'MUESTRA DE DATOS (PRIMEROS 5)' as info,
    BIN_TO_UUID(id) as id,
    BIN_TO_UUID(user_id) as user_id,
    type,
    status,
    title,
    institution,
    issue_date,
    document_url
FROM education 
LIMIT 5;

-- 5. Verificar si hay referencias a esta tabla en otras tablas
SELECT 
    'REFERENCIAS EXTERNAS' as check_type,
    TABLE_NAME as referencing_table,
    COLUMN_NAME as referencing_column,
    CONSTRAINT_NAME as constraint_name
FROM information_schema.KEY_COLUMN_USAGE 
WHERE REFERENCED_TABLE_SCHEMA = DATABASE() 
AND REFERENCED_TABLE_NAME = 'education';

-- 6. Verificar índices en la tabla
SELECT 
    'ÍNDICES EN TABLA' as check_type,
    INDEX_NAME as index_name,
    COLUMN_NAME as column_name,
    NON_UNIQUE as non_unique
FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'education'
ORDER BY INDEX_NAME, SEQ_IN_INDEX;

-- 7. Comparar con education_record para verificar migración
SELECT 
    'COMPARACIÓN CON EDUCATION_RECORD' as info,
    'education' as table_name,
    COUNT(*) as record_count
FROM education
UNION ALL
SELECT 
    'COMPARACIÓN CON EDUCATION_RECORD' as info,
    'education_record' as table_name,
    COUNT(*) as record_count
FROM education_record;

-- 8. Verificar si hay datos duplicados entre ambas tablas
SELECT 
    'VERIFICACIÓN DUPLICADOS' as check_type,
    'Usuarios con datos en ambas tablas' as description,
    COUNT(DISTINCT e1.user_id) as users_in_both_tables
FROM education e1
INNER JOIN education_record e2 ON e1.user_id = e2.user_id;

-- 9. Recomendación final
SELECT 
    CASE 
        WHEN (SELECT COUNT(*) FROM education) = 0 THEN 'SEGURO ELIMINAR - Tabla vacía'
        WHEN (SELECT COUNT(*) FROM education) > 0 AND 
             (SELECT COUNT(*) FROM education_record) = 0 THEN 'MIGRAR DATOS PRIMERO - Solo education tiene datos'
        WHEN (SELECT COUNT(*) FROM education) > 0 AND 
             (SELECT COUNT(*) FROM education_record) > 0 THEN 'VERIFICAR MIGRACIÓN - Ambas tablas tienen datos'
        ELSE 'REVISAR MANUALMENTE'
    END as recommendation;

SELECT '========================================' as info;
SELECT 'FIN DE VERIFICACIÓN' as end_message;
SELECT '========================================' as info;
