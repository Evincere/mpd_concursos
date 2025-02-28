SET SQL_SAFE_UPDATES = 0;
-- Deshabilitar verificación de foreign keys temporalmente
SET FOREIGN_KEY_CHECKS = 0;

-- Limpiar datos existentes
DELETE FROM inscriptions;
DELETE FROM user_roles;
DELETE FROM roles;
DELETE FROM user_entity;
DELETE FROM contests;
DELETE FROM examenes;
DELETE FROM preguntas;
DELETE FROM opciones;

-- Habilitar verificación de foreign keys
SET FOREIGN_KEY_CHECKS = 1;

-- Insertar roles iniciales
INSERT INTO roles (id, name) 
VALUES 
(UUID_TO_BIN(UUID()), 'ROLE_ADMIN'),
(UUID_TO_BIN(UUID()), 'ROLE_USER');

-- Insertar usuario administrador por defecto
INSERT INTO user_entity (id, username, password, email, dni, cuit, first_name, last_name, created_at) 
VALUES (
    UUID_TO_BIN(UUID()),
    'admin',
    '$2a$10$TpVxkJXgPR9h9z1h8YbPm.vg5eJcKSn7TZIRMJxeGDFxYBrqXV7Uy', -- password: admin
    'admin@mpd.gov.ar',
    '20000000',
    '20200000001',
    'Admin',
    'MPD',
    CURRENT_TIMESTAMP
);

-- Insertar usuarios de prueba
INSERT INTO user_entity (id, username, password, email, dni, cuit, first_name, last_name, created_at)
VALUES
(UUID_TO_BIN(UUID()), 'usuario1', '$2a$10$TpVxkJXgPR9h9z1h8YbPm.vg5eJcKSn7TZIRMJxeGDFxYBrqXV7Uy', 
'usuario1@test.com', '20111111', '20201111111', 'Usuario', 'Uno', CURRENT_TIMESTAMP),
(UUID_TO_BIN(UUID()), 'usuario2', '$2a$10$TpVxkJXgPR9h9z1h8YbPm.vg5eJcKSn7TZIRMJxeGDFxYBrqXV7Uy', 
'usuario2@test.com', '20222222', '20202222221', 'Usuario', 'Dos', CURRENT_TIMESTAMP);

-- Asignar roles a usuarios
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id 
FROM user_entity u 
CROSS JOIN roles r 
WHERE (u.username = 'admin' AND r.name = 'ROLE_ADMIN')
   OR (u.username IN ('usuario1', 'usuario2') AND r.name = 'ROLE_USER');

-- Insertar concursos
INSERT INTO contests (id, department, position, status, start_date, end_date)
VALUES 
(1, 'DEFENSORÍAS PENALES', 'Defensor/a Penal - Primera C.J.', 'ACTIVE', '2025-02-01', '2025-04-30'),
(2, 'DEFENSORÍAS CIVILES', 'Defensor/a Civil - Segunda C.J.', 'ACTIVE', '2025-01-15', '2025-03-15'),
(3, 'SECRETARÍA LEGAL Y TÉCNICA', 'Asesor/a Legal', 'ACTIVE', '2025-02-10', '2025-05-10'),
(4, 'DESARROLLO TECNOLÓGICO', 'Analista Programador/a', 'ACTIVE', '2025-02-05', '2025-04-05'),
(5, 'CODEFENSORÍAS DE FAMILIA', 'Defensor/a de Familia - Primera C.J.', 'ACTIVE', '2025-01-20', '2025-03-20'),
(6, 'ADMINISTRATIVO/CONTABLE', 'Contador/a Público', 'IN_PROGRESS', '2024-12-15', '2025-02-15'),
(7, 'RECURSOS HUMANOS', 'Analista de RRHH', 'IN_PROGRESS', '2024-12-01', '2025-02-28'),
(8, 'DEFENSORÍAS PENALES JUVENILES', 'Defensor/a Penal Juvenil - Segunda C.J.', 'IN_PROGRESS', '2024-11-15', '2025-02-20'),
(9, 'ASESORÍAS DE NNAPPCF', 'Asesor/a - Tercera C.J.', 'CLOSED', '2024-09-01', '2024-12-31'),
(10, 'SERVICIOS GENERALES', 'Chofer', 'CLOSED', '2024-08-15', '2024-11-30'),
(11, 'INFORMÁTICA', 'Técnico/a en Soporte IT', 'DRAFT', '2025-03-01', '2025-05-31'),
(12, 'CONTROL DE GESTIÓN', 'Analista de Control de Gestión', 'DRAFT', '2025-03-15', '2025-06-15');

-- Insertar inscripciones
INSERT INTO inscriptions (id, user_id, contest_id, status, inscription_date, created_at, documentacion_completa)
SELECT 
    UUID_TO_BIN(UUID()),
    u.id,
    c.id,
    CASE c.id
        WHEN 1 THEN 'PENDING'
        WHEN 2 THEN 'APPROVED'
        WHEN 3 THEN 'PENDING'
        WHEN 4 THEN 'REJECTED'
        WHEN 5 THEN 'CANCELLED'
    END,
    CASE c.id
        WHEN 1 THEN CURRENT_TIMESTAMP
        WHEN 2 THEN DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 5 DAY)
        WHEN 3 THEN DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 3 DAY)
        WHEN 4 THEN DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 2 DAY)
        WHEN 5 THEN DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 DAY)
    END,
    CASE c.id
        WHEN 1 THEN CURRENT_TIMESTAMP
        WHEN 2 THEN DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 5 DAY)
        WHEN 3 THEN DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 3 DAY)
        WHEN 4 THEN DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 2 DAY)
        WHEN 5 THEN DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 DAY)
    END,
    CASE c.id
        WHEN 1 THEN FALSE
        WHEN 2 THEN TRUE
        WHEN 3 THEN FALSE
        WHEN 4 THEN TRUE
        WHEN 5 THEN FALSE
    END
FROM user_entity u
CROSS JOIN contests c
WHERE u.username IN ('admin', 'usuario1', 'usuario2')
AND c.id IN (1, 2, 3, 4, 5);

-- Insertar exámenes de prueba
DELETE FROM examenes;
INSERT INTO examenes (id, titulo, descripcion, tipo, estado, duracion, puntaje_maximo, fecha_inicio, fecha_fin)
VALUES 
(UUID_TO_BIN(UUID()), 'Examen de Ingreso - Defensor Penal', 'Examen para el cargo de Defensor Penal', 'INGRESO', 'DISPONIBLE', 120, 100.00, '2025-03-01 09:00:00', '2025-03-01 11:00:00'),
(UUID_TO_BIN(UUID()), 'Evaluación de Conocimientos Jurídicos', 'Evaluación general de derecho penal', 'EVALUACION', 'BORRADOR', 90, 80.00, '2025-03-15 14:00:00', '2025-03-15 15:30:00'),
(UUID_TO_BIN(UUID()), 'Práctica de Examen', 'Examen de práctica para familiarizarse con el sistema', 'PRACTICA', 'DISPONIBLE', 30, 50.00, '2025-02-28 10:00:00', '2025-02-28 10:30:00');

-- Insertar preguntas para el primer examen
SET @examen1_id = (SELECT id FROM examenes WHERE titulo = 'Examen de Ingreso - Defensor Penal' LIMIT 1);

INSERT INTO preguntas (id, examen_id, texto, tipo, puntaje, orden)
VALUES
(UUID_TO_BIN(UUID()), @examen1_id, '¿Cuál es el principio fundamental del debido proceso?', 'OPCION_MULTIPLE', 20.00, 1),
(UUID_TO_BIN(UUID()), @examen1_id, 'Seleccione las garantías constitucionales aplicables al proceso penal', 'SELECCION_MULTIPLE', 30.00, 2),
(UUID_TO_BIN(UUID()), @examen1_id, 'Ordene cronológicamente las etapas del proceso penal', 'ORDENAMIENTO', 25.00, 3),
(UUID_TO_BIN(UUID()), @examen1_id, 'La prisión preventiva es una medida cautelar', 'VERDADERO_FALSO', 10.00, 4),
(UUID_TO_BIN(UUID()), @examen1_id, 'Desarrolle los fundamentos de la teoría del delito', 'DESARROLLO', 15.00, 5);

-- Insertar opciones para las preguntas
SET @pregunta1_id = (SELECT id FROM preguntas WHERE examen_id = @examen1_id AND orden = 1);
SET @pregunta2_id = (SELECT id FROM preguntas WHERE examen_id = @examen1_id AND orden = 2);
SET @pregunta3_id = (SELECT id FROM preguntas WHERE examen_id = @examen1_id AND orden = 3);

-- Opciones para pregunta 1
INSERT INTO opciones (id, pregunta_id, texto, es_correcta, orden)
VALUES
(UUID_TO_BIN(UUID()), @pregunta1_id, 'Derecho a ser oído', TRUE, 1),
(UUID_TO_BIN(UUID()), @pregunta1_id, 'Derecho a la propiedad', FALSE, 2),
(UUID_TO_BIN(UUID()), @pregunta1_id, 'Derecho a la salud', FALSE, 3),
(UUID_TO_BIN(UUID()), @pregunta1_id, 'Derecho al trabajo', FALSE, 4);

-- Opciones para pregunta 2
INSERT INTO opciones (id, pregunta_id, texto, es_correcta, orden)
VALUES
(UUID_TO_BIN(UUID()), @pregunta2_id, 'Presunción de inocencia', TRUE, 1),
(UUID_TO_BIN(UUID()), @pregunta2_id, 'Defensa en juicio', TRUE, 2),
(UUID_TO_BIN(UUID()), @pregunta2_id, 'Juez natural', TRUE, 3),
(UUID_TO_BIN(UUID()), @pregunta2_id, 'Derecho a la vivienda', FALSE, 4);

-- Opciones para pregunta 3
INSERT INTO opciones (id, pregunta_id, texto, es_correcta, orden)
VALUES
(UUID_TO_BIN(UUID()), @pregunta3_id, 'Investigación preliminar', TRUE, 1),
(UUID_TO_BIN(UUID()), @pregunta3_id, 'Instrucción formal', TRUE, 2),
(UUID_TO_BIN(UUID()), @pregunta3_id, 'Elevación a juicio', TRUE, 3),
(UUID_TO_BIN(UUID()), @pregunta3_id, 'Debate oral', TRUE, 4);