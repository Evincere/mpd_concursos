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