SET SQL_SAFE_UPDATES = 0;
-- Deshabilitar verificación de foreign keys temporalmente
SET FOREIGN_KEY_CHECKS = 0;

-- Limpiar datos existentes
DELETE FROM answers;
DELETE FROM question_options;
DELETE FROM questions;
DELETE FROM examination_sessions;
DELETE FROM examinations;
DELETE FROM inscriptions;
DELETE FROM user_roles;
DELETE FROM roles;
DELETE FROM user_entity;
DELETE FROM contests;

-- Habilitar verificación de foreign keys
SET FOREIGN_KEY_CHECKS = 1;

-- Insertar roles de prueba
INSERT INTO roles (id, name) VALUES
(UUID_TO_BIN('11111111-1111-1111-1111-111111111111'), 'ROLE_USER'),
(UUID_TO_BIN('22222222-2222-2222-2222-222222222222'), 'ROLE_ADMIN');

-- Insertar usuario administrador por defecto
INSERT INTO user_entity (id, username, password, email, dni, cuit, first_name, last_name, created_at) 
VALUES (
    UUID_TO_BIN('33333333-3333-3333-3333-333333333333'),
    'admin',
    '$2a$10$rPiEAgQNIT1TCoKi.XaJCeZv7nE9GM3lmcLtJBXGdnU5vtN0oJzNW', -- password: admin123
    'admin@mpd.gov.ar',
    '20000000',
    '20200000007',
    'Admin',
    'MPD',
    CURRENT_TIMESTAMP
);

-- Insertar usuarios de prueba con IDs fijos
INSERT INTO user_entity (id, username, password, email, dni, cuit, first_name, last_name, created_at)
VALUES
(UUID_TO_BIN('44444444-4444-4444-4444-444444444444'), 'usuario1', 
'$2a$10$rPiEAgQNIT1TCoKi.XaJCeZv7nE9GM3lmcLtJBXGdnU5vtN0oJzNW', 
'usuario1@test.com', '20111111', '20201111118', 'Usuario', 'Uno', CURRENT_TIMESTAMP),
(UUID_TO_BIN('55555555-5555-5555-5555-555555555555'), 'usuario2', 
'$2a$10$rPiEAgQNIT1TCoKi.XaJCeZv7nE9GM3lmcLtJBXGdnU5vtN0oJzNW', 
'usuario2@test.com', '20222222', '20202222229', 'Usuario', 'Dos', CURRENT_TIMESTAMP),
(UUID_TO_BIN('66666666-6666-6666-6666-666666666666'), 'semper', 
'$2a$10$rPiEAgQNIT1TCoKi.XaJCeZv7nE9GM3lmcLtJBXGdnU5vtN0oJzNW', 
'semper@test.com', '26598410', '20265984107', 'Sebastian', 'Pereyra', CURRENT_TIMESTAMP);

-- Insertar exámenes de prueba con diferentes estados y fechas
INSERT INTO examinations (id, title, description, duration_minutes, status, start_time, end_time, type)
VALUES
-- Examen disponible ahora (PUBLISHED y dentro del rango de fechas)
(UUID_TO_BIN('77777777-7777-7777-7777-777777777777'), 
'Examen Técnico-Jurídico - Defensor Penal', 
'Evaluación de conocimientos en derecho penal y procesal penal', 
120, 'PUBLISHED', 
DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 HOUR), 
DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 2 HOUR), 
'TECHNICAL_LEGAL'),

-- Examen programado para futuro (PUBLISHED pero fecha futura)
(UUID_TO_BIN('88888888-8888-8888-8888-888888888888'), 
'Examen Técnico-Administrativo - Defensoría Civil', 
'Evaluación de procedimientos administrativos y gestión', 
90, 'PUBLISHED', 
DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 DAY), 
DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 7 DAY), 
'TECHNICAL_ADMINISTRATIVE'),

-- Examen en borrador
(UUID_TO_BIN('99999999-9999-9999-9999-999999999999'), 
'Examen Psicológico - En Preparación', 
'Evaluación de aptitudes psicológicas para el cargo', 
60, 'DRAFT', 
DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 10 DAY), 
DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 11 DAY), 
'PSYCHOLOGICAL'),

-- Examen disponible para rendir ahora (corta duración)
(UUID_TO_BIN('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'), 
'Examen Rápido - Conocimientos Generales', 
'Evaluación rápida de conocimientos generales sobre derecho', 
15, 'PUBLISHED', 
DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 DAY), 
DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 7 DAY), 
'TECHNICAL_LEGAL'),

-- Examen disponible para rendir ahora (duración media)
(UUID_TO_BIN('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'), 
'Examen Técnico-Jurídico - Defensoría Penal Juvenil', 
'Evaluación de conocimientos en derecho penal juvenil', 
45, 'PUBLISHED', 
DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 2 DAY), 
DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 5 DAY), 
'TECHNICAL_LEGAL'),

-- Examen disponible para rendir ahora (larga duración)
(UUID_TO_BIN('cccccccc-cccc-cccc-cccc-cccccccccccc'), 
'Examen Completo - Defensoría Civil y Comercial', 
'Evaluación exhaustiva de conocimientos en derecho civil y comercial', 
120, 'PUBLISHED', 
DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 3 DAY), 
DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 3 DAY), 
'TECHNICAL_LEGAL'),

-- Examen finalizado
(UUID_TO_BIN('11111111-2222-3333-4444-555555555555'), 
'Examen Técnico-Jurídico - Defensoría Penal 2024', 
'Evaluación finalizada de conocimientos penales', 
120, 'COMPLETED', 
DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 48 HOUR), 
DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 46 HOUR), 
'TECHNICAL_LEGAL'),

-- Examen anulado
(UUID_TO_BIN('22222222-3333-4444-5555-666666666666'), 
'Examen Técnico-Administrativo - Anulado', 
'Este examen fue anulado por irregularidades', 
90, 'CANCELLED', 
DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 24 HOUR), 
DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 22 HOUR), 
'TECHNICAL_ADMINISTRATIVE'),

-- Examen en curso (algunos usuarios ya lo están rindiendo)
(UUID_TO_BIN('dddddddd-dddd-dddd-dddd-dddddddddddd'), 
'Examen Técnico-Jurídico - Defensoría Civil Actual', 
'Evaluación de conocimientos en derecho civil y procesal', 
120, 'IN_PROGRESS', 
DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 30 MINUTE), 
DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 90 MINUTE), 
'TECHNICAL_LEGAL'),

-- Otro examen disponible ahora (para tener más opciones)
(UUID_TO_BIN('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'), 
'Examen Técnico-Administrativo - Secretaría', 
'Evaluación de procedimientos y gestión administrativa', 
60, 'PUBLISHED', 
DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 15 MINUTE), 
DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 45 MINUTE), 
'TECHNICAL_ADMINISTRATIVE');

-- Insertar concursos
INSERT INTO contests (id, department, position, status, start_date, end_date)
VALUES 
(1, 'DEFENSORÍAS PENALES', 'Defensor/a Penal - Primera C.J.', 'ACTIVE', DATE(CURRENT_TIMESTAMP), DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 30 DAY)),
(2, 'DEFENSORÍAS CIVILES', 'Defensor/a Civil - Segunda C.J.', 'ACTIVE', DATE(CURRENT_TIMESTAMP), DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 30 DAY)),
(3, 'SECRETARÍA LEGAL Y TÉCNICA', 'Asesor/a Legal', 'ACTIVE', DATE(CURRENT_TIMESTAMP), DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 30 DAY)),
(4, 'DESARROLLO TECNOLÓGICO', 'Analista Programador/a', 'ACTIVE', DATE(CURRENT_TIMESTAMP), DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 30 DAY)),
(5, 'CODEFENSORÍAS DE FAMILIA', 'Defensor/a de Familia - Primera C.J.', 'ACTIVE', DATE(CURRENT_TIMESTAMP), DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 30 DAY));

-- Insertar preguntas para el primer examen
SET @examen1_id = UUID_TO_BIN('77777777-7777-7777-7777-777777777777');

INSERT INTO questions (id, examination_id, text, type, score, order_number)
VALUES
(UUID_TO_BIN('99999999-9999-9999-9999-999999999999'), @examen1_id, '¿Cuál es el principio fundamental del debido proceso?', 'SINGLE_CHOICE', 20, 1),
(UUID_TO_BIN('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'), @examen1_id, 'Seleccione las garantías constitucionales aplicables al proceso penal', 'MULTIPLE_CHOICE', 30, 2),
(UUID_TO_BIN('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'), @examen1_id, 'La prisión preventiva es una medida cautelar', 'TRUE_FALSE', 10, 3),
(UUID_TO_BIN('cccccccc-cccc-cccc-cccc-cccccccccccc'), @examen1_id, 'Desarrolle los fundamentos de la teoría del delito', 'TEXT', 15, 4);

-- Insertar opciones para las preguntas
SET @pregunta1_id = UUID_TO_BIN('99999999-9999-9999-9999-999999999999');
SET @pregunta2_id = UUID_TO_BIN('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

-- Opciones para pregunta 1 (SINGLE_CHOICE)
INSERT INTO question_options (id, question_id, text, is_correct)
VALUES
(UUID_TO_BIN('dddddddd-dddd-dddd-dddd-dddddddddddd'), @pregunta1_id, 'Derecho a ser oído', true),
(UUID_TO_BIN('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'), @pregunta1_id, 'Derecho a la propiedad', false),
(UUID_TO_BIN('ffffffff-ffff-ffff-ffff-ffffffffffff'), @pregunta1_id, 'Derecho a la salud', false),
(UUID_TO_BIN('11111111-1111-1111-1111-111111111112'), @pregunta1_id, 'Derecho al trabajo', false);

-- Opciones para pregunta 2 (MULTIPLE_CHOICE)
INSERT INTO question_options (id, question_id, text, is_correct)
VALUES
(UUID_TO_BIN('22222222-2222-2222-2222-222222222223'), @pregunta2_id, 'Presunción de inocencia', true),
(UUID_TO_BIN('33333333-3333-3333-3333-333333333334'), @pregunta2_id, 'Defensa en juicio', true),
(UUID_TO_BIN('44444444-4444-4444-4444-444444444445'), @pregunta2_id, 'Juez natural', true),
(UUID_TO_BIN('55555555-5555-5555-5555-555555555556'), @pregunta2_id, 'Derecho a la vivienda', false);

-- Crear una sesión de examen para el usuario1
SET @user1_id = UUID_TO_BIN('44444444-4444-4444-4444-444444444444');

INSERT INTO examination_sessions (id, examination_id, user_id, start_time, deadline, status, current_question_index)
VALUES (UUID_TO_BIN('66666666-6666-6666-6666-666666666667'), @examen1_id, @user1_id, CURRENT_TIMESTAMP, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 2 HOUR), 'IN_PROGRESS', 0);

-- Insertar algunas respuestas para el usuario1
SET @session_id = UUID_TO_BIN('66666666-6666-6666-6666-666666666667');
SET @question1_id = @pregunta1_id;

INSERT INTO answers (id, question_id, response, response_time_ms, status, timestamp, session_id)
VALUES
(UUID_TO_BIN('77777777-7777-7777-7777-777777777778'), @question1_id, 'Derecho a ser oído', 30000, 'SUBMITTED', CURRENT_TIMESTAMP, @session_id);

-- Asignar roles a usuarios
INSERT INTO user_roles (user_id, role_id) VALUES
(UUID_TO_BIN('33333333-3333-3333-3333-333333333333'), UUID_TO_BIN('11111111-1111-1111-1111-111111111111')), -- admin ROLE_USER
(UUID_TO_BIN('33333333-3333-3333-3333-333333333333'), UUID_TO_BIN('22222222-2222-2222-2222-222222222222')), -- admin ROLE_ADMIN
(UUID_TO_BIN('44444444-4444-4444-4444-444444444444'), UUID_TO_BIN('11111111-1111-1111-1111-111111111111')), -- usuario1 ROLE_USER
(UUID_TO_BIN('55555555-5555-5555-5555-555555555555'), UUID_TO_BIN('11111111-1111-1111-1111-111111111111')), -- usuario2 ROLE_USER
(UUID_TO_BIN('66666666-6666-6666-6666-666666666666'), UUID_TO_BIN('11111111-1111-1111-1111-111111111111')), -- semper ROLE_USER
(UUID_TO_BIN('66666666-6666-6666-6666-666666666666'), UUID_TO_BIN('22222222-2222-2222-2222-222222222222')); -- semper ROLE_ADMIN

-- Insertar requisitos para el examen psicológico
INSERT INTO examination_requirements (examination_id, requirement) VALUES
(UUID_TO_BIN('99999999-9999-9999-9999-999999999999'), 'Título de Psicólogo/a'),
(UUID_TO_BIN('99999999-9999-9999-9999-999999999999'), 'Matrícula profesional vigente'),
(UUID_TO_BIN('99999999-9999-9999-9999-999999999999'), 'No tener antecedentes disciplinarios');

-- Insertar reglas para el examen psicológico
INSERT INTO examination_rules (examination_id, rule) VALUES
(UUID_TO_BIN('99999999-9999-9999-9999-999999999999'), 'Mantener la confidencialidad del proceso'),
(UUID_TO_BIN('99999999-9999-9999-9999-999999999999'), 'Seguir los protocolos de evaluación establecidos'),
(UUID_TO_BIN('99999999-9999-9999-9999-999999999999'), 'Documentar todas las observaciones');

-- Insertar materiales permitidos para el examen psicológico
INSERT INTO examination_allowed_materials (examination_id, material) VALUES
(UUID_TO_BIN('99999999-9999-9999-9999-999999999999'), 'Manuales de evaluación psicológica'),
(UUID_TO_BIN('99999999-9999-9999-9999-999999999999'), 'Protocolos de pruebas estandarizadas'),
(UUID_TO_BIN('99999999-9999-9999-9999-999999999999'), 'Formularios de registro');

-- Insertar requisitos para el examen técnico-jurídico finalizado
INSERT INTO examination_requirements (examination_id, requirement) VALUES
(UUID_TO_BIN('11111111-2222-3333-4444-555555555555'), 'Título de Abogado/a con especialización en derecho penal'),
(UUID_TO_BIN('11111111-2222-3333-4444-555555555555'), 'Experiencia mínima de 5 años en litigación penal'),
(UUID_TO_BIN('11111111-2222-3333-4444-555555555555'), 'Conocimientos en derecho procesal penal');

-- Insertar reglas para el examen técnico-jurídico finalizado
INSERT INTO examination_rules (examination_id, rule) VALUES
(UUID_TO_BIN('11111111-2222-3333-4444-555555555555'), 'Responder todas las preguntas'),
(UUID_TO_BIN('11111111-2222-3333-4444-555555555555'), 'Citar normativa aplicable'),
(UUID_TO_BIN('11111111-2222-3333-4444-555555555555'), 'Fundamentar cada respuesta');

-- Insertar materiales permitidos para el examen técnico-jurídico finalizado
INSERT INTO examination_allowed_materials (examination_id, material) VALUES
(UUID_TO_BIN('11111111-2222-3333-4444-555555555555'), 'Códigos actualizados'),
(UUID_TO_BIN('11111111-2222-3333-4444-555555555555'), 'Jurisprudencia relevante'),
(UUID_TO_BIN('11111111-2222-3333-4444-555555555555'), 'Doctrina seleccionada');

-- Insertar requisitos para el examen técnico-administrativo anulado
INSERT INTO examination_requirements (examination_id, requirement) VALUES
(UUID_TO_BIN('22222222-3333-4444-5555-666666666666'), 'Título en Administración o afines'),
(UUID_TO_BIN('22222222-3333-4444-5555-666666666666'), 'Experiencia en gestión pública'),
(UUID_TO_BIN('22222222-3333-4444-5555-666666666666'), 'Conocimientos en procedimientos administrativos');

-- Insertar reglas para el examen técnico-administrativo anulado
INSERT INTO examination_rules (examination_id, rule) VALUES
(UUID_TO_BIN('22222222-3333-4444-5555-666666666666'), 'Seguir el formato establecido'),
(UUID_TO_BIN('22222222-3333-4444-5555-666666666666'), 'Respetar los tiempos asignados'),
(UUID_TO_BIN('22222222-3333-4444-5555-666666666666'), 'Mantener el orden en las respuestas');

-- Insertar materiales permitidos para el examen técnico-administrativo anulado
INSERT INTO examination_allowed_materials (examination_id, material) VALUES
(UUID_TO_BIN('22222222-3333-4444-5555-666666666666'), 'Manual de procedimientos'),
(UUID_TO_BIN('22222222-3333-4444-5555-666666666666'), 'Normativa administrativa'),
(UUID_TO_BIN('22222222-3333-4444-5555-666666666666'), 'Calculadora básica');

-- Insertar requisitos para el examen técnico-jurídico en curso
INSERT INTO examination_requirements (examination_id, requirement) VALUES
(UUID_TO_BIN('dddddddd-dddd-dddd-dddd-dddddddddddd'), 'Título de Abogado/a con orientación en derecho civil'),
(UUID_TO_BIN('dddddddd-dddd-dddd-dddd-dddddddddddd'), 'Experiencia en litigación civil'),
(UUID_TO_BIN('dddddddd-dddd-dddd-dddd-dddddddddddd'), 'Conocimientos en derecho procesal civil');

-- Insertar reglas para el examen técnico-jurídico en curso
INSERT INTO examination_rules (examination_id, rule) VALUES
(UUID_TO_BIN('dddddddd-dddd-dddd-dddd-dddddddddddd'), 'Mantener la cámara encendida'),
(UUID_TO_BIN('dddddddd-dddd-dddd-dddd-dddddddddddd'), 'No consultar material no autorizado'),
(UUID_TO_BIN('dddddddd-dddd-dddd-dddd-dddddddddddd'), 'Fundamentar respuestas con doctrina y jurisprudencia');

-- Insertar materiales permitidos para el examen técnico-jurídico en curso
INSERT INTO examination_allowed_materials (examination_id, material) VALUES
(UUID_TO_BIN('dddddddd-dddd-dddd-dddd-dddddddddddd'), 'Código Civil y Comercial'),
(UUID_TO_BIN('dddddddd-dddd-dddd-dddd-dddddddddddd'), 'Código Procesal Civil'),
(UUID_TO_BIN('dddddddd-dddd-dddd-dddd-dddddddddddd'), 'Constitución Nacional');

-- Insertar requisitos para el examen técnico-administrativo disponible
INSERT INTO examination_requirements (examination_id, requirement) VALUES
(UUID_TO_BIN('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'), 'Título universitario en áreas administrativas'),
(UUID_TO_BIN('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'), 'Experiencia en gestión documental'),
(UUID_TO_BIN('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'), 'Manejo de sistemas informáticos');

-- Insertar reglas para el examen técnico-administrativo disponible
INSERT INTO examination_rules (examination_id, rule) VALUES
(UUID_TO_BIN('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'), 'Completar todas las secciones'),
(UUID_TO_BIN('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'), 'Seguir el orden establecido'),
(UUID_TO_BIN('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'), 'Respetar los tiempos máximos');

-- Insertar materiales permitidos para el examen técnico-administrativo disponible
INSERT INTO examination_allowed_materials (examination_id, material) VALUES
(UUID_TO_BIN('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'), 'Manual de procedimientos administrativos'),
(UUID_TO_BIN('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'), 'Guías de gestión documental'),
(UUID_TO_BIN('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'), 'Normativa interna');

-- Insertar preguntas de ejemplo para el examen de prueba
-- ID del examen: 88888888-8888-8888-8888-888888888888

-- Pregunta 1: Opción múltiple
INSERT INTO questions (id, examination_id, text, type, score, order_number)
VALUES (
    UUID_TO_BIN('11111111-1111-1111-1111-111111111111'), 
    UUID_TO_BIN('88888888-8888-8888-8888-888888888888'), 
    '¿Cuál es el plazo para presentar un recurso de apelación en un proceso civil?', 
    'MULTIPLE_CHOICE', 
    10, 
    1
);

-- Opciones para la pregunta 1
INSERT INTO question_options (id, question_id, text, is_correct)
VALUES (
    UUID_TO_BIN('11111111-aaaa-1111-1111-111111111111'), 
    UUID_TO_BIN('11111111-1111-1111-1111-111111111111'), 
    '5 días hábiles', 
    0
);

INSERT INTO question_options (id, question_id, text, is_correct)
VALUES (
    UUID_TO_BIN('11111111-bbbb-1111-1111-111111111111'), 
    UUID_TO_BIN('11111111-1111-1111-1111-111111111111'), 
    '10 días hábiles', 
    1
);

INSERT INTO question_options (id, question_id, text, is_correct)
VALUES (
    UUID_TO_BIN('11111111-cccc-1111-1111-111111111111'), 
    UUID_TO_BIN('11111111-1111-1111-1111-111111111111'), 
    '15 días hábiles', 
    0
);

INSERT INTO question_options (id, question_id, text, is_correct)
VALUES (
    UUID_TO_BIN('11111111-dddd-1111-1111-111111111111'), 
    UUID_TO_BIN('11111111-1111-1111-1111-111111111111'), 
    '30 días hábiles', 
    0
);

-- Pregunta 2: Desarrollo (texto libre)
INSERT INTO questions (id, examination_id, text, type, score, order_number)
VALUES (
    UUID_TO_BIN('22222222-2222-2222-2222-222222222222'), 
    UUID_TO_BIN('88888888-8888-8888-8888-888888888888'), 
    'Explique brevemente el principio de legalidad en el derecho penal', 
    'TEXT', 
    15, 
    2
);

-- Pregunta 3: Verdadero/Falso
INSERT INTO questions (id, examination_id, text, type, score, order_number)
VALUES (
    UUID_TO_BIN('33333333-3333-3333-3333-333333333333'), 
    UUID_TO_BIN('88888888-8888-8888-8888-888888888888'), 
    '¿Es correcto afirmar que la prisión preventiva es una medida cautelar excepcional?', 
    'TRUE_FALSE', 
    5, 
    3
);

-- Opciones para la pregunta 3
INSERT INTO question_options (id, question_id, text, is_correct)
VALUES (
    UUID_TO_BIN('33333333-aaaa-3333-3333-333333333333'), 
    UUID_TO_BIN('33333333-3333-3333-3333-333333333333'), 
    'Verdadero', 
    1
);

INSERT INTO question_options (id, question_id, text, is_correct)
VALUES (
    UUID_TO_BIN('33333333-bbbb-3333-3333-333333333333'), 
    UUID_TO_BIN('33333333-3333-3333-3333-333333333333'), 
    'Falso', 
    0
);

-- Pregunta 4: Opción múltiple
INSERT INTO questions (id, examination_id, text, type, score, order_number)
VALUES (
    UUID_TO_BIN('44444444-4444-4444-4444-444444444444'), 
    UUID_TO_BIN('88888888-8888-8888-8888-888888888888'), 
    'Según el Código Procesal Penal, ¿cuál es el plazo máximo de la prisión preventiva?', 
    'MULTIPLE_CHOICE', 
    10, 
    4
);

-- Opciones para la pregunta 4
INSERT INTO question_options (id, question_id, text, is_correct)
VALUES (
    UUID_TO_BIN('44444444-aaaa-4444-4444-444444444444'), 
    UUID_TO_BIN('44444444-4444-4444-4444-444444444444'), 
    '6 meses', 
    0
);

INSERT INTO question_options (id, question_id, text, is_correct)
VALUES (
    UUID_TO_BIN('44444444-bbbb-4444-4444-444444444444'), 
    UUID_TO_BIN('44444444-4444-4444-4444-444444444444'), 
    '1 año', 
    0
);

INSERT INTO question_options (id, question_id, text, is_correct)
VALUES (
    UUID_TO_BIN('44444444-cccc-4444-4444-444444444444'), 
    UUID_TO_BIN('44444444-4444-4444-4444-444444444444'), 
    '2 años', 
    1
);

INSERT INTO question_options (id, question_id, text, is_correct)
VALUES (
    UUID_TO_BIN('44444444-dddd-4444-4444-444444444444'), 
    UUID_TO_BIN('44444444-4444-4444-4444-444444444444'), 
    '3 años', 
    0
);

-- Pregunta 5: Opción única
INSERT INTO questions (id, examination_id, text, type, score, order_number)
VALUES (
    UUID_TO_BIN('55555555-5555-5555-5555-555555555555'), 
    UUID_TO_BIN('88888888-8888-8888-8888-888888888888'), 
    '¿Quién es el titular de la acción penal pública?', 
    'SINGLE_CHOICE', 
    10, 
    5
);

-- Opciones para la pregunta 5
INSERT INTO question_options (id, question_id, text, is_correct)
VALUES (
    UUID_TO_BIN('55555555-aaaa-5555-5555-555555555555'), 
    UUID_TO_BIN('55555555-5555-5555-5555-555555555555'), 
    'El juez', 
    0
);

INSERT INTO question_options (id, question_id, text, is_correct)
VALUES (
    UUID_TO_BIN('55555555-bbbb-5555-5555-555555555555'), 
    UUID_TO_BIN('55555555-5555-5555-5555-555555555555'), 
    'El fiscal', 
    1
);

INSERT INTO question_options (id, question_id, text, is_correct)
VALUES (
    UUID_TO_BIN('55555555-cccc-5555-5555-555555555555'), 
    UUID_TO_BIN('55555555-5555-5555-5555-555555555555'), 
    'El defensor', 
    0
);

INSERT INTO question_options (id, question_id, text, is_correct)
VALUES (
    UUID_TO_BIN('55555555-dddd-5555-5555-555555555555'), 
    UUID_TO_BIN('55555555-5555-5555-5555-555555555555'), 
    'La víctima', 
    0
);

-- Insertar preguntas para el examen rápido (aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa)
INSERT INTO questions (id, examination_id, text, type, score, order_number)
VALUES
(UUID_TO_BIN('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1'), 
 UUID_TO_BIN('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'), 
 '¿Cuál es el plazo para interponer un recurso de apelación en el proceso civil?', 
 'MULTIPLE_CHOICE', 
 5, 
 1),
(UUID_TO_BIN('a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2'), 
 UUID_TO_BIN('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'), 
 '¿Es correcto afirmar que la prisión preventiva es una pena?', 
 'TRUE_FALSE', 
 5, 
 2),
(UUID_TO_BIN('a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a3a3'), 
 UUID_TO_BIN('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'), 
 'Explique brevemente el principio de legalidad en el derecho penal', 
 'TEXT', 
 5, 
 3);

-- Opciones para la pregunta 1 del examen rápido
INSERT INTO question_options (id, question_id, text, is_correct)
VALUES
(UUID_TO_BIN('a1a1a101-a1a1-a1a1-a1a1-a1a1a1a1a101'), 
 UUID_TO_BIN('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1'), 
 '5 días', 
 0),
(UUID_TO_BIN('a1a1a102-a1a1-a1a1-a1a1-a1a1a1a1a102'), 
 UUID_TO_BIN('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1'), 
 '10 días', 
 1),
(UUID_TO_BIN('a1a1a103-a1a1-a1a1-a1a1-a1a1a1a1a103'), 
 UUID_TO_BIN('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1'), 
 '15 días', 
 0),
(UUID_TO_BIN('a1a1a104-a1a1-a1a1-a1a1-a1a1a1a1a104'), 
 UUID_TO_BIN('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1'), 
 '30 días', 
 0);

-- Opciones para la pregunta 2 del examen rápido
INSERT INTO question_options (id, question_id, text, is_correct)
VALUES
(UUID_TO_BIN('a2a2a201-a2a2-a2a2-a2a2-a2a2a2a2a201'), 
 UUID_TO_BIN('a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2'), 
 'Verdadero', 
 0),
(UUID_TO_BIN('a2a2a202-a2a2-a2a2-a2a2-a2a2a2a2a202'), 
 UUID_TO_BIN('a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2'), 
 'Falso', 
 1);

-- Insertar preguntas para el examen de duración media (bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb)
INSERT INTO questions (id, examination_id, text, type, score, order_number)
VALUES
(UUID_TO_BIN('b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1'), 
 UUID_TO_BIN('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'), 
 '¿Cuál es la edad mínima de imputabilidad en el régimen penal juvenil?', 
 'MULTIPLE_CHOICE', 
 10, 
 1),
(UUID_TO_BIN('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2'), 
 UUID_TO_BIN('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'), 
 'Enumere los principios rectores del proceso penal juvenil', 
 'TEXT', 
 15, 
 2),
(UUID_TO_BIN('b3b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b3b3'), 
 UUID_TO_BIN('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'), 
 '¿Es correcto afirmar que las medidas socioeducativas tienen carácter punitivo?', 
 'TRUE_FALSE', 
 10, 
 3),
(UUID_TO_BIN('b4b4b4b4-b4b4-b4b4-b4b4-b4b4b4b4b4b4'), 
 UUID_TO_BIN('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'), 
 'Explique la diferencia entre medidas de protección y medidas socioeducativas', 
 'TEXT', 
 10, 
 4);

-- Opciones para la pregunta 1 del examen de duración media
INSERT INTO question_options (id, question_id, text, is_correct)
VALUES
(UUID_TO_BIN('b1b1b101-b1b1-b1b1-b1b1-b1b1b1b1b101'), 
 UUID_TO_BIN('b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1'), 
 '14 años', 
 0),
(UUID_TO_BIN('b1b1b102-b1b1-b1b1-b1b1-b1b1b1b1b102'), 
 UUID_TO_BIN('b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1'), 
 '16 años', 
 1),
(UUID_TO_BIN('b1b1b103-b1b1-b1b1-b1b1-b1b1b1b1b103'), 
 UUID_TO_BIN('b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1'), 
 '18 años', 
 0),
(UUID_TO_BIN('b1b1b104-b1b1-b1b1-b1b1-b1b1b1b1b104'), 
 UUID_TO_BIN('b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1'), 
 '12 años', 
 0);

-- Opciones para la pregunta 3 del examen de duración media
INSERT INTO question_options (id, question_id, text, is_correct)
VALUES
(UUID_TO_BIN('b3b3b301-b3b3-b3b3-b3b3-b3b3b3b3b301'), 
 UUID_TO_BIN('b3b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b3b3'), 
 'Verdadero', 
 0),
(UUID_TO_BIN('b3b3b302-b3b3-b3b3-b3b3-b3b3b3b3b302'), 
 UUID_TO_BIN('b3b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b3b3'), 
 'Falso', 
 1);

-- Insertar preguntas para el examen completo (cccccccc-cccc-cccc-cccc-cccccccccccc)
INSERT INTO questions (id, examination_id, text, type, score, order_number)
VALUES
(UUID_TO_BIN('c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1'), 
 UUID_TO_BIN('cccccccc-cccc-cccc-cccc-cccccccccccc'), 
 '¿Cuál es el plazo de prescripción para una acción de daños y perjuicios?', 
 'MULTIPLE_CHOICE', 
 20, 
 1),
(UUID_TO_BIN('c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2'), 
 UUID_TO_BIN('cccccccc-cccc-cccc-cccc-cccccccccccc'), 
 'Desarrolle los elementos esenciales del contrato de compraventa', 
 'TEXT', 
 25, 
 2),
(UUID_TO_BIN('c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3'), 
 UUID_TO_BIN('cccccccc-cccc-cccc-cccc-cccccccccccc'), 
 '¿Es correcto afirmar que la hipoteca es un derecho real de garantía?', 
 'TRUE_FALSE', 
 15, 
 3),
(UUID_TO_BIN('c4c4c4c4-c4c4-c4c4-c4c4-c4c4c4c4c4c4'), 
 UUID_TO_BIN('cccccccc-cccc-cccc-cccc-cccccccccccc'), 
 'Explique los efectos de la declaración de nulidad de un acto jurídico', 
 'TEXT', 
 20, 
 4),
(UUID_TO_BIN('c5c5c5c5-c5c5-c5c5-c5c5-c5c5c5c5c5c5'), 
 UUID_TO_BIN('cccccccc-cccc-cccc-cccc-cccccccccccc'), 
 'Seleccione los derechos reales reconocidos en el Código Civil y Comercial', 
 'MULTIPLE_CHOICE', 
 20, 
 5),
(UUID_TO_BIN('c6c6c6c6-c6c6-c6c6-c6c6-c6c6c6c6c6c6'), 
 UUID_TO_BIN('cccccccc-cccc-cccc-cccc-cccccccccccc'), 
 'Desarrolle los principios del proceso civil', 
 'TEXT', 
 20, 
 6);

-- Opciones para la pregunta 1 del examen completo
INSERT INTO question_options (id, question_id, text, is_correct)
VALUES
(UUID_TO_BIN('c1c1c101-c1c1-c1c1-c1c1-c1c1c1c1c101'), 
 UUID_TO_BIN('c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1'), 
 '1 año', 
 0),
(UUID_TO_BIN('c1c1c102-c1c1-c1c1-c1c1-c1c1c1c1c102'), 
 UUID_TO_BIN('c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1'), 
 '2 años', 
 0),
(UUID_TO_BIN('c1c1c103-c1c1-c1c1-c1c1-c1c1c1c1c103'), 
 UUID_TO_BIN('c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1'), 
 '3 años', 
 1),
(UUID_TO_BIN('c1c1c104-c1c1-c1c1-c1c1-c1c1c1c1c104'), 
 UUID_TO_BIN('c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1'), 
 '5 años', 
 0);

-- Opciones para la pregunta 3 del examen completo
INSERT INTO question_options (id, question_id, text, is_correct)
VALUES
(UUID_TO_BIN('c3c3c301-c3c3-c3c3-c3c3-c3c3c3c3c301'), 
 UUID_TO_BIN('c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3'), 
 'Verdadero', 
 1),
(UUID_TO_BIN('c3c3c302-c3c3-c3c3-c3c3-c3c3c3c3c302'), 
 UUID_TO_BIN('c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3'), 
 'Falso', 
 0);

-- Opciones para la pregunta 5 del examen completo
INSERT INTO question_options (id, question_id, text, is_correct)
VALUES
(UUID_TO_BIN('c5c5c501-c5c5-c5c5-c5c5-c5c5c5c5c501'), 
 UUID_TO_BIN('c5c5c5c5-c5c5-c5c5-c5c5-c5c5c5c5c5c5'), 
 'Dominio', 
 1),
(UUID_TO_BIN('c5c5c502-c5c5-c5c5-c5c5-c5c5c5c5c502'), 
 UUID_TO_BIN('c5c5c5c5-c5c5-c5c5-c5c5-c5c5c5c5c5c5'), 
 'Condominio', 
 1),
(UUID_TO_BIN('c5c5c503-c5c5-c5c5-c5c5-c5c5c5c5c503'), 
 UUID_TO_BIN('c5c5c5c5-c5c5-c5c5-c5c5-c5c5c5c5c5c5'), 
 'Usufructo', 
 1),
(UUID_TO_BIN('c5c5c504-c5c5-c5c5-c5c5-c5c5c5c5c504'), 
 UUID_TO_BIN('c5c5c5c5-c5c5-c5c5-c5c5-c5c5c5c5c5c5'), 
 'Contrato', 
 0),
(UUID_TO_BIN('c5c5c505-c5c5-c5c5-c5c5-c5c5c5c5c505'), 
 UUID_TO_BIN('c5c5c5c5-c5c5-c5c5-c5c5-c5c5c5c5c5c5'), 
 'Servidumbre', 
 1);

-- Asegurarse de que el examen tenga una fecha de inicio válida (pasada)
UPDATE examinations 
SET start_time = DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 DAY),
    end_time = DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 7 DAY)
WHERE id = UUID_TO_BIN('88888888-8888-8888-8888-888888888888');

-- Insertar requisitos, reglas y materiales para los nuevos exámenes
-- Examen rápido
INSERT INTO examination_requirements (examination_id, requirement) VALUES
(UUID_TO_BIN('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'), 'Conocimientos básicos de derecho'),
(UUID_TO_BIN('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'), 'Manejo de conceptos jurídicos fundamentales');

INSERT INTO examination_rules (examination_id, rule) VALUES
(UUID_TO_BIN('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'), 'No se permite consultar material durante el examen'),
(UUID_TO_BIN('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'), 'Responder todas las preguntas');

-- Examen de duración media
INSERT INTO examination_requirements (examination_id, requirement) VALUES
(UUID_TO_BIN('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'), 'Título de abogado'),
(UUID_TO_BIN('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'), 'Conocimientos en derecho penal juvenil'),
(UUID_TO_BIN('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'), 'Experiencia en casos con menores');

INSERT INTO examination_rules (examination_id, rule) VALUES
(UUID_TO_BIN('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'), 'Se debe mantener la cámara encendida'),
(UUID_TO_BIN('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'), 'No se permiten interrupciones');

INSERT INTO examination_allowed_materials (examination_id, material) VALUES
(UUID_TO_BIN('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'), 'Código Penal Juvenil'),
(UUID_TO_BIN('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'), 'Ley de Protección Integral de Niños, Niñas y Adolescentes');

-- Examen completo
INSERT INTO examination_requirements (examination_id, requirement) VALUES
(UUID_TO_BIN('cccccccc-cccc-cccc-cccc-cccccccccccc'), 'Título de abogado con especialización en derecho civil'),
(UUID_TO_BIN('cccccccc-cccc-cccc-cccc-cccccccccccc'), 'Experiencia mínima de 3 años en litigios civiles'),
(UUID_TO_BIN('cccccccc-cccc-cccc-cccc-cccccccccccc'), 'Conocimientos de derecho comercial');

INSERT INTO examination_rules (examination_id, rule) VALUES
(UUID_TO_BIN('cccccccc-cccc-cccc-cccc-cccccccccccc'), 'Se debe mantener la cámara encendida'),
(UUID_TO_BIN('cccccccc-cccc-cccc-cccc-cccccccccccc'), 'No se permite el uso de dispositivos electrónicos adicionales'),
(UUID_TO_BIN('cccccccc-cccc-cccc-cccc-cccccccccccc'), 'Se permite un descanso de 10 minutos a la mitad del examen');

INSERT INTO examination_allowed_materials (examination_id, material) VALUES
(UUID_TO_BIN('cccccccc-cccc-cccc-cccc-cccccccccccc'), 'Código Civil y Comercial'),
(UUID_TO_BIN('cccccccc-cccc-cccc-cccc-cccccccccccc'), 'Leyes complementarias de derecho civil'),
(UUID_TO_BIN('cccccccc-cccc-cccc-cccc-cccccccccccc'), 'Jurisprudencia relevante (sin anotaciones)');

-- Datos iniciales para tipos de documento
INSERT INTO document_types (id, name, description, required, `order`) VALUES
(UUID_TO_BIN(UUID()), 'Documento Nacional de Identidad', 'DNI del postulante', TRUE, 1),
(UUID_TO_BIN(UUID()), 'Título Universitario', 'Título de grado universitario', TRUE, 2),
(UUID_TO_BIN(UUID()), 'Certificado de Buena Conducta', 'Certificado de antecedentes penales', TRUE, 3),
(UUID_TO_BIN(UUID()), 'Curriculum Vitae', 'CV actualizado', FALSE, 4);