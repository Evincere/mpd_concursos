-- Establece la codificacion de caracteres para asegurar la correcta insercion de texto
SET NAMES utf8;
SET CHARACTER SET utf8;

SET SQL_SAFE_UPDATES = 0;
-- Deshabilitar verificacion de foreign keys temporalmente
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

-- Habilitar verificacion de foreign keys
SET FOREIGN_KEY_CHECKS = 1;

-- Insertar roles de prueba usando UUIDs simples
INSERT INTO roles (id, name) VALUES
(0x11111111111111111111111111111111, 'ROLE_USER'),
(0x22222222222222222222222222222222, 'ROLE_ADMIN');

-- Insertar usuario administrador por defecto
INSERT INTO user_entity (id, username, password, email, dni, cuit, firstName, lastName, createdAt)
VALUES (
    0x33333333333333333333333333333333,
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
INSERT INTO user_entity (id, username, password, email, dni, cuit, firstName, lastName, createdAt)
VALUES
(0x44444444444444444444444444444444, 'usuario1',
'$2a$10$rPiEAgQNIT1TCoKi.XaJCeZv7nE9GM3lmcLtJBXGdnU5vtN0oJzNW',
'usuario1@test.com', '20111111', '20201111118', 'Usuario', 'Uno', CURRENT_TIMESTAMP),
(0x55555555555555555555555555555555, 'usuario2',
'$2a$10$rPiEAgQNIT1TCoKi.XaJCeZv7nE9GM3lmcLtJBXGdnU5vtN0oJzNW',
'usuario2@test.com', '20222222', '20202222229', 'Usuario', 'Dos', CURRENT_TIMESTAMP),
(0x66666666666666666666666666666666, 'semper',
'$2a$10$rPiEAgQNIT1TCoKi.XaJCeZv7nE9GM3lmcLtJBXGdnU5vtN0oJzNW',
'semper@test.com', '26598410', '20265984107', 'Sebastian', 'Pereyra', CURRENT_TIMESTAMP);

-- Insertar concursos con diferentes estados para testing completo
INSERT INTO contests (id, title, category, class_, functions, department, position, status, startDate, endDate, basesUrl, descriptionUrl)
VALUES
-- Concursos activos con inscripciones abiertas
(1, 'Concurso Defensor/a Penal', 'JURIDICO', 'A', 'Asistencia tecnica y representacion legal en causas penales', 'DEFENSORIAS PENALES', 'Defensor/a Penal - Primera C.J.', 'INSCRIPTION_OPEN', DATE(CURRENT_TIMESTAMP), DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 30 DAY), '/api/files/contest-bases/contest_1_bases.pdf', '/api/files/contest-bases/contest_1_description.pdf'),
(2, 'Concurso Defensor/a Civil', 'JURIDICO', 'B', 'Asistencia tecnica y representacion legal en causas civiles', 'DEFENSORIAS CIVILES', 'Defensor/a Civil - Segunda C.J.', 'INSCRIPTION_OPEN', DATE(CURRENT_TIMESTAMP), DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 30 DAY), '/api/files/contest-bases/contest_2_bases.pdf', '/api/files/contest-bases/contest_2_description.pdf'),

-- Concursos en diferentes estados para testing
(3, 'Concurso Asesor/a Legal', 'JURIDICO', 'C', 'Asesoramiento legal y tecnico en materia administrativa', 'SECRETARIA LEGAL Y TECNICA', 'Asesor/a Legal', 'PUBLISHED', DATE(CURRENT_TIMESTAMP), DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 30 DAY), '/api/files/contest-bases/contest_3_bases.pdf', '/api/files/contest-bases/contest_3_description.pdf'),
(4, 'Concurso Analista Programador/a', 'TECNICO', 'D', 'Desarrollo y mantenimiento de sistemas informaticos', 'DESARROLLO TECNOLOGICO', 'Analista Programador/a', 'INSCRIPTION_PENDING', DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 7 DAY), DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 37 DAY), '/api/files/contest-bases/contest_4_bases.pdf', '/api/files/contest-bases/contest_4_description.pdf'),
(5, 'Concurso Defensor/a de Familia', 'JURIDICO', 'A', 'Asistencia tecnica y representacion legal en causas de familia', 'CODEFENSORIAS DE FAMILIA', 'Defensor/a de Familia - Primera C.J.', 'INSCRIPTION_CLOSED', DATE_SUB(DATE(CURRENT_TIMESTAMP), INTERVAL 15 DAY), DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 15 DAY), '/api/files/contest-bases/contest_5_bases.pdf', '/api/files/contest-bases/contest_5_description.pdf'),

-- Concursos adicionales para casos de prueba
(6, 'Concurso Secretario/a Judicial', 'ADMINISTRATIVO', 'B', 'Gestion administrativa y apoyo judicial', 'SECRETARIAS JUDICIALES', 'Secretario/a Judicial', 'IN_EVALUATION', DATE_SUB(DATE(CURRENT_TIMESTAMP), INTERVAL 30 DAY), DATE_SUB(DATE(CURRENT_TIMESTAMP), INTERVAL 5 DAY), '/api/files/contest-bases/contest_6_bases.pdf', '/api/files/contest-bases/contest_6_description.pdf'),
(7, 'Concurso Psicólogo/a Forense', 'TECNICO', 'C', 'Evaluaciones psicologicas en el ambito judicial', 'GABINETE PSICOSOCIAL', 'Psicólogo/a Forense', 'RESULTS_PUBLISHED', DATE_SUB(DATE(CURRENT_TIMESTAMP), INTERVAL 60 DAY), DATE_SUB(DATE(CURRENT_TIMESTAMP), INTERVAL 30 DAY), '/api/files/contest-bases/contest_7_bases.pdf', '/api/files/contest-bases/contest_7_description.pdf'),
(8, 'Concurso Trabajador/a Social', 'TECNICO', 'D', 'Intervencion social en casos judiciales', 'GABINETE PSICOSOCIAL', 'Trabajador/a Social', 'FINISHED', DATE_SUB(DATE(CURRENT_TIMESTAMP), INTERVAL 90 DAY), DATE_SUB(DATE(CURRENT_TIMESTAMP), INTERVAL 60 DAY), '/api/files/contest-bases/contest_8_bases.pdf', '/api/files/contest-bases/contest_8_description.pdf'),
(9, 'Concurso Contador/a Público', 'ADMINISTRATIVO', 'C', 'Gestion contable y financiera', 'ADMINISTRACION', 'Contador/a Público', 'DRAFT', DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 30 DAY), DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 60 DAY), '/api/files/contest-bases/contest_9_bases.pdf', '/api/files/contest-bases/contest_9_description.pdf'),
(10, 'Concurso Informático/a', 'TECNICO', 'D', 'Soporte tecnico y mantenimiento de sistemas', 'INFORMATICA', 'Técnico/a Informático', 'PAUSED', DATE(CURRENT_TIMESTAMP), DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 30 DAY), '/api/files/contest-bases/contest_10_bases.pdf', '/api/files/contest-bases/contest_10_description.pdf');

-- Insertar fechas para los concursos con cronogramas realistas
INSERT INTO contest_dates (contestId, label, type, startDate, endDate)
VALUES
-- Concurso 1: Defensor/a Penal (INSCRIPTION_OPEN)
(1, 'Inscripcion', 'REGISTRATION', DATE(CURRENT_TIMESTAMP), DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 15 DAY)),
(1, 'Examen Escrito', 'WRITTEN_EXAM', DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 20 DAY), DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 20 DAY)),
(1, 'Entrevista', 'INTERVIEW', DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 25 DAY), DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 25 DAY)),

-- Concurso 2: Defensor/a Civil (INSCRIPTION_OPEN)
(2, 'Inscripcion', 'REGISTRATION', DATE(CURRENT_TIMESTAMP), DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 15 DAY)),
(2, 'Examen Escrito', 'WRITTEN_EXAM', DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 20 DAY), DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 20 DAY)),
(2, 'Entrevista', 'INTERVIEW', DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 25 DAY), DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 25 DAY)),

-- Concurso 3: Asesor/a Legal (PUBLISHED)
(3, 'Inscripcion', 'REGISTRATION', DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 5 DAY), DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 20 DAY)),
(3, 'Examen Escrito', 'WRITTEN_EXAM', DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 25 DAY), DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 25 DAY)),
(3, 'Entrevista', 'INTERVIEW', DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 30 DAY), DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 30 DAY)),

-- Concurso 4: Analista Programador/a (INSCRIPTION_PENDING)
(4, 'Inscripcion', 'REGISTRATION', DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 7 DAY), DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 22 DAY)),
(4, 'Examen Practico', 'PRACTICAL_EXAM', DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 27 DAY), DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 27 DAY)),
(4, 'Entrevista Tecnica', 'TECHNICAL_INTERVIEW', DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 32 DAY), DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 32 DAY)),

-- Concurso 5: Defensor/a de Familia (INSCRIPTION_CLOSED)
(5, 'Inscripcion', 'REGISTRATION', DATE_SUB(DATE(CURRENT_TIMESTAMP), INTERVAL 15 DAY), DATE_SUB(DATE(CURRENT_TIMESTAMP), INTERVAL 1 DAY)),
(5, 'Examen Escrito', 'WRITTEN_EXAM', DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 5 DAY), DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 5 DAY)),
(5, 'Entrevista', 'INTERVIEW', DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 10 DAY), DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 10 DAY)),

-- Concursos adicionales (6-10)
(6, 'Inscripcion', 'REGISTRATION', DATE_SUB(DATE(CURRENT_TIMESTAMP), INTERVAL 30 DAY), DATE_SUB(DATE(CURRENT_TIMESTAMP), INTERVAL 15 DAY)),
(6, 'Examen Escrito', 'WRITTEN_EXAM', DATE_SUB(DATE(CURRENT_TIMESTAMP), INTERVAL 10 DAY), DATE_SUB(DATE(CURRENT_TIMESTAMP), INTERVAL 10 DAY)),
(6, 'Entrevista', 'INTERVIEW', DATE_SUB(DATE(CURRENT_TIMESTAMP), INTERVAL 5 DAY), DATE_SUB(DATE(CURRENT_TIMESTAMP), INTERVAL 5 DAY)),

(7, 'Inscripcion', 'REGISTRATION', DATE_SUB(DATE(CURRENT_TIMESTAMP), INTERVAL 60 DAY), DATE_SUB(DATE(CURRENT_TIMESTAMP), INTERVAL 45 DAY)),
(7, 'Examen Escrito', 'WRITTEN_EXAM', DATE_SUB(DATE(CURRENT_TIMESTAMP), INTERVAL 40 DAY), DATE_SUB(DATE(CURRENT_TIMESTAMP), INTERVAL 40 DAY)),
(7, 'Entrevista', 'INTERVIEW', DATE_SUB(DATE(CURRENT_TIMESTAMP), INTERVAL 35 DAY), DATE_SUB(DATE(CURRENT_TIMESTAMP), INTERVAL 35 DAY)),

(8, 'Inscripcion', 'REGISTRATION', DATE_SUB(DATE(CURRENT_TIMESTAMP), INTERVAL 90 DAY), DATE_SUB(DATE(CURRENT_TIMESTAMP), INTERVAL 75 DAY)),
(8, 'Examen Escrito', 'WRITTEN_EXAM', DATE_SUB(DATE(CURRENT_TIMESTAMP), INTERVAL 70 DAY), DATE_SUB(DATE(CURRENT_TIMESTAMP), INTERVAL 70 DAY)),
(8, 'Entrevista', 'INTERVIEW', DATE_SUB(DATE(CURRENT_TIMESTAMP), INTERVAL 65 DAY), DATE_SUB(DATE(CURRENT_TIMESTAMP), INTERVAL 65 DAY)),

(9, 'Inscripcion', 'REGISTRATION', DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 30 DAY), DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 45 DAY)),
(9, 'Examen Escrito', 'WRITTEN_EXAM', DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 50 DAY), DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 50 DAY)),
(9, 'Entrevista', 'INTERVIEW', DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 55 DAY), DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 55 DAY)),

(10, 'Inscripcion', 'REGISTRATION', DATE(CURRENT_TIMESTAMP), DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 15 DAY)),
(10, 'Examen Practico', 'PRACTICAL_EXAM', DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 20 DAY), DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 20 DAY)),
(10, 'Entrevista Tecnica', 'TECHNICAL_INTERVIEW', DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 25 DAY), DATE_ADD(DATE(CURRENT_TIMESTAMP), INTERVAL 25 DAY));

-- Asignar roles a usuarios
INSERT INTO user_roles (userId, roleId) VALUES
(0x33333333333333333333333333333333, 0x11111111111111111111111111111111), -- admin ROLE_USER
(0x33333333333333333333333333333333, 0x22222222222222222222222222222222), -- admin ROLE_ADMIN
(0x44444444444444444444444444444444, 0x11111111111111111111111111111111), -- usuario1 ROLE_USER
(0x55555555555555555555555555555555, 0x11111111111111111111111111111111), -- usuario2 ROLE_USER
(0x66666666666666666666666666666666, 0x11111111111111111111111111111111), -- semper ROLE_USER
(0x66666666666666666666666666666666, 0x22222222222222222222222222222222); -- semper ROLE_ADMIN

-- Datos iniciales para tipos de documento
-- Primero, insertar el documento de identidad como documento padre
INSERT IGNORE INTO document_types (id, code, name, description, required, `order`, isActive) VALUES
(0x11111111111111111111111111111111, 'dni', 'Documento Nacional de Identidad', 'Documento Nacional de Identidad (General)', TRUE, 1, TRUE);

-- Insertar los tipos de documentos para DNI frente y dorso
INSERT IGNORE INTO document_types (id, code, name, description, parentId, required, `order`, isActive) VALUES
(0xAAAAAAAAAAAAAAAAAAAAAAAAAAAA, 'dni-frente', 'DNI (Frente)', 'Documento Nacional de Identidad - Lado frontal', 0x11111111111111111111111111111111, TRUE, 1, TRUE),
(0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB, 'dni-dorso', 'DNI (Dorso)', 'Documento Nacional de Identidad - Lado posterior', 0x11111111111111111111111111111111, TRUE, 2, TRUE);

-- Insertar otros tipos de documentos
INSERT IGNORE INTO document_types (id, code, name, description, required, `order`, isActive) VALUES
(0x22222222222222222222222222222222, 'titulo-universitario', 'Titulo Universitario', 'Titulo de grado universitario', TRUE, 3, TRUE),
(0x33333333333333333333333333333333, 'certificado-buena-conducta', 'Certificado de Buena Conducta', 'Certificado de antecedentes penales', TRUE, 4, TRUE),
(0x44444444444444444444444444444444, 'curriculum-vitae', 'Curriculum Vitae', 'CV actualizado', FALSE, 5, TRUE);

-- Insertar nuevos tipos de documentos requeridos
INSERT IGNORE INTO document_types (id, code, name, description, required, `order`, isActive) VALUES
(0x55555555555555555555555555555555, 'cuil', 'Constancia de CUIL', 'Constancia de CUIL actualizada', TRUE, 6, TRUE),
(0x66666666666666666666666666666666, 'antecedentes-penales', 'Certificado de Antecedentes Penales', 'Certificado de Antecedentes Penales actualizado', TRUE, 7, TRUE),
(0x77777777777777777777777777777777, 'certificado-profesional', 'Certificado de Ejercicio Profesional', 'Certificado de Ejercicio Profesional actualizado', TRUE, 8, TRUE),
(0x88888888888888888888888888888888, 'certificado-sanciones', 'Certificado de Sanciones Disciplinarias', 'Certificado que acredita la ausencia de sanciones disciplinarias', TRUE, 9, TRUE),
(0x99999999999999999999999999999999, 'certificado-ley-micaela', 'Certificado Ley Micaela', 'Certificado de capacitacion en Ley Micaela', FALSE, 10, TRUE);

-- CRITICAL FIX: Insertar tipo de documento genérico para casos de fallback
INSERT IGNORE INTO document_types (id, code, name, description, required, `order`, isActive) VALUES
(0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAA1, 'documento-generico', 'Documento Genérico', 'Tipo de documento genérico para casos no especificados', FALSE, 999, TRUE);
