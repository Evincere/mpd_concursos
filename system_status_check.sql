-- Script completo para verificar el estado del sistema
USE mpd_concursos;

-- 1. Verificar todas las tablas críticas
SELECT 'VERIFICACIÓN DE TABLAS CRÍTICAS:' AS info;

SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'user_entity: ✅ EXISTE'
        ELSE 'user_entity: ❌ NO EXISTE'
    END AS status
FROM information_schema.tables 
WHERE table_schema = 'mpd_concursos' AND table_name = 'user_entity';

SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'contests: ✅ EXISTE'
        ELSE 'contests: ❌ NO EXISTE'
    END AS status
FROM information_schema.tables 
WHERE table_schema = 'mpd_concursos' AND table_name = 'contests';

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

SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'experience: ✅ EXISTE'
        ELSE 'experience: ❌ NO EXISTE'
    END AS status
FROM information_schema.tables 
WHERE table_schema = 'mpd_concursos' AND table_name = 'experience';

SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'document_types: ✅ EXISTE'
        ELSE 'document_types: ❌ NO EXISTE'
    END AS status
FROM information_schema.tables 
WHERE table_schema = 'mpd_concursos' AND table_name = 'document_types';

-- 2. Contar registros en tablas principales
SELECT 'CONTEO DE REGISTROS:' AS info;
SELECT 'Usuarios' AS tabla, COUNT(*) AS cantidad FROM user_entity
UNION ALL
SELECT 'Concursos' AS tabla, COUNT(*) AS cantidad FROM contests
UNION ALL
SELECT 'Inscripciones' AS tabla, COUNT(*) AS cantidad FROM inscriptions
UNION ALL
SELECT 'Notificaciones' AS tabla, COUNT(*) AS cantidad FROM notifications
UNION ALL
SELECT 'Experiencias' AS tabla, COUNT(*) AS cantidad FROM experience
UNION ALL
SELECT 'Tipos de Documentos' AS tabla, COUNT(*) AS cantidad FROM document_types
UNION ALL
SELECT 'Documentos' AS tabla, COUNT(*) AS cantidad FROM documents
UNION ALL
SELECT 'Fechas de Concursos' AS tabla, COUNT(*) AS cantidad FROM contest_dates
UNION ALL
SELECT 'Requisitos de Concursos' AS tabla, COUNT(*) AS cantidad FROM contest_requirements;

-- 3. Verificar concursos activos
SELECT 'CONCURSOS ACTIVOS PARA INSCRIPCIÓN:' AS info;
SELECT 
    id,
    title,
    department,
    position,
    status,
    startDate,
    endDate,
    CASE 
        WHEN status = 'INSCRIPTION_OPEN' AND endDate >= CURDATE() THEN '✅ DISPONIBLE'
        WHEN status = 'INSCRIPTION_OPEN' AND endDate < CURDATE() THEN '⚠️ VENCIDO'
        ELSE '❌ NO DISPONIBLE'
    END AS disponibilidad
FROM contests 
WHERE status = 'INSCRIPTION_OPEN'
ORDER BY startDate;

-- 4. Verificar usuarios de prueba
SELECT 'USUARIOS DE PRUEBA:' AS info;
SELECT 
    username,
    email,
    firstName,
    lastName,
    CASE 
        WHEN username LIKE '%admin%' THEN 'ADMINISTRADOR'
        WHEN username LIKE '%test%' THEN 'USUARIO DE PRUEBA'
        ELSE 'USUARIO REGULAR'
    END AS tipo_usuario
FROM user_entity 
ORDER BY username
LIMIT 10;

-- 5. Total de tablas en la base de datos
SELECT 'RESUMEN GENERAL:' AS info;
SELECT COUNT(*) AS total_tablas FROM information_schema.tables WHERE table_schema = 'mpd_concursos';

-- 6. Verificar integridad de foreign keys
SELECT 'VERIFICACIÓN DE INTEGRIDAD:' AS info;
SELECT 
    'Concursos sin fechas' AS problema,
    COUNT(*) AS cantidad
FROM contests c
LEFT JOIN contest_dates cd ON c.id = cd.contestId
WHERE cd.contestId IS NULL

UNION ALL

SELECT 
    'Concursos sin requisitos' AS problema,
    COUNT(*) AS cantidad
FROM contests c
LEFT JOIN contest_requirements cr ON c.id = cr.contestId
WHERE cr.contestId IS NULL;

SELECT 'Verificación del sistema completada' AS resultado;
