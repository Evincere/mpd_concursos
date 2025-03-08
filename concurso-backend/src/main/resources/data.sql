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
(UUID_TO_BIN(UUID()), 'ROLE_USER'),
(UUID_TO_BIN(UUID()), 'ROLE_ADMIN');

-- Insertar usuario administrador por defecto
INSERT INTO user_entity (id, username, password, email, dni, cuit, first_name, last_name, created_at) 
VALUES (
    UUID_TO_BIN(UUID()),
    'admin',
    '$2a$10$TpVxkJXgPR9h9z1h8YbPm.vg5eJcKSn7TZIRMJxeGDFxYBrqXV7Uy', -- password: admin
    'admin@mpd.gov.ar',
    '20000000',
    '20123456783',
    'Admin',
    'MPD',
    CURRENT_TIMESTAMP
);

-- Insertar usuarios de prueba
INSERT INTO user_entity (id, username, password, email, dni, cuit, first_name, last_name, created_at)
VALUES
(UUID_TO_BIN(UUID()), 'usuario1', '$2a$10$TpVxkJXgPR9h9z1h8YbPm.vg5eJcKSn7TZIRMJxeGDFxYBrqXV7Uy', 
'usuario1@test.com', '20111111', '20234567894', 'Usuario', 'Uno', CURRENT_TIMESTAMP),
(UUID_TO_BIN(UUID()), 'usuario2', '$2a$10$TpVxkJXgPR9h9z1h8YbPm.vg5eJcKSn7TZIRMJxeGDFxYBrqXV7Uy', 
'usuario2@test.com', '20222222', '20345678905', 'Usuario', 'Dos', CURRENT_TIMESTAMP);

-- Insertar exámenes de prueba
INSERT INTO examinations (id, title, description, duration_minutes, status, start_time, end_time, type)
VALUES
(UUID_TO_BIN(UUID()), 'Examen de Ingreso - Defensor Penal', 'Examen para el cargo de Defensor Penal', 120, 'PUBLISHED', '2025-03-01 09:00:00', '2025-03-01 11:00:00', 'MULTIPLE_CHOICE'),
(UUID_TO_BIN(UUID()), 'Examen de Defensoría Civil', 'Examen para el cargo de Defensoría Civil', 120, 'PUBLISHED', '2025-03-01 09:00:00', '2025-03-01 11:00:00', 'MULTIPLE_CHOICE');

-- Insertar concursos
INSERT INTO contests (id, department, position, status, start_date, end_date)
VALUES 
(1, 'DEFENSORÍAS PENALES', 'Defensor/a Penal - Primera C.J.', 'ACTIVE', '2025-02-01', '2025-04-30'),
(2, 'DEFENSORÍAS CIVILES', 'Defensor/a Civil - Segunda C.J.', 'ACTIVE', '2025-01-15', '2025-03-15'),
(3, 'SECRETARÍA LEGAL Y TÉCNICA', 'Asesor/a Legal', 'ACTIVE', '2025-02-10', '2025-05-10'),
(4, 'DESARROLLO TECNOLÓGICO', 'Analista Programador/a', 'ACTIVE', '2025-02-05', '2025-04-05'),
(5, 'CODEFENSORÍAS DE FAMILIA', 'Defensor/a de Familia - Primera C.J.', 'ACTIVE', '2025-01-20', '2025-03-20');

-- Insertar preguntas para el primer examen
SET @examen1_id = (SELECT id FROM examinations WHERE title = 'Examen de Ingreso - Defensor Penal' LIMIT 1);

INSERT INTO questions (id, examination_id, text, type, score, order_number)
VALUES
(UUID_TO_BIN(UUID()), @examen1_id, '¿Cuál es el principio fundamental del debido proceso?', 'SINGLE_CHOICE', 20, 1),
(UUID_TO_BIN(UUID()), @examen1_id, 'Seleccione las garantías constitucionales aplicables al proceso penal', 'MULTIPLE_CHOICE', 30, 2),
(UUID_TO_BIN(UUID()), @examen1_id, 'La prisión preventiva es una medida cautelar', 'TRUE_FALSE', 10, 3),
(UUID_TO_BIN(UUID()), @examen1_id, 'Desarrolle los fundamentos de la teoría del delito', 'TEXT', 15, 4);

-- Insertar opciones para las preguntas
SET @pregunta1_id = (SELECT id FROM questions WHERE examination_id = @examen1_id AND order_number = 1);
SET @pregunta2_id = (SELECT id FROM questions WHERE examination_id = @examen1_id AND order_number = 2);

-- Opciones para pregunta 1 (SINGLE_CHOICE)
INSERT INTO question_options (id, question_id, text, is_correct)
VALUES
(UUID_TO_BIN(UUID()), @pregunta1_id, 'Derecho a ser oído', true),
(UUID_TO_BIN(UUID()), @pregunta1_id, 'Derecho a la propiedad', false),
(UUID_TO_BIN(UUID()), @pregunta1_id, 'Derecho a la salud', false),
(UUID_TO_BIN(UUID()), @pregunta1_id, 'Derecho al trabajo', false);

-- Opciones para pregunta 2 (MULTIPLE_CHOICE)
INSERT INTO question_options (id, question_id, text, is_correct)
VALUES
(UUID_TO_BIN(UUID()), @pregunta2_id, 'Presunción de inocencia', true),
(UUID_TO_BIN(UUID()), @pregunta2_id, 'Defensa en juicio', true),
(UUID_TO_BIN(UUID()), @pregunta2_id, 'Juez natural', true),
(UUID_TO_BIN(UUID()), @pregunta2_id, 'Derecho a la vivienda', false);

-- Crear una sesión de examen para el usuario1
SET @user1_id = (SELECT id FROM user_entity WHERE username = 'usuario1' LIMIT 1);

INSERT INTO examination_sessions (id, examination_id, user_id, start_time, deadline, status, current_question_index)
VALUES (UUID_TO_BIN(UUID()), @examen1_id, @user1_id, CURRENT_TIMESTAMP, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 2 HOUR), 'IN_PROGRESS', 0);

-- Insertar algunas respuestas para el usuario1
SET @session_id = (SELECT id FROM examination_sessions WHERE user_id = @user1_id LIMIT 1);
SET @question1_id = (SELECT id FROM questions WHERE examination_id = @examen1_id AND order_number = 1);

INSERT INTO answers (id, question_id, response, response_time_ms, status, timestamp, session_id)
VALUES
(UUID_TO_BIN(UUID()), @question1_id, 'Derecho a ser oído', 30000, 'SUBMITTED', CURRENT_TIMESTAMP, @session_id);