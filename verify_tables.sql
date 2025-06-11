-- Script de verificación para comprobar si las tablas se crearon correctamente
USE mpd_concursos;

-- Mostrar todas las tablas
SELECT 'TODAS LAS TABLAS EN LA BASE DE DATOS:' AS info;
SHOW TABLES;

-- Verificar específicamente las tablas problemáticas
SELECT 'VERIFICACIÓN DE TABLAS ESPECÍFICAS:' AS info;

-- Verificar tabla notifications
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'notifications: ✅ EXISTE'
        ELSE 'notifications: ❌ NO EXISTE'
    END AS status
FROM information_schema.tables 
WHERE table_schema = 'mpd_concursos' AND table_name = 'notifications';

-- Verificar tabla inscriptions
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'inscriptions: ✅ EXISTE'
        ELSE 'inscriptions: ❌ NO EXISTE'
    END AS status
FROM information_schema.tables 
WHERE table_schema = 'mpd_concursos' AND table_name = 'inscriptions';

-- Verificar tabla inscription_sessions
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'inscription_sessions: ✅ EXISTE'
        ELSE 'inscription_sessions: ❌ NO EXISTE'
    END AS status
FROM information_schema.tables 
WHERE table_schema = 'mpd_concursos' AND table_name = 'inscription_sessions';

-- Verificar tabla inscription_circunscripciones
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'inscription_circunscripciones: ✅ EXISTE'
        ELSE 'inscription_circunscripciones: ❌ NO EXISTE'
    END AS status
FROM information_schema.tables 
WHERE table_schema = 'mpd_concursos' AND table_name = 'inscription_circunscripciones';

-- Mostrar estructura de la tabla notifications si existe
SELECT 'ESTRUCTURA DE LA TABLA NOTIFICATIONS:' AS info;
DESCRIBE notifications;

-- Mostrar estructura de la tabla inscriptions si existe
SELECT 'ESTRUCTURA DE LA TABLA INSCRIPTIONS:' AS info;
DESCRIBE inscriptions;
