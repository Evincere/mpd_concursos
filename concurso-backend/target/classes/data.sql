-- Insertar roles iniciales
INSERT INTO roles (id, name) 
VALUES (UUID_TO_BIN(UUID()), 'ROLE_ADMIN'),
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

-- Asignar rol de admin al usuario admin
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id 
FROM user_entity u, roles r 
WHERE u.username = 'admin' AND r.name = 'ROLE_ADMIN';

-- Concursos Activos (1-5)
INSERT INTO contests (department, position, status, start_date, end_date)
VALUES 
('DEFENSORÍAS PENALES', 'Defensor/a Penal - Primera C.J.', 'ACTIVE', '2025-02-01', '2025-04-30'),
('DEFENSORÍAS CIVILES', 'Defensor/a Civil - Segunda C.J.', 'ACTIVE', '2025-01-15', '2025-03-15'),
('SECRETARÍA LEGAL Y TÉCNICA', 'Asesor/a Legal', 'ACTIVE', '2025-02-10', '2025-05-10'),
('DESARROLLO TECNOLÓGICO', 'Analista Programador/a', 'ACTIVE', '2025-02-05', '2025-04-05'),
('CODEFENSORÍAS DE FAMILIA', 'Defensor/a de Familia - Primera C.J.', 'ACTIVE', '2025-01-20', '2025-03-20');

-- Concursos En Progreso (6-8)
INSERT INTO contests (department, position, status, start_date, end_date)
VALUES 
('ADMINISTRATIVO/CONTABLE', 'Contador/a Público', 'IN_PROGRESS', '2024-12-15', '2025-02-15'),
('RECURSOS HUMANOS', 'Analista de RRHH', 'IN_PROGRESS', '2024-12-01', '2025-02-28'),
('DEFENSORÍAS PENALES JUVENILES', 'Defensor/a Penal Juvenil - Segunda C.J.', 'IN_PROGRESS', '2024-11-15', '2025-02-20');

-- Concursos Cerrados (9-10)
INSERT INTO contests (department, position, status, start_date, end_date)
VALUES 
('ASESORÍAS DE NNAPPCF', 'Asesor/a - Tercera C.J.', 'CLOSED', '2024-09-01', '2024-12-31'),
('SERVICIOS GENERALES', 'Chofer', 'CLOSED', '2024-08-15', '2024-11-30');

-- Concursos en Borrador (11-12)
INSERT INTO contests (department, position, status, start_date, end_date)
VALUES 
('INFORMÁTICA', 'Técnico/a en Soporte IT', 'DRAFT', '2025-03-01', '2025-05-31'),
('CONTROL DE GESTIÓN', 'Analista de Control de Gestión', 'DRAFT', '2025-03-15', '2025-06-15');

-- Insertar algunas inscripciones de prueba
INSERT INTO inscriptions (id, user_id, contest_id, status, inscription_date, created_at)
SELECT 
    UUID_TO_BIN(UUID()),
    u.id,
    1,
    'PENDING',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM user_entity u
WHERE u.username = 'admin'
LIMIT 1;