-- =====================================================
-- INSERTAR DATOS DE PRUEBA CV - VERSIÓN SIMPLE
-- =====================================================

USE mpd_concursos;

-- Usar el primer usuario disponible
SET @test_user_id = UNHEX('3027EF3BEB61418BBFC40A46B0715391');

-- Insertar experiencias laborales de prueba
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
) VALUES 
(
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
),
(
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
),
(
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
);

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
) VALUES
(
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
),
(
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
),
(
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
),
(
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
);

-- Verificar datos insertados
SELECT 'DATOS INSERTADOS EXITOSAMENTE' as resultado;
SELECT COUNT(*) as experiencias_insertadas FROM work_experience WHERE user_id = @test_user_id;
SELECT COUNT(*) as educacion_insertada FROM education_record WHERE user_id = @test_user_id;
