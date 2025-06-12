-- ============================================================================
-- SCRIPT DE VERIFICACIÓN: CONSISTENCIA JPA-SCHEMA DATABASE
-- ============================================================================
-- Fecha: 2025-01-27
-- Objetivo: Verificar que las columnas en schema.sql coincidan con entidades JPA
-- Uso: mysql -u root -p mpd_concursos < verificar_consistencia_jpa_schema.sql
-- ============================================================================

USE mpd_concursos;

-- Mostrar información del script
SELECT '🔍 VERIFICACIÓN DE CONSISTENCIA JPA-SCHEMA DATABASE' AS info;
SELECT '📅 Fecha: 2025-01-27' AS info;
SELECT '🎯 Objetivo: Detectar inconsistencias entre entidades JPA y schema.sql' AS info;
SELECT '' AS info;

-- ============================================================================
-- 1. VERIFICAR ESTRUCTURA DE TABLAS CRÍTICAS
-- ============================================================================

SELECT '📋 1. VERIFICACIÓN DE ESTRUCTURA DE TABLAS CRÍTICAS' AS info;
SELECT '' AS info;

-- 1.1 Verificar tabla experience
SELECT '🔍 1.1 TABLA: experience' AS info;
DESCRIBE experience;
SELECT '' AS info;

-- 1.2 Verificar tabla inscriptions  
SELECT '🔍 1.2 TABLA: inscriptions' AS info;
DESCRIBE inscriptions;
SELECT '' AS info;

-- 1.3 Verificar tabla contests
SELECT '🔍 1.3 TABLA: contests' AS info;
DESCRIBE contests;
SELECT '' AS info;

-- 1.4 Verificar tabla education
SELECT '🔍 1.4 TABLA: education' AS info;
DESCRIBE education;
SELECT '' AS info;

-- 1.5 Verificar tabla user_entity
SELECT '🔍 1.5 TABLA: user_entity' AS info;
DESCRIBE user_entity;
SELECT '' AS info;

-- ============================================================================
-- 2. VERIFICAR RELACIONES MANY-TO-MANY
-- ============================================================================

SELECT '🔗 2. VERIFICACIÓN DE RELACIONES MANY-TO-MANY' AS info;
SELECT '' AS info;

-- 2.1 Verificar tabla user_roles
SELECT '🔍 2.1 TABLA: user_roles' AS info;
DESCRIBE user_roles;
SELECT '' AS info;

-- 2.2 Verificar tabla question_correct_answers
SELECT '🔍 2.2 TABLA: question_correct_answers' AS info;
DESCRIBE question_correct_answers;
SELECT '' AS info;

-- 2.3 Verificar tabla inscription_circunscripciones
SELECT '🔍 2.3 TABLA: inscription_circunscripciones' AS info;
DESCRIBE inscription_circunscripciones;
SELECT '' AS info;

-- ============================================================================
-- 3. VERIFICAR COLUMNAS ESPECÍFICAS PROBLEMÁTICAS
-- ============================================================================

SELECT '⚠️ 3. VERIFICACIÓN DE COLUMNAS PROBLEMÁTICAS' AS info;
SELECT '' AS info;

-- 3.1 Verificar columnas en experience que causan problemas
SELECT '🚨 3.1 EXPERIENCE - Verificar columnas snake_case vs camelCase' AS info;
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    CASE 
        WHEN COLUMN_NAME = 'user_id' THEN '✅ CORRECTO (no userId)'
        WHEN COLUMN_NAME = 'start_date' THEN '✅ CORRECTO (no startDate)'
        WHEN COLUMN_NAME = 'end_date' THEN '✅ CORRECTO (no endDate)'
        WHEN COLUMN_NAME = 'document_url' THEN '✅ CORRECTO (no documentUrl)'
        WHEN COLUMN_NAME IN ('userId', 'startDate', 'endDate', 'documentUrl') THEN '❌ INCORRECTO - debería ser snake_case'
        ELSE '✅ OK'
    END AS status_jpa
FROM information_schema.COLUMNS 
WHERE table_schema = 'mpd_concursos' 
  AND table_name = 'experience'
ORDER BY ORDINAL_POSITION;
SELECT '' AS info;

-- 3.2 Verificar columnas en inscriptions
SELECT '🚨 3.2 INSCRIPTIONS - Verificar columnas snake_case vs camelCase' AS info;
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    CASE 
        WHEN COLUMN_NAME = 'contest_id' THEN '✅ CORRECTO (no contestId)'
        WHEN COLUMN_NAME = 'user_id' THEN '✅ CORRECTO (no userId)'
        WHEN COLUMN_NAME = 'created_at' THEN '✅ CORRECTO (no createdAt)'
        WHEN COLUMN_NAME = 'updated_at' THEN '✅ CORRECTO (no updatedAt)'
        WHEN COLUMN_NAME = 'inscription_date' THEN '✅ CORRECTO (no inscriptionDate)'
        WHEN COLUMN_NAME = 'current_step' THEN '✅ CORRECTO (no currentStep)'
        WHEN COLUMN_NAME = 'accepted_terms' THEN '✅ CORRECTO (no acceptedTerms)'
        WHEN COLUMN_NAME = 'confirmed_personal_data' THEN '✅ CORRECTO (no confirmedPersonalData)'
        WHEN COLUMN_NAME = 'centro_de_vida' THEN '✅ CORRECTO (no centroDeVida)'
        WHEN COLUMN_NAME = 'terms_acceptance_date' THEN '✅ CORRECTO (no termsAcceptanceDate)'
        WHEN COLUMN_NAME = 'data_confirmation_date' THEN '✅ CORRECTO (no dataConfirmationDate)'
        WHEN COLUMN_NAME = 'documentation_deadline' THEN '✅ CORRECTO (no documentationDeadline)'
        WHEN COLUMN_NAME = 'frozen_date' THEN '✅ CORRECTO (no frozenDate)'
        WHEN COLUMN_NAME IN ('contestId', 'userId', 'createdAt', 'updatedAt', 'inscriptionDate', 
                            'currentStep', 'acceptedTerms', 'confirmedPersonalData', 'centroDeVida',
                            'termsAcceptanceDate', 'dataConfirmationDate', 'documentationDeadline', 'frozenDate') 
        THEN '❌ INCORRECTO - debería ser snake_case'
        ELSE '✅ OK'
    END AS status_jpa
FROM information_schema.COLUMNS 
WHERE table_schema = 'mpd_concursos' 
  AND table_name = 'inscriptions'
ORDER BY ORDINAL_POSITION;
SELECT '' AS info;

-- 3.3 Verificar columnas en contests
SELECT '🚨 3.3 CONTESTS - Verificar columnas snake_case vs camelCase' AS info;
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    CASE 
        WHEN COLUMN_NAME = 'start_date' THEN '✅ CORRECTO (no startDate)'
        WHEN COLUMN_NAME = 'end_date' THEN '✅ CORRECTO (no endDate)'
        WHEN COLUMN_NAME = 'bases_url' THEN '✅ CORRECTO (no basesUrl)'
        WHEN COLUMN_NAME = 'description_url' THEN '✅ CORRECTO (no descriptionUrl)'
        WHEN COLUMN_NAME = 'created_at' THEN '✅ CORRECTO (no createdAt)'
        WHEN COLUMN_NAME = 'updated_at' THEN '✅ CORRECTO (no updatedAt)'
        WHEN COLUMN_NAME IN ('startDate', 'endDate', 'basesUrl', 'descriptionUrl', 'createdAt', 'updatedAt') 
        THEN '❌ INCORRECTO - debería ser snake_case'
        ELSE '✅ OK'
    END AS status_jpa
FROM information_schema.COLUMNS 
WHERE table_schema = 'mpd_concursos' 
  AND table_name = 'contests'
ORDER BY ORDINAL_POSITION;
SELECT '' AS info;

-- 3.4 Verificar columnas en education
SELECT '🚨 3.4 EDUCATION - Verificar columnas snake_case vs camelCase' AS info;
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    CASE 
        WHEN COLUMN_NAME = 'userId' THEN '✅ CORRECTO según schema.sql'
        WHEN COLUMN_NAME = 'issueDate' THEN '✅ CORRECTO según schema.sql'
        WHEN COLUMN_NAME = 'documentUrl' THEN '✅ CORRECTO según schema.sql'
        WHEN COLUMN_NAME = 'durationYears' THEN '✅ CORRECTO según schema.sql'
        WHEN COLUMN_NAME = 'thesisTopic' THEN '✅ CORRECTO según schema.sql'
        WHEN COLUMN_NAME = 'hourlyLoad' THEN '✅ CORRECTO según schema.sql'
        WHEN COLUMN_NAME = 'hadFinalEvaluation' THEN '✅ CORRECTO según schema.sql'
        WHEN COLUMN_NAME = 'activityType' THEN '✅ CORRECTO según schema.sql'
        WHEN COLUMN_NAME = 'activityRole' THEN '✅ CORRECTO según schema.sql'
        WHEN COLUMN_NAME = 'expositionPlaceDate' THEN '✅ CORRECTO según schema.sql'
        ELSE '✅ OK'
    END AS status_jpa
FROM information_schema.COLUMNS 
WHERE table_schema = 'mpd_concursos' 
  AND table_name = 'education'
ORDER BY ORDINAL_POSITION;
SELECT '' AS info;

-- ============================================================================
-- 4. VERIFICAR FOREIGN KEYS
-- ============================================================================

SELECT '🔗 4. VERIFICACIÓN DE FOREIGN KEYS' AS info;
SELECT '' AS info;

-- 4.1 Verificar foreign keys de experience
SELECT '🔍 4.1 FOREIGN KEYS: experience' AS info;
SELECT 
    CONSTRAINT_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE 
WHERE table_schema = 'mpd_concursos' 
  AND table_name = 'experience'
  AND REFERENCED_TABLE_NAME IS NOT NULL;
SELECT '' AS info;

-- 4.2 Verificar foreign keys de inscriptions
SELECT '🔍 4.2 FOREIGN KEYS: inscriptions' AS info;
SELECT 
    CONSTRAINT_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE 
WHERE table_schema = 'mpd_concursos' 
  AND table_name = 'inscriptions'
  AND REFERENCED_TABLE_NAME IS NOT NULL;
SELECT '' AS info;

-- 4.3 Verificar foreign keys de user_roles
SELECT '🔍 4.3 FOREIGN KEYS: user_roles' AS info;
SELECT 
    CONSTRAINT_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE 
WHERE table_schema = 'mpd_concursos' 
  AND table_name = 'user_roles'
  AND REFERENCED_TABLE_NAME IS NOT NULL;
SELECT '' AS info;

-- ============================================================================
-- 5. RESUMEN DE PROBLEMAS DETECTADOS
-- ============================================================================

SELECT '📊 5. RESUMEN DE PROBLEMAS DETECTADOS' AS info;
SELECT '' AS info;

-- Contar tablas que existen
SELECT 
    'TABLAS EXISTENTES:' AS categoria,
    COUNT(*) AS cantidad
FROM information_schema.tables 
WHERE table_schema = 'mpd_concursos'

UNION ALL

-- Verificar tablas críticas específicas
SELECT 
    'experience:' AS categoria,
    CASE WHEN COUNT(*) > 0 THEN '✅ EXISTE' ELSE '❌ NO EXISTE' END AS cantidad
FROM information_schema.tables 
WHERE table_schema = 'mpd_concursos' AND table_name = 'experience'

UNION ALL

SELECT 
    'inscriptions:' AS categoria,
    CASE WHEN COUNT(*) > 0 THEN '✅ EXISTE' ELSE '❌ NO EXISTE' END AS cantidad
FROM information_schema.tables 
WHERE table_schema = 'mpd_concursos' AND table_name = 'inscriptions'

UNION ALL

SELECT 
    'user_roles:' AS categoria,
    CASE WHEN COUNT(*) > 0 THEN '✅ EXISTE' ELSE '❌ NO EXISTE' END AS cantidad
FROM information_schema.tables 
WHERE table_schema = 'mpd_concursos' AND table_name = 'user_roles'

UNION ALL

SELECT 
    'question_correct_answers:' AS categoria,
    CASE WHEN COUNT(*) > 0 THEN '✅ EXISTE' ELSE '❌ NO EXISTE' END AS cantidad
FROM information_schema.tables 
WHERE table_schema = 'mpd_concursos' AND table_name = 'question_correct_answers';

SELECT '' AS info;
SELECT '✅ VERIFICACIÓN COMPLETADA' AS info;
SELECT '📋 Revisar resultados para identificar inconsistencias JPA-Schema' AS info;
SELECT '🚨 Las columnas marcadas como ❌ INCORRECTO requieren corrección en entidades JPA' AS info;
