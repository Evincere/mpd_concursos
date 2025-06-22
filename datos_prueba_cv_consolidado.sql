-- =====================================================
-- DATOS DE PRUEBA - SISTEMA CV CONSOLIDADO
-- =====================================================
-- Fecha: 2025-06-22
-- Propósito: Crear datos de prueba para validar el sistema CV consolidado
-- Base de datos: mpd_concursos

USE mpd_concursos;

-- =====================================================
-- 1. VERIFICAR USUARIOS EXISTENTES
-- =====================================================

SELECT 
    'USUARIOS DISPONIBLES PARA TESTING' as seccion,
    '===================================' as separador;

SELECT 
    id,
    username,
    email,
    first_name,
    last_name,
    created_at
FROM user_entity 
WHERE is_active = 1
ORDER BY created_at DESC
LIMIT 5;

-- =====================================================
-- 2. INSERTAR DATOS DE PRUEBA EN WORK_EXPERIENCE
-- =====================================================

SELECT 
    'INSERTANDO EXPERIENCIAS LABORALES DE PRUEBA' as seccion,
    '============================================' as separador;

-- Obtener el primer usuario activo para las pruebas
SET @test_user_id = (SELECT id FROM user_entity WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1);

SELECT CONCAT('Usuario de prueba seleccionado: ', IFNULL(HEX(@test_user_id), 'NINGUNO')) as info;

-- Insertar experiencias laborales de prueba (solo si hay un usuario)
INSERT INTO work_experience (
    id,
    user_id,
    company_name,
    position_title,
    start_date,
    end_date,
    is_current_position,
    job_description,
    key_achievements,
    verification_status,
    is_deleted,
    created_at,
    updated_at
) 
SELECT 
    UNHEX(REPLACE(UUID(), '-', '')),
    @test_user_id,
    'Ministerio Público de la Defensa',
    'Analista de Sistemas',
    '2022-01-15',
    '2024-06-30',
    0,
    'Desarrollo y mantenimiento de sistemas informáticos para la gestión de concursos públicos.',
    'Implementación de sistema de gestión de CV con arquitectura hexagonal.',
    'PENDING',
    0,
    NOW(),
    NOW()
WHERE @test_user_id IS NOT NULL

UNION ALL

SELECT 
    UNHEX(REPLACE(UUID(), '-', '')),
    @test_user_id,
    'Empresa de Tecnología ABC',
    'Desarrollador Full Stack',
    '2020-03-01',
    '2021-12-31',
    0,
    'Desarrollo de aplicaciones web usando Angular y Spring Boot.',
    'Migración exitosa de sistema legacy a arquitectura moderna.',
    'VERIFIED',
    0,
    NOW(),
    NOW()
WHERE @test_user_id IS NOT NULL

UNION ALL

SELECT 
    UNHEX(REPLACE(UUID(), '-', '')),
    @test_user_id,
    'Consultora XYZ',
    'Consultor Senior',
    '2024-07-01',
    NULL,
    1,
    'Consultoría en transformación digital y modernización de sistemas.',
    'Liderazgo de equipo de 5 desarrolladores.',
    'PENDING',
    0,
    NOW(),
    NOW()
WHERE @test_user_id IS NOT NULL;

-- =====================================================
-- 3. INSERTAR DATOS DE PRUEBA EN EDUCATION_RECORD
-- =====================================================

SELECT 
    'INSERTANDO REGISTROS DE EDUCACIÓN DE PRUEBA' as seccion,
    '===========================================' as separador;

-- Insertar registros de educación de prueba
INSERT INTO education_record (
    id,
    user_id,
    education_type,
    education_status,
    program_title,
    institution_name,
    start_date,
    end_date,
    verification_status,
    is_ongoing,
    created_at,
    updated_at
)
SELECT 
    UNHEX(REPLACE(UUID(), '-', '')),
    @test_user_id,
    'UNIVERSITY_DEGREE',
    'COMPLETED',
    'Licenciatura en Sistemas de Información',
    'Universidad Nacional de Buenos Aires',
    '2016-03-01',
    '2020-12-15',
    'VERIFIED',
    0,
    NOW(),
    NOW()
WHERE @test_user_id IS NOT NULL

UNION ALL

SELECT 
    UNHEX(REPLACE(UUID(), '-', '')),
    @test_user_id,
    'POSTGRADUATE_SPECIALIZATION',
    'COMPLETED',
    'Especialización en Arquitectura de Software',
    'Universidad Tecnológica Nacional',
    '2021-04-01',
    '2022-11-30',
    'VERIFIED',
    0,
    NOW(),
    NOW()
WHERE @test_user_id IS NOT NULL

UNION ALL

SELECT 
    UNHEX(REPLACE(UUID(), '-', '')),
    @test_user_id,
    'CERTIFICATION',
    'COMPLETED',
    'Certificación Spring Boot Professional',
    'Pivotal Software',
    '2023-01-15',
    '2023-03-15',
    'PENDING',
    0,
    NOW(),
    NOW()
WHERE @test_user_id IS NOT NULL

UNION ALL

SELECT 
    UNHEX(REPLACE(UUID(), '-', '')),
    @test_user_id,
    'MASTER_DEGREE',
    'IN_PROGRESS',
    'Maestría en Ingeniería de Software',
    'Universidad de San Andrés',
    '2024-03-01',
    NULL,
    'PENDING',
    1,
    NOW(),
    NOW()
WHERE @test_user_id IS NOT NULL;

-- =====================================================
-- 4. VERIFICAR DATOS INSERTADOS
-- =====================================================

SELECT 
    'VERIFICACIÓN DE DATOS INSERTADOS' as seccion,
    '=================================' as separador;

-- Contar registros insertados
SELECT 
    'work_experience' as tabla,
    COUNT(*) as registros_insertados
FROM work_experience 
WHERE user_id = @test_user_id

UNION ALL

SELECT 
    'education_record' as tabla,
    COUNT(*) as registros_insertados
FROM education_record 
WHERE user_id = @test_user_id;

-- Mostrar experiencias insertadas
SELECT 
    'EXPERIENCIAS LABORALES INSERTADAS' as seccion,
    '==================================' as separador;

SELECT 
    HEX(id) as experience_id,
    company_name,
    position_title,
    start_date,
    end_date,
    is_current_position,
    verification_status
FROM work_experience 
WHERE user_id = @test_user_id
ORDER BY start_date DESC;

-- Mostrar educación insertada
SELECT 
    'REGISTROS DE EDUCACIÓN INSERTADOS' as seccion,
    '==================================' as separador;

SELECT 
    HEX(id) as education_id,
    education_type,
    education_status,
    program_title,
    institution_name,
    start_date,
    end_date,
    is_ongoing,
    verification_status
FROM education_record 
WHERE user_id = @test_user_id
ORDER BY start_date DESC;

-- =====================================================
-- 5. ESTADÍSTICAS FINALES
-- =====================================================

SELECT 
    'ESTADÍSTICAS DEL SISTEMA CV CONSOLIDADO' as seccion,
    '=======================================' as separador;

SELECT 
    'Total de tablas CV activas' as metrica,
    COUNT(*) as valor
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'mpd_concursos' 
AND TABLE_NAME IN ('work_experience', 'education_record')

UNION ALL

SELECT 
    'Total experiencias laborales' as metrica,
    COUNT(*) as valor
FROM work_experience

UNION ALL

SELECT 
    'Total registros de educación' as metrica,
    COUNT(*) as valor
FROM education_record

UNION ALL

SELECT 
    'Usuarios con datos CV' as metrica,
    COUNT(DISTINCT user_id) as valor
FROM (
    SELECT user_id FROM work_experience
    UNION
    SELECT user_id FROM education_record
) as cv_users;

-- =====================================================
-- 6. VERIFICACIÓN DE INTEGRIDAD
-- =====================================================

SELECT 
    'VERIFICACIÓN DE INTEGRIDAD DE DATOS' as seccion,
    '====================================' as separador;

-- Verificar foreign keys
SELECT 
    'Experiencias con usuarios válidos' as verificacion,
    COUNT(*) as total,
    COUNT(u.id) as validos,
    (COUNT(*) - COUNT(u.id)) as invalidos
FROM work_experience we
LEFT JOIN user_entity u ON we.user_id = u.id

UNION ALL

SELECT 
    'Educación con usuarios válidos' as verificacion,
    COUNT(*) as total,
    COUNT(u.id) as validos,
    (COUNT(*) - COUNT(u.id)) as invalidos
FROM education_record er
LEFT JOIN user_entity u ON er.user_id = u.id;

-- =====================================================
-- FIN DEL SCRIPT DE DATOS DE PRUEBA
-- =====================================================

SELECT 
    '✅ DATOS DE PRUEBA INSERTADOS EXITOSAMENTE' as resultado_final,
    'Sistema CV consolidado listo para testing' as estado_final;
