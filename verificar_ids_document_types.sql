-- =====================================================
-- VERIFICACIÓN DE IDs EN DOCUMENT_TYPES
-- Fecha: 2025-06-29
-- Propósito: Verificar IDs únicos y eliminar duplicados
-- =====================================================

SELECT '========================================' as info;
SELECT 'VERIFICACIÓN IDs DOCUMENT_TYPES' as title;
SELECT '========================================' as info;

-- 1. Verificar si la tabla existe
SELECT 
    'VERIFICACIÓN TABLA' as check_type,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = DATABASE() 
     AND table_name = 'document_types') as table_exists;

-- 2. Si la tabla existe, mostrar todos los registros
SELECT 
    'REGISTROS ACTUALES' as info,
    HEX(id) as id_hex,
    code,
    name,
    required,
    `order`
FROM document_types 
ORDER BY `order`;

-- 3. Verificar duplicados por ID
SELECT 
    'VERIFICACIÓN DUPLICADOS POR ID' as check_type,
    HEX(id) as id_hex,
    COUNT(*) as count
FROM document_types 
GROUP BY id
HAVING COUNT(*) > 1;

-- 4. Verificar duplicados por código
SELECT 
    'VERIFICACIÓN DUPLICADOS POR CODE' as check_type,
    code,
    COUNT(*) as count
FROM document_types 
GROUP BY code
HAVING COUNT(*) > 1;

-- 5. Verificar integridad referencial
SELECT 
    'VERIFICACIÓN INTEGRIDAD REFERENCIAL' as check_type,
    dt1.code as parent_code,
    dt2.code as child_code,
    dt2.name as child_name
FROM document_types dt1
RIGHT JOIN document_types dt2 ON dt1.id = dt2.parent_id
WHERE dt2.parent_id IS NOT NULL
ORDER BY dt1.code, dt2.code;

-- 6. Limpiar tabla si es necesario (comentado por seguridad)
-- DELETE FROM document_types;

SELECT '========================================' as info;
SELECT 'VERIFICACIÓN COMPLETADA' as end_message;
SELECT '========================================' as info;
