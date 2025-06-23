-- =====================================================
-- INSERTAR DATOS DE EDUCACIÓN DE PRUEBA - CORREGIDO
-- =====================================================

USE mpd_concursos;

-- Usar el primer usuario disponible
SET @test_user_id = UNHEX('3027EF3BEB61418BBFC40A46B0715391');

-- Insertar registros de educación de prueba con valores enum correctos
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
    'POSTGRADUATE_DEGREE',
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
SELECT 'EDUCACIÓN INSERTADA EXITOSAMENTE' as resultado;
SELECT COUNT(*) as educacion_insertada FROM education_record WHERE user_id = @test_user_id;
