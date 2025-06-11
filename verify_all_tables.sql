-- Script para verificar TODAS las tablas que deberían existir según schema.sql
USE mpd_concursos;

-- Mostrar todas las tablas actuales
SELECT 'TABLAS ACTUALES EN LA BASE DE DATOS:' AS info;
SHOW TABLES;

-- Verificar tablas específicas que deberían existir según schema.sql
SELECT 'VERIFICACIÓN EXHAUSTIVA DE TODAS LAS TABLAS:' AS info;

-- Tablas principales
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'user_entity: ✅ EXISTE'
        ELSE 'user_entity: ❌ NO EXISTE'
    END AS status
FROM information_schema.tables 
WHERE table_schema = 'mpd_concursos' AND table_name = 'user_entity';

SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'roles: ✅ EXISTE'
        ELSE 'roles: ❌ NO EXISTE'
    END AS status
FROM information_schema.tables 
WHERE table_schema = 'mpd_concursos' AND table_name = 'roles';

SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'user_roles: ✅ EXISTE'
        ELSE 'user_roles: ❌ NO EXISTE'
    END AS status
FROM information_schema.tables 
WHERE table_schema = 'mpd_concursos' AND table_name = 'user_roles';

-- Tablas de experiencia
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'experiencia: ✅ EXISTE'
        ELSE 'experiencia: ❌ NO EXISTE'
    END AS status
FROM information_schema.tables 
WHERE table_schema = 'mpd_concursos' AND table_name = 'experiencia';

SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'experience: ✅ EXISTE'
        ELSE 'experience: ❌ NO EXISTE'
    END AS status
FROM information_schema.tables 
WHERE table_schema = 'mpd_concursos' AND table_name = 'experience';

-- Tablas de concursos
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'contests: ✅ EXISTE'
        ELSE 'contests: ❌ NO EXISTE'
    END AS status
FROM information_schema.tables 
WHERE table_schema = 'mpd_concursos' AND table_name = 'contests';

-- Tablas de inscripciones (ya verificadas)
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'inscriptions: ✅ EXISTE'
        ELSE 'inscriptions: ❌ NO EXISTE'
    END AS status
FROM information_schema.tables 
WHERE table_schema = 'mpd_concursos' AND table_name = 'inscriptions';

SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'notifications: ✅ EXISTE'
        ELSE 'notifications: ❌ NO EXISTE'
    END AS status
FROM information_schema.tables 
WHERE table_schema = 'mpd_concursos' AND table_name = 'notifications';

-- Tablas de documentos
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'document_types: ✅ EXISTE'
        ELSE 'document_types: ❌ NO EXISTE'
    END AS status
FROM information_schema.tables 
WHERE table_schema = 'mpd_concursos' AND table_name = 'document_types';

SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'documents: ✅ EXISTE'
        ELSE 'documents: ❌ NO EXISTE'
    END AS status
FROM information_schema.tables 
WHERE table_schema = 'mpd_concursos' AND table_name = 'documents';

-- Tablas de educación
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'education: ✅ EXISTE'
        ELSE 'education: ❌ NO EXISTE'
    END AS status
FROM information_schema.tables 
WHERE table_schema = 'mpd_concursos' AND table_name = 'education';

-- Tablas de exámenes
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'examinations: ✅ EXISTE'
        ELSE 'examinations: ❌ NO EXISTE'
    END AS status
FROM information_schema.tables 
WHERE table_schema = 'mpd_concursos' AND table_name = 'examinations';

SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'questions: ✅ EXISTE'
        ELSE 'questions: ❌ NO EXISTE'
    END AS status
FROM information_schema.tables 
WHERE table_schema = 'mpd_concursos' AND table_name = 'questions';

SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'options: ✅ EXISTE'
        ELSE 'options: ❌ NO EXISTE'
    END AS status
FROM information_schema.tables 
WHERE table_schema = 'mpd_concursos' AND table_name = 'options';

-- Contar total de tablas
SELECT COUNT(*) AS total_tablas FROM information_schema.tables WHERE table_schema = 'mpd_concursos';
