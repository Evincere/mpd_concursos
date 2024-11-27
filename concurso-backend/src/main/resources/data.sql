-- Concursos Activos
INSERT INTO CONTESTS (ID, STATUS, DEPARTMENT, POSITION, START_DATE, END_DATE) VALUES
(1, 'ACTIVE', 'RRHH', 'Analista RRHH', '2024-01-01', '2024-02-28'),
(2, 'ACTIVE', 'Legal', 'Abogado Senior', '2024-01-15', '2024-03-15'),
(3, 'ACTIVE', 'IT', 'Desarrollador Java', '2024-02-01', '2024-04-01');

-- Concursos En Progreso
INSERT INTO CONTESTS (ID, STATUS, DEPARTMENT, POSITION, START_DATE, END_DATE) VALUES
(4, 'IN_PROGRESS', 'Finanzas', 'Contador', '2023-12-01', '2024-01-31'),
(5, 'IN_PROGRESS', 'RRHH', 'Recruiter', '2023-11-15', '2024-01-15');

-- Concursos Cerrados
INSERT INTO CONTESTS (ID, STATUS, DEPARTMENT, POSITION, START_DATE, END_DATE) VALUES
(6, 'CLOSED', 'IT', 'DevOps Engineer', '2023-10-01', '2023-12-31'),
(7, 'CLOSED', 'Legal', 'Abogado Junior', '2023-09-01', '2023-11-30'),
(8, 'CLOSED', 'Finanzas', 'Analista Financiero', '2023-08-01', '2023-10-31');

-- Concursos Cancelados
INSERT INTO CONTESTS (ID, STATUS, DEPARTMENT, POSITION, START_DATE, END_DATE) VALUES
(9, 'CANCELLED', 'RRHH', 'Asistente RRHH', '2023-11-01', '2024-01-31'),
(10, 'CANCELLED', 'IT', 'QA Engineer', '2023-10-15', '2023-12-15');

-- Inscripciones para diferentes concursos
INSERT INTO INSCRIPTIONS (CONTEST_ID, USER_ID, STATUS, INSCRIPTION_DATE) VALUES
-- Inscripciones para concursos activos
(1, 1, 'PENDING', '2024-01-05 10:00:00'),
(1, 2, 'ACCEPTED', '2024-01-06 11:30:00'),
(1, 3, 'REJECTED', '2024-01-07 09:15:00'),
(2, 1, 'PENDING', '2024-01-16 14:20:00'),
(2, 4, 'ACCEPTED', '2024-01-17 16:45:00'),
(3, 2, 'PENDING', '2024-02-02 08:30:00'),

-- Inscripciones para concursos en progreso
(4, 5, 'ACCEPTED', '2023-12-05 13:00:00'),
(4, 6, 'REJECTED', '2023-12-06 15:20:00'),
(5, 7, 'ACCEPTED', '2023-11-20 10:45:00'),
(5, 8, 'PENDING', '2023-11-21 11:10:00'),

-- Inscripciones para concursos cerrados
(6, 9, 'ACCEPTED', '2023-10-10 09:00:00'),
(7, 10, 'REJECTED', '2023-09-15 14:30:00'),
(8, 11, 'ACCEPTED', '2023-08-20 16:15:00'); 