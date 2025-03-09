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
    '$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.0FxO/BTk76klW', -- password: 123456
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
'$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.0FxO/BTk76klW', 
'usuario1@test.com', '20111111', '20201111118', 'Usuario', 'Uno', CURRENT_TIMESTAMP),
(UUID_TO_BIN('55555555-5555-5555-5555-555555555555'), 'usuario2', 
'$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.0FxO/BTk76klW', 
'usuario2@test.com', '20222222', '20202222229', 'Usuario', 'Dos', CURRENT_TIMESTAMP),
(UUID_TO_BIN('66666666-6666-6666-6666-666666666666'), 'semper', 
'$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.0FxO/BTk76klW', 
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
'TECHNICAL_LEGAL');

-- Insertar requisitos para el examen técnico-jurídico
INSERT INTO examination_requirements (examination_id, requirement) VALUES
(UUID_TO_BIN('77777777-7777-7777-7777-777777777777'), 'Título de Abogado/a expedido por universidad nacional o privada oficialmente reconocida'),
(UUID_TO_BIN('77777777-7777-7777-7777-777777777777'), 'Matrícula profesional activa'),
(UUID_TO_BIN('77777777-7777-7777-7777-777777777777'), 'Mínimo 3 años de experiencia en derecho penal'),
(UUID_TO_BIN('77777777-7777-7777-7777-777777777777'), 'No registrar sanciones disciplinarias en los últimos 5 años');

-- Insertar reglas para el examen técnico-jurídico
INSERT INTO examination_rules (examination_id, rule) VALUES
(UUID_TO_BIN('77777777-7777-7777-7777-777777777777'), 'No se permite el uso de dispositivos electrónicos no autorizados'),
(UUID_TO_BIN('77777777-7777-7777-7777-777777777777'), 'El examen debe completarse en una sola sesión sin interrupciones'),
(UUID_TO_BIN('77777777-7777-7777-7777-777777777777'), 'Las respuestas deben ser fundamentadas con referencias a la normativa aplicable'),
(UUID_TO_BIN('77777777-7777-7777-7777-777777777777'), 'No se permite la consulta de material no autorizado durante el examen'),
(UUID_TO_BIN('77777777-7777-7777-7777-777777777777'), 'Cualquier intento de copia o fraude resultará en la anulación del examen');

-- Insertar materiales permitidos para el examen técnico-jurídico
INSERT INTO examination_allowed_materials (examination_id, material) VALUES
(UUID_TO_BIN('77777777-7777-7777-7777-777777777777'), 'Código Penal actualizado sin anotaciones'),
(UUID_TO_BIN('77777777-7777-7777-7777-777777777777'), 'Código Procesal Penal sin anotaciones'),
(UUID_TO_BIN('77777777-7777-7777-7777-777777777777'), 'Constitución Nacional'),
(UUID_TO_BIN('77777777-7777-7777-7777-777777777777'), 'Tratados internacionales de derechos humanos');

-- Examen programado para futuro (PUBLISHED pero fecha futura)
INSERT INTO examinations (id, title, description, duration_minutes, status, start_time, end_time, type)
VALUES
(UUID_TO_BIN('88888888-8888-8888-8888-888888888888'), 
'Examen Técnico-Administrativo - Defensoría Civil', 
'Evaluación de procedimientos administrativos y gestión', 
90, 'PUBLISHED', 
DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 24 HOUR), 
DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 26 HOUR), 
'TECHNICAL_ADMINISTRATIVE');

-- Insertar requisitos para el examen técnico-administrativo
INSERT INTO examination_requirements (examination_id, requirement) VALUES
(UUID_TO_BIN('88888888-8888-8888-8888-888888888888'), 'Título universitario en Administración, Contabilidad o carreras afines'),
(UUID_TO_BIN('88888888-8888-8888-8888-888888888888'), 'Conocimientos en gestión pública'),
(UUID_TO_BIN('88888888-8888-8888-8888-888888888888'), 'Experiencia en manejo de sistemas administrativos');

-- Insertar reglas para el examen técnico-administrativo
INSERT INTO examination_rules (examination_id, rule) VALUES
(UUID_TO_BIN('88888888-8888-8888-8888-888888888888'), 'Se debe mantener la cámara encendida durante todo el examen'),
(UUID_TO_BIN('88888888-8888-8888-8888-888888888888'), 'No se permiten interrupciones durante la prueba'),
(UUID_TO_BIN('88888888-8888-8888-8888-888888888888'), 'Las respuestas deben ser claras y concisas');

-- Insertar materiales permitidos para el examen técnico-administrativo
INSERT INTO examination_allowed_materials (examination_id, material) VALUES
(UUID_TO_BIN('88888888-8888-8888-8888-888888888888'), 'Calculadora básica'),
(UUID_TO_BIN('88888888-8888-8888-8888-888888888888'), 'Normativa administrativa básica'),
(UUID_TO_BIN('88888888-8888-8888-8888-888888888888'), 'Manual de procedimientos administrativos');

-- Insertar exámenes de prueba con diferentes estados y fechas
INSERT INTO examinations (id, title, description, duration_minutes, status, start_time, end_time, type)
VALUES
-- Examen en borrador
(UUID_TO_BIN('99999999-9999-9999-9999-999999999999'), 
'Examen Psicológico - En Preparación', 
'Evaluación psicológica para candidatos', 
60, 'DRAFT', 
DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 48 HOUR), 
DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 49 HOUR), 
'PSYCHOLOGICAL'),

-- Examen finalizado
(UUID_TO_BIN('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'), 
'Examen Técnico-Jurídico - Defensoría Penal 2024', 
'Evaluación finalizada de conocimientos penales', 
120, 'COMPLETED', 
DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 48 HOUR), 
DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 46 HOUR), 
'TECHNICAL_LEGAL'),

-- Examen anulado
(UUID_TO_BIN('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'), 
'Examen Técnico-Administrativo - Anulado', 
'Este examen fue anulado por irregularidades', 
90, 'CANCELLED', 
DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 24 HOUR), 
DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 22 HOUR), 
'TECHNICAL_ADMINISTRATIVE'),

-- Examen en curso (algunos usuarios ya lo están rindiendo)
(UUID_TO_BIN('cccccccc-cccc-cccc-cccc-cccccccccccc'), 
'Examen Técnico-Jurídico - Defensoría Civil Actual', 
'Evaluación de conocimientos en derecho civil y procesal', 
120, 'IN_PROGRESS', 
DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 30 MINUTE), 
DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 90 MINUTE), 
'TECHNICAL_LEGAL'),

-- Otro examen disponible ahora (para tener más opciones)
(UUID_TO_BIN('dddddddd-dddd-dddd-dddd-dddddddddddd'), 
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
(UUID_TO_BIN('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'), 'Título de Abogado/a con especialización en derecho penal'),
(UUID_TO_BIN('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'), 'Experiencia mínima de 5 años en litigación penal'),
(UUID_TO_BIN('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'), 'Conocimientos en derecho procesal penal');

-- Insertar reglas para el examen técnico-jurídico finalizado
INSERT INTO examination_rules (examination_id, rule) VALUES
(UUID_TO_BIN('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'), 'Responder todas las preguntas'),
(UUID_TO_BIN('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'), 'Citar normativa aplicable'),
(UUID_TO_BIN('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'), 'Fundamentar cada respuesta');

-- Insertar materiales permitidos para el examen técnico-jurídico finalizado
INSERT INTO examination_allowed_materials (examination_id, material) VALUES
(UUID_TO_BIN('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'), 'Códigos actualizados'),
(UUID_TO_BIN('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'), 'Jurisprudencia relevante'),
(UUID_TO_BIN('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'), 'Doctrina seleccionada');

-- Insertar requisitos para el examen técnico-administrativo anulado
INSERT INTO examination_requirements (examination_id, requirement) VALUES
(UUID_TO_BIN('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'), 'Título en Administración o afines'),
(UUID_TO_BIN('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'), 'Experiencia en gestión pública'),
(UUID_TO_BIN('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'), 'Conocimientos en procedimientos administrativos');

-- Insertar reglas para el examen técnico-administrativo anulado
INSERT INTO examination_rules (examination_id, rule) VALUES
(UUID_TO_BIN('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'), 'Seguir el formato establecido'),
(UUID_TO_BIN('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'), 'Respetar los tiempos asignados'),
(UUID_TO_BIN('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'), 'Mantener el orden en las respuestas');

-- Insertar materiales permitidos para el examen técnico-administrativo anulado
INSERT INTO examination_allowed_materials (examination_id, material) VALUES
(UUID_TO_BIN('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'), 'Manual de procedimientos'),
(UUID_TO_BIN('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'), 'Normativa administrativa'),
(UUID_TO_BIN('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'), 'Calculadora básica');

-- Insertar requisitos para el examen técnico-jurídico en curso
INSERT INTO examination_requirements (examination_id, requirement) VALUES
(UUID_TO_BIN('cccccccc-cccc-cccc-cccc-cccccccccccc'), 'Título de Abogado/a con orientación en derecho civil'),
(UUID_TO_BIN('cccccccc-cccc-cccc-cccc-cccccccccccc'), 'Experiencia en litigación civil'),
(UUID_TO_BIN('cccccccc-cccc-cccc-cccc-cccccccccccc'), 'Conocimientos en derecho procesal civil');

-- Insertar reglas para el examen técnico-jurídico en curso
INSERT INTO examination_rules (examination_id, rule) VALUES
(UUID_TO_BIN('cccccccc-cccc-cccc-cccc-cccccccccccc'), 'Mantener la cámara encendida'),
(UUID_TO_BIN('cccccccc-cccc-cccc-cccc-cccccccccccc'), 'No consultar material no autorizado'),
(UUID_TO_BIN('cccccccc-cccc-cccc-cccc-cccccccccccc'), 'Fundamentar respuestas con doctrina y jurisprudencia');

-- Insertar materiales permitidos para el examen técnico-jurídico en curso
INSERT INTO examination_allowed_materials (examination_id, material) VALUES
(UUID_TO_BIN('cccccccc-cccc-cccc-cccc-cccccccccccc'), 'Código Civil y Comercial'),
(UUID_TO_BIN('cccccccc-cccc-cccc-cccc-cccccccccccc'), 'Código Procesal Civil'),
(UUID_TO_BIN('cccccccc-cccc-cccc-cccc-cccccccccccc'), 'Constitución Nacional');

-- Insertar requisitos para el examen técnico-administrativo disponible
INSERT INTO examination_requirements (examination_id, requirement) VALUES
(UUID_TO_BIN('dddddddd-dddd-dddd-dddd-dddddddddddd'), 'Título universitario en áreas administrativas'),
(UUID_TO_BIN('dddddddd-dddd-dddd-dddd-dddddddddddd'), 'Experiencia en gestión documental'),
(UUID_TO_BIN('dddddddd-dddd-dddd-dddd-dddddddddddd'), 'Manejo de sistemas informáticos');

-- Insertar reglas para el examen técnico-administrativo disponible
INSERT INTO examination_rules (examination_id, rule) VALUES
(UUID_TO_BIN('dddddddd-dddd-dddd-dddd-dddddddddddd'), 'Completar todas las secciones'),
(UUID_TO_BIN('dddddddd-dddd-dddd-dddd-dddddddddddd'), 'Seguir el orden establecido'),
(UUID_TO_BIN('dddddddd-dddd-dddd-dddd-dddddddddddd'), 'Respetar los tiempos máximos');

-- Insertar materiales permitidos para el examen técnico-administrativo disponible
INSERT INTO examination_allowed_materials (examination_id, material) VALUES
(UUID_TO_BIN('dddddddd-dddd-dddd-dddd-dddddddddddd'), 'Manual de procedimientos administrativos'),
(UUID_TO_BIN('dddddddd-dddd-dddd-dddd-dddddddddddd'), 'Guías de gestión documental'),
(UUID_TO_BIN('dddddddd-dddd-dddd-dddd-dddddddddddd'), 'Normativa interna');