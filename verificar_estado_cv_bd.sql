-- =====================================================
-- SCRIPT DE VERIFICACIÓN - ESTADO ACTUAL CV EN BD
-- =====================================================
-- Fecha: 2025-06-22
-- Propósito: Auditar estado actual de tablas CV y preparar consolidación
-- Base de datos: mpd_concursos

USE mpd_concursos;

-- =====================================================
-- 1. VERIFICAR EXISTENCIA DE TABLAS CV
-- =====================================================

SELECT 
    'VERIFICACIÓN DE TABLAS CV' as seccion,
    '=========================' as separador;

SELECT 
    TABLE_NAME as tabla_cv,
    TABLE_ROWS as registros_aprox,
    ROUND(((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024), 2) as tamaño_mb,
    ENGINE as motor,
    TABLE_COLLATION as collation
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'mpd_concursos' 
AND TABLE_NAME IN ('experience', 'experiencias', 'work_experience', 'education', 'education_record')
ORDER BY TABLE_NAME;

-- =====================================================
-- 2. CONTAR REGISTROS EXACTOS EN CADA TABLA
-- =====================================================

SELECT 
    'CONTEO EXACTO DE REGISTROS' as seccion,
    '===========================' as separador;

-- Tabla experience
SELECT 'experience' as tabla, COUNT(*) as registros_exactos FROM experience;

-- Tabla experiencias  
SELECT 'experiencias' as tabla, COUNT(*) as registros_exactos FROM experiencias;

-- Tabla work_experience
SELECT 'work_experience' as tabla, COUNT(*) as registros_exactos FROM work_experience;

-- Tabla education
SELECT 'education' as tabla, COUNT(*) as registros_exactos FROM education;

-- Tabla education_record
SELECT 'education_record' as tabla, COUNT(*) as registros_exactos FROM education_record;

-- =====================================================
-- 3. VERIFICAR ESTRUCTURA DE TABLAS RECOMENDADAS
-- =====================================================

SELECT 
    'ESTRUCTURA WORK_EXPERIENCE (RECOMENDADA)' as seccion,
    '=========================================' as separador;

DESCRIBE work_experience;

SELECT 
    'ESTRUCTURA EDUCATION_RECORD (RECOMENDADA)' as seccion,
    '=========================================' as separador;

DESCRIBE education_record;

-- =====================================================
-- 4. VERIFICAR FOREIGN KEYS Y CONSTRAINTS
-- =====================================================

SELECT 
    'FOREIGN KEYS EN TABLAS CV' as seccion,
    '==========================' as separador;

SELECT 
    TABLE_NAME as tabla,
    COLUMN_NAME as columna,
    CONSTRAINT_NAME as constraint_name,
    REFERENCED_TABLE_NAME as tabla_referenciada,
    REFERENCED_COLUMN_NAME as columna_referenciada
FROM information_schema.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = 'mpd_concursos' 
AND TABLE_NAME IN ('experience', 'experiencias', 'work_experience', 'education', 'education_record')
AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME, COLUMN_NAME;

-- =====================================================
-- 5. VERIFICAR ÍNDICES EN TABLAS CV
-- =====================================================

SELECT 
    'ÍNDICES EN TABLAS CV' as seccion,
    '====================' as separador;

SELECT 
    TABLE_NAME as tabla,
    INDEX_NAME as indice,
    COLUMN_NAME as columna,
    NON_UNIQUE as no_unico,
    INDEX_TYPE as tipo_indice
FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = 'mpd_concursos' 
AND TABLE_NAME IN ('experience', 'experiencias', 'work_experience', 'education', 'education_record')
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;

-- =====================================================
-- 6. VERIFICAR DATOS DE MUESTRA (SI EXISTEN)
-- =====================================================

SELECT 
    'DATOS DE MUESTRA - WORK_EXPERIENCE' as seccion,
    '===================================' as separador;

SELECT 
    id,
    company_name,
    position_title,
    start_date,
    end_date,
    is_current_position,
    verification_status,
    created_at
FROM work_experience 
LIMIT 5;

SELECT 
    'DATOS DE MUESTRA - EDUCATION_RECORD' as seccion,
    '====================================' as separador;

SELECT 
    id,
    education_type,
    education_status,
    program_title,
    institution_name,
    start_date,
    end_date,
    verification_status,
    created_at
FROM education_record 
LIMIT 5;

-- =====================================================
-- 7. VERIFICAR USUARIOS EXISTENTES PARA TESTING
-- =====================================================

SELECT 
    'USUARIOS DISPONIBLES PARA TESTING CV' as seccion,
    '=====================================' as separador;

SELECT 
    id,
    username,
    email,
    first_name,
    last_name,
    created_at,
    is_active
FROM user_entity 
WHERE is_active = 1
ORDER BY created_at DESC
LIMIT 10;

-- =====================================================
-- 8. VERIFICAR CONFIGURACIÓN DE ARCHIVOS
-- =====================================================

SELECT 
    'VERIFICACIÓN DE DOCUMENTOS EXISTENTES' as seccion,
    '=====================================' as separador;

-- Verificar si hay documentos referenciados en work_experience
SELECT 
    'work_experience' as tabla,
    COUNT(*) as total_registros,
    COUNT(supporting_document_url) as con_documento,
    COUNT(*) - COUNT(supporting_document_url) as sin_documento
FROM work_experience;

-- Verificar si hay documentos referenciados en education_record
SELECT 
    'education_record' as tabla,
    COUNT(*) as total_registros,
    COUNT(supporting_document_url) as con_documento,
    COUNT(*) - COUNT(supporting_document_url) as sin_documento
FROM education_record;

-- =====================================================
-- 9. ANÁLISIS DE REDUNDANCIA
-- =====================================================

SELECT 
    'ANÁLISIS DE REDUNDANCIA DE TABLAS' as seccion,
    '==================================' as separador;

-- Comparar estructuras de tablas de experiencia
SELECT 
    'COMPARACIÓN TABLAS EXPERIENCIA' as analisis,
    'experience: 9 campos básicos' as experience_info,
    'experiencias: 9 campos básicos (español)' as experiencias_info,
    'work_experience: 21 campos completos' as work_experience_info;

-- Comparar estructuras de tablas de educación
SELECT 
    'COMPARACIÓN TABLAS EDUCACIÓN' as analisis,
    'education: 18 campos básicos' as education_info,
    'education_record: 29 campos completos' as education_record_info;

-- =====================================================
-- 10. RECOMENDACIONES DE CONSOLIDACIÓN
-- =====================================================

SELECT 
    'RECOMENDACIONES DE CONSOLIDACIÓN' as seccion,
    '=================================' as separador;

SELECT 
    'TABLAS A MANTENER' as categoria,
    'work_experience' as tabla,
    'Estructura completa con auditoría y soft delete' as razon
UNION ALL
SELECT 
    'TABLAS A MANTENER' as categoria,
    'education_record' as tabla,
    'Estructura completa con todos los tipos de educación' as razon
UNION ALL
SELECT 
    'TABLAS A ELIMINAR' as categoria,
    'experience' as tabla,
    'Redundante - funcionalidad cubierta por work_experience' as razon
UNION ALL
SELECT 
    'TABLAS A ELIMINAR' as categoria,
    'experiencias' as tabla,
    'Redundante - funcionalidad cubierta por work_experience' as razon
UNION ALL
SELECT 
    'TABLAS A ELIMINAR' as categoria,
    'education' as tabla,
    'Redundante - funcionalidad cubierta por education_record' as razon;

-- =====================================================
-- 11. SCRIPT DE LIMPIEZA (COMENTADO - EJECUTAR MANUALMENTE)
-- =====================================================

SELECT 
    'SCRIPT DE LIMPIEZA PROPUESTO' as seccion,
    '=============================' as separador;

SELECT 
    'IMPORTANTE: Verificar que las tablas redundantes estén vacías antes de eliminar' as advertencia;

/*
-- EJECUTAR SOLO SI LAS TABLAS ESTÁN VACÍAS:

-- Verificar conteos antes de eliminar
SELECT 'experience' as tabla, COUNT(*) as registros FROM experience;
SELECT 'experiencias' as tabla, COUNT(*) as registros FROM experiencias;
SELECT 'education' as tabla, COUNT(*) as registros FROM education;

-- Si todos los conteos son 0, proceder con la eliminación:
-- DROP TABLE IF EXISTS experience;
-- DROP TABLE IF EXISTS experiencias;
-- DROP TABLE IF EXISTS education;

-- Verificar que las tablas principales existan después de la limpieza:
-- SHOW TABLES LIKE 'work_experience';
-- SHOW TABLES LIKE 'education_record';
*/

-- =====================================================
-- 12. VERIFICACIÓN FINAL
-- =====================================================

SELECT 
    'VERIFICACIÓN FINAL DEL ESTADO' as seccion,
    '==============================' as separador;

SELECT 
    COUNT(*) as total_tablas_cv
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'mpd_concursos' 
AND TABLE_NAME IN ('experience', 'experiencias', 'work_experience', 'education', 'education_record');

SELECT 
    'Estado actual: 5 tablas CV detectadas' as estado_actual,
    'Estado objetivo: 2 tablas CV (work_experience, education_record)' as estado_objetivo,
    'Acción requerida: Eliminar 3 tablas redundantes' as accion_requerida;

-- =====================================================
-- FIN DEL SCRIPT DE VERIFICACIÓN
-- =====================================================
