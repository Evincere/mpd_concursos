-- Establece la codificación de caracteres para asegurar la correcta inserción de texto
SET NAMES utf8;
SET CHARACTER SET utf8;

-- Establece la codificación de caracteres para asegurar la correcta inserción de texto
SET NAMES utf8;
SET CHARACTER SET utf8;

SET SQL_SAFE_UPDATES = 0;
-- Deshabilitar verificación de foreign keys temporalmente
SET FOREIGN_KEY_CHECKS = 0;

-- Limpiar datos existentes
DELETE FROM inscription_circunscripciones;
DELETE FROM answers;
DELETE FROM options;
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
'Examen Tecnico-Juridico - Defensor Penal', 
'Evaluacion de conocimientos en derecho penal y procesal penal', 
120, 'PUBLISHED', 
DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 HOUR), 
DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 2 HOUR), 
'TECHNICAL_LEGAL'),

-- Examen programado para futuro (PUBLISHED pero fecha futura)
(UUID_TO_BIN('88888888-8888-8888-8888-888888888888'), 
'Examen Tecnico-Administrativo - Defensoria Civil', 
'Evaluacion de procedimientos administrativos y gestion', 
90, 'PUBLISHED', 
DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 DAY), 
DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 7 DAY), 
'TECHNICAL_ADMINISTRATIVE'),

-- Examen en borrador
(UUID_TO_BIN('99999999-9999-9999-9999-999999999999'), 
'Examen Psicologico - En Preparacion', 
'Evaluacion de aptitudes psicologicas para el cargo', 
60, 'DRAFT', 
DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 10 DAY), 
DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 11 DAY), 
'PSYCHOLOGICAL'),

-- Examen disponible para rendir ahora (corta duración)
(UUID_TO_BIN('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'), 
'Examen Rapido - Conocimientos Generales', 
'Evaluacion rapida de conocimientos generales sobre derecho', 
15, 'PUBLISHED', 
DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 DAY), 
DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 7 DAY), 
'TECHNICAL_LEGAL'),

-- Examen disponible para rendir ahora (duración media)
(UUID_TO_BIN('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'), 
'Examen Tecnico-Juridico - Defensoria Penal Juvenil', 
'Evaluacion de conocimientos en derecho penal juvenil', 
45, 'PUBLISHED', 
DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 2 DAY), 
DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 5 DAY), 
'TECHNICAL_LEGAL'),

-- Examen disponible para rendir ahora (larga duración)
(UUID_TO_BIN('cccccccc-cccc-cccc-cccc-cccccccccccc'), 
'Examen Completo - Defensoria Civil y Comercial', 
'Evaluacion exhaustiva de conocimientos en derecho civil y comercial', 
120, 'PUBLISHED', 
DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 3 DAY), 
DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 3 DAY), 
'TECHNICAL_LEGAL'),

-- Examen finalizado
(UUID_TO_BIN('11111111-2222-3333-4444-555555555555'), 
'Examen Tecnico-Juridico - Defensoria Penal 2024', 
'Evaluacion finalizada de conocimientos penales', 
120, 'COMPLETED', 
DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 48 HOUR), 
DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 46 HOUR), 
'TECHNICAL_LEGAL'),

-- Examen anulado
(UUID_TO_BIN('22222222-3333-4444-5555-666666666666'), 
'Examen Tecnico-Administrativo - Anulado', 
'Este examen fue anulado por irregularidades', 
90, 'CANCELLED', 
DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 24 HOUR), 
DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 22 HOUR), 
'TECHNICAL_ADMINISTRATIVE'),

-- Examen en curso (algunos usuarios ya lo están rindiendo)
(UUID_TO_BIN('dddddddd-dddd-dddd-dddd-dddddddddddd'), 
'Examen Tecnico-Juridico - Defensoria Civil Actual', 
'Evaluacion de conocimientos en derecho civil y procesal', 
120, 'IN_PROGRESS', 
DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 30 MINUTE), 
DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 90 MINUTE), 
'TECHNICAL_LEGAL'),

-- Otro examen disponible ahora (para tener más opciones)
(UUID_TO_BIN('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'), 
'Examen Tecnico-Administrativo - Secretaria', 
'Evaluacion de procedimientos y gestion administrativa', 
60, 'PUBLISHED', 
DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 15 MINUTE), 
DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 45 MINUTE), 
'TECHNICAL_ADMINISTRATIVE');

-- Insertar concursos
INSERT INTO contests (id, title, category, class_, functions, department, position, status, start_date, end_date, bases_url, description_url)
VALUES 
(1, 'Concurso Defensor/a Penal', 'JURIDICO', 'A', 'Asistencia técnica y representación legal en causas penales', 'DEFENSORIAS PENALES', 'Defensor/a Penal - Primera C.J.', 'ACTIVE', DATE(CURRENT_TIMESTAMP), DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 30 DAY), 'https://mpd.gov.ar/bases/defensor-penal.pdf', 'https://mpd.gov.ar/descripcion/defensor-penal.pdf'),
(2, 'Concurso Defensor/a Civil', 'JURIDICO', 'B', 'Asistencia técnica y representación legal en causas civiles', 'DEFENSORIAS CIVILES', 'Defensor/a Civil - Segunda C.J.', 'ACTIVE', DATE(CURRENT_TIMESTAMP), DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 30 DAY), 'https://mpd.gov.ar/bases/defensor-civil.pdf', 'https://mpd.gov.ar/descripcion/defensor-civil.pdf'),
(3, 'Concurso Asesor/a Legal', 'JURIDICO', 'C', 'Asesoramiento legal y técnico en materia administrativa', 'SECRETARIA LEGAL Y TECNICA', 'Asesor/a Legal', 'ACTIVE', DATE(CURRENT_TIMESTAMP), DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 30 DAY), 'https://mpd.gov.ar/bases/asesor-legal.pdf', 'https://mpd.gov.ar/descripcion/asesor-legal.pdf'),
(4, 'Concurso Analista Programador/a', 'TECNICO', 'D', 'Desarrollo y mantenimiento de sistemas informáticos', 'DESARROLLO TECNOLOGICO', 'Analista Programador/a', 'ACTIVE', DATE(CURRENT_TIMESTAMP), DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 30 DAY), 'https://mpd.gov.ar/bases/analista-programador.pdf', 'https://mpd.gov.ar/descripcion/analista-programador.pdf'),
(5, 'Concurso Defensor/a de Familia', 'JURIDICO', 'A', 'Asistencia técnica y representación legal en causas de familia', 'CODEFENSORIAS DE FAMILIA', 'Defensor/a de Familia - Primera C.J.', 'ACTIVE', DATE(CURRENT_TIMESTAMP), DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 30 DAY), 'https://mpd.gov.ar/bases/defensor-familia.pdf', 'https://mpd.gov.ar/descripcion/defensor-familia.pdf');

-- Insertar fechas para los concursos
INSERT INTO contest_dates (contest_id, label, type, start_date, end_date)
VALUES
(1, 'Inscripción', 'REGISTRATION', DATE(CURRENT_TIMESTAMP), DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 15 DAY)),
(1, 'Examen Escrito', 'WRITTEN_EXAM', DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 20 DAY), DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 20 DAY)),
(1, 'Entrevista', 'INTERVIEW', DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 25 DAY), DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 25 DAY)),
(2, 'Inscripción', 'REGISTRATION', DATE(CURRENT_TIMESTAMP), DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 15 DAY)),
(2, 'Examen Escrito', 'WRITTEN_EXAM', DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 20 DAY), DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 20 DAY)),
(2, 'Entrevista', 'INTERVIEW', DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 25 DAY), DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 25 DAY)),
(3, 'Inscripción', 'REGISTRATION', DATE(CURRENT_TIMESTAMP), DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 15 DAY)),
(3, 'Examen Escrito', 'WRITTEN_EXAM', DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 20 DAY), DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 20 DAY)),
(3, 'Entrevista', 'INTERVIEW', DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 25 DAY), DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 25 DAY)),
(4, 'Inscripción', 'REGISTRATION', DATE(CURRENT_TIMESTAMP), DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 15 DAY)),
(4, 'Examen Práctico', 'PRACTICAL_EXAM', DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 20 DAY), DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 20 DAY)),
(4, 'Entrevista Técnica', 'TECHNICAL_INTERVIEW', DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 25 DAY), DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 25 DAY)),
(5, 'Inscripción', 'REGISTRATION', DATE(CURRENT_TIMESTAMP), DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 15 DAY)),
(5, 'Examen Escrito', 'WRITTEN_EXAM', DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 20 DAY), DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 20 DAY)),
(5, 'Entrevista', 'INTERVIEW', DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 25 DAY), DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 25 DAY));

-- Insertar preguntas para el primer examen
SET @examen1_id = UUID_TO_BIN('77777777-7777-7777-7777-777777777777');

INSERT INTO questions (id, examination_id, text, type, score, order_number)
VALUES
(UUID_TO_BIN('99999999-9999-9999-9999-999999999999'), @examen1_id, '¿Cual es el principio fundamental del debido proceso?', 'SINGLE_CHOICE', 20, 1),
(UUID_TO_BIN('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'), @examen1_id, 'Seleccione las garantias constitucionales aplicables al proceso penal', 'MULTIPLE_CHOICE', 30, 2),
(UUID_TO_BIN('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'), @examen1_id, 'La prision preventiva es una medida cautelar', 'TRUE_FALSE', 10, 3),
(UUID_TO_BIN('cccccccc-cccc-cccc-cccc-cccccccccccc'), @examen1_id, 'Desarrolle los fundamentos de la teoria del delito', 'TEXT', 15, 4);

-- Crear una sesion de examen para el usuario1
SET @user1_id = UUID_TO_BIN('44444444-4444-4444-4444-444444444444');

INSERT INTO examination_sessions (id, examination_id, user_id, start_time, deadline, status, current_question_index)
VALUES (UUID_TO_BIN('66666666-6666-6666-6666-666666666667'), @examen1_id, @user1_id, CURRENT_TIMESTAMP, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 2 HOUR), 'IN_PROGRESS', 0);

-- Insertar algunas respuestas para el usuario1
SET @session_id = UUID_TO_BIN('66666666-6666-6666-6666-666666666667');
SET @question1_id = UUID_TO_BIN('99999999-9999-9999-9999-999999999999');

INSERT INTO answers (id, question_id, response, response_time_ms, status, timestamp, session_id)
VALUES
(UUID_TO_BIN('77777777-7777-7777-7777-777777777778'), @question1_id, 'Derecho a ser oido', 30000, 'SUBMITTED', CURRENT_TIMESTAMP, @session_id);

-- Insertar inscripciones de prueba
INSERT INTO inscriptions (
    id, 
    contest_id, 
    user_id, 
    created_at, 
    updated_at,
    inscription_date, 
    status, 
    current_step,
    accepted_terms,
    confirmed_personal_data,
    terms_acceptance_date,
    data_confirmation_date
) VALUES (
    UUID_TO_BIN('77777777-7777-7777-7777-777777777777'),
    1,
    UUID_TO_BIN('44444444-4444-4444-4444-444444444444'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    'ACTIVE',
    'COMPLETED',
    TRUE,
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
), (
    UUID_TO_BIN('88888888-8888-8888-8888-888888888888'),
    2,
    UUID_TO_BIN('44444444-4444-4444-4444-444444444444'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    'PENDING',
    'TERMS_ACCEPTANCE',
    FALSE,
    FALSE,
    NULL,
    NULL
);

-- Insertar circunscripciones seleccionadas para la inscripción completada
INSERT INTO inscription_circunscripciones (inscription_id, circunscripcion) VALUES
(UUID_TO_BIN('77777777-7777-7777-7777-777777777777'), 'Primera Circunscripción Judicial'),
(UUID_TO_BIN('77777777-7777-7777-7777-777777777777'), 'Segunda Circunscripción Judicial');

-- Asignar roles a usuarios
INSERT INTO user_roles (user_id, role_id) VALUES
(UUID_TO_BIN('33333333-3333-3333-3333-333333333333'), UUID_TO_BIN('11111111-1111-1111-1111-111111111111')), -- admin ROLE_USER
(UUID_TO_BIN('33333333-3333-3333-3333-333333333333'), UUID_TO_BIN('22222222-2222-2222-2222-222222222222')), -- admin ROLE_ADMIN
(UUID_TO_BIN('44444444-4444-4444-4444-444444444444'), UUID_TO_BIN('11111111-1111-1111-1111-111111111111')), -- usuario1 ROLE_USER
(UUID_TO_BIN('55555555-5555-5555-5555-555555555555'), UUID_TO_BIN('11111111-1111-1111-1111-111111111111')), -- usuario2 ROLE_USER
(UUID_TO_BIN('66666666-6666-6666-6666-666666666666'), UUID_TO_BIN('11111111-1111-1111-1111-111111111111')), -- semper ROLE_USER
(UUID_TO_BIN('66666666-6666-6666-6666-666666666666'), UUID_TO_BIN('22222222-2222-2222-2222-222222222222')); -- semper ROLE_ADMIN

-- Insertar requisitos para el examen psicologico
INSERT INTO examination_requirements (examination_id, requirement) VALUES
(UUID_TO_BIN('99999999-9999-9999-9999-999999999999'), 'Titulo de Psicologo/a'),
(UUID_TO_BIN('99999999-9999-9999-9999-999999999999'), 'Matricula profesional vigente'),
(UUID_TO_BIN('99999999-9999-9999-9999-999999999999'), 'No tener antecedentes disciplinarios');

-- Insertar reglas para el examen psicologico
INSERT INTO examination_rules (examination_id, rule) VALUES
(UUID_TO_BIN('99999999-9999-9999-9999-999999999999'), 'Mantener la confidencialidad del proceso'),
(UUID_TO_BIN('99999999-9999-9999-9999-999999999999'), 'Seguir los protocolos de evaluacion establecidos'),
(UUID_TO_BIN('99999999-9999-9999-9999-999999999999'), 'Documentar todas las observaciones');

-- Insertar materiales permitidos para el examen psicologico
INSERT INTO examination_allowed_materials (examination_id, material) VALUES
(UUID_TO_BIN('99999999-9999-9999-9999-999999999999'), 'Manuales de evaluacion psicologica'),
(UUID_TO_BIN('99999999-9999-9999-9999-999999999999'), 'Protocolos de pruebas estandarizadas'),
(UUID_TO_BIN('99999999-9999-9999-9999-999999999999'), 'Formularios de registro');

-- Insertar requisitos para el examen tecnico-juridico finalizado
INSERT INTO examination_requirements (examination_id, requirement) VALUES
(UUID_TO_BIN('11111111-2222-3333-4444-555555555555'), 'Titulo de Abogado/a con especializacion en derecho penal'),
(UUID_TO_BIN('11111111-2222-3333-4444-555555555555'), 'Experiencia minima de 5 anos en litigacion penal'),
(UUID_TO_BIN('11111111-2222-3333-4444-555555555555'), 'Conocimientos en derecho procesal penal');

-- Insertar reglas para el examen tecnico-juridico finalizado
INSERT INTO examination_rules (examination_id, rule) VALUES
(UUID_TO_BIN('11111111-2222-3333-4444-555555555555'), 'Responder todas las preguntas'),
(UUID_TO_BIN('11111111-2222-3333-4444-555555555555'), 'Citar normativa aplicable'),
(UUID_TO_BIN('11111111-2222-3333-4444-555555555555'), 'Fundamentar cada respuesta');

-- Insertar materiales permitidos para el examen tecnico-juridico finalizado
INSERT INTO examination_allowed_materials (examination_id, material) VALUES
(UUID_TO_BIN('11111111-2222-3333-4444-555555555555'), 'Codigos actualizados'),
(UUID_TO_BIN('11111111-2222-3333-4444-555555555555'), 'Jurisprudencia relevante'),
(UUID_TO_BIN('11111111-2222-3333-4444-555555555555'), 'Doctrina seleccionada');

-- Insertar requisitos para el examen tecnico-administrativo anulado
INSERT INTO examination_requirements (examination_id, requirement) VALUES
(UUID_TO_BIN('22222222-3333-4444-5555-666666666666'), 'Titulo en Administracion o afines'),
(UUID_TO_BIN('22222222-3333-4444-5555-666666666666'), 'Experiencia en gestion publica'),
(UUID_TO_BIN('22222222-3333-4444-5555-666666666666'), 'Conocimientos en procedimientos administrativos');

-- Insertar reglas para el examen tecnico-administrativo anulado
INSERT INTO examination_rules (examination_id, rule) VALUES
(UUID_TO_BIN('22222222-3333-4444-5555-666666666666'), 'Seguir el formato establecido'),
(UUID_TO_BIN('22222222-3333-4444-5555-666666666666'), 'Respetar los tiempos asignados'),
(UUID_TO_BIN('22222222-3333-4444-5555-666666666666'), 'Mantener el orden en las respuestas');

-- Insertar materiales permitidos para el examen tecnico-administrativo anulado
INSERT INTO examination_allowed_materials (examination_id, material) VALUES
(UUID_TO_BIN('22222222-3333-4444-5555-666666666666'), 'Manual de procedimientos'),
(UUID_TO_BIN('22222222-3333-4444-5555-666666666666'), 'Normativa administrativa'),
(UUID_TO_BIN('22222222-3333-4444-5555-666666666666'), 'Calculadora basica');

-- Insertar requisitos para el examen tecnico-juridico en curso
INSERT INTO examination_requirements (examination_id, requirement) VALUES
(UUID_TO_BIN('dddddddd-dddd-dddd-dddd-dddddddddddd'), 'Titulo de Abogado/a con orientacion en derecho civil'),
(UUID_TO_BIN('dddddddd-dddd-dddd-dddd-dddddddddddd'), 'Experiencia en litigacion civil'),
(UUID_TO_BIN('dddddddd-dddd-dddd-dddd-dddddddddddd'), 'Conocimientos en derecho procesal civil');

-- Insertar reglas para el examen tecnico-juridico en curso
INSERT INTO examination_rules (examination_id, rule) VALUES
(UUID_TO_BIN('dddddddd-dddd-dddd-dddd-dddddddddddd'), 'Mantener la camara encendida'),
(UUID_TO_BIN('dddddddd-dddd-dddd-dddd-dddddddddddd'), 'No consultar material no autorizado'),
(UUID_TO_BIN('dddddddd-dddd-dddd-dddd-dddddddddddd'), 'Fundamentar respuestas con doctrina y jurisprudencia');

-- Insertar materiales permitidos para el examen tecnico-juridico en curso
INSERT INTO examination_allowed_materials (examination_id, material) VALUES
(UUID_TO_BIN('dddddddd-dddd-dddd-dddd-dddddddddddd'), 'Codigo Civil y Comercial'),
(UUID_TO_BIN('dddddddd-dddd-dddd-dddd-dddddddddddd'), 'Codigo Procesal Civil'),
(UUID_TO_BIN('dddddddd-dddd-dddd-dddd-dddddddddddd'), 'Constitucion Nacional');

-- Insertar requisitos para el examen tecnico-administrativo disponible
INSERT INTO examination_requirements (examination_id, requirement) VALUES
(UUID_TO_BIN('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'), 'Titulo universitario en areas administrativas'),
(UUID_TO_BIN('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'), 'Experiencia en gestion documental'),
(UUID_TO_BIN('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'), 'Manejo de sistemas informaticos');

-- Insertar reglas para el examen tecnico-administrativo disponible
INSERT INTO examination_rules (examination_id, rule) VALUES
(UUID_TO_BIN('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'), 'Completar todas las secciones'),
(UUID_TO_BIN('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'), 'Seguir el orden establecido'),
(UUID_TO_BIN('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'), 'Respetar los tiempos maximos');

-- Insertar materiales permitidos para el examen tecnico-administrativo disponible
INSERT INTO examination_allowed_materials (examination_id, material) VALUES
(UUID_TO_BIN('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'), 'Manual de procedimientos administrativos'),
(UUID_TO_BIN('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'), 'Guias de gestion documental'),
(UUID_TO_BIN('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'), 'Normativa interna');

-- Reglas del examen completo
INSERT INTO examination_rules (examination_id, rule) VALUES
(UUID_TO_BIN('cccccccc-cccc-cccc-cccc-cccccccccccc'), 'Se debe mantener la camara encendida');

INSERT INTO examination_rules (examination_id, rule) VALUES
(UUID_TO_BIN('cccccccc-cccc-cccc-cccc-cccccccccccc'), 'No se permite el uso de dispositivos electronicos adicionales');

INSERT INTO examination_rules (examination_id, rule) VALUES
(UUID_TO_BIN('cccccccc-cccc-cccc-cccc-cccccccccccc'), 'Se permite un descanso de 10 minutos a la mitad del examen');

INSERT INTO examination_allowed_materials (examination_id, material) VALUES
(UUID_TO_BIN('cccccccc-cccc-cccc-cccc-cccccccccccc'), 'Codigo Civil y Comercial'),
(UUID_TO_BIN('cccccccc-cccc-cccc-cccc-cccccccccccc'), 'Leyes complementarias de derecho civil'),
(UUID_TO_BIN('cccccccc-cccc-cccc-cccc-cccccccccccc'), 'Jurisprudencia relevante (sin anotaciones)');

-- Datos iniciales para tipos de documento
REPLACE INTO document_types (id, name, description, required, `order`) VALUES
(UUID_TO_BIN('11111111-1111-1111-1111-111111111111'), 'Documento Nacional de Identidad', 'DNI del postulante', TRUE, 1),
(UUID_TO_BIN('22222222-2222-2222-2222-222222222222'), 'Titulo Universitario', 'Titulo de grado universitario', TRUE, 2),
(UUID_TO_BIN('33333333-3333-3333-3333-333333333333'), 'Certificado de Buena Conducta', 'Certificado de antecedentes penales', TRUE, 3),
(UUID_TO_BIN('44444444-4444-4444-4444-444444444444'), 'Curriculum Vitae', 'CV actualizado', FALSE, 4);
