-- Concursos Activos y Cerrados (1-5)
INSERT INTO contests (id, department, position, status, start_date, end_date)
VALUES (1, 'Departamento de Sistemas', 'Desarrollador Full Stack', 'PUBLISHED', '2024-01-01', '2024-12-31');

INSERT INTO contests (id, department, position, status, start_date, end_date)
VALUES (2, 'Departamento de RRHH', 'Analista de Recursos Humanos', 'PUBLISHED', '2024-01-01', '2024-12-31');

INSERT INTO contests (id, department, position, status, start_date, end_date)
VALUES (3, 'Departamento Legal', 'Abogado Junior', 'CLOSED', '2023-06-01', '2023-12-31');

INSERT INTO contests (id, department, position, status, start_date, end_date)
VALUES (4, 'Departamento de Finanzas', 'Contador Senior', 'DRAFT', '2024-02-01', '2024-12-31');

INSERT INTO contests (id, department, position, status, start_date, end_date)
VALUES (5, 'Departamento de Marketing', 'Diseñador Gráfico', 'CANCELLED', '2023-01-01', '2023-12-31');

-- Concursos En Progreso (6-7)
INSERT INTO contests (id, department, position, status, start_date, end_date)
VALUES (6, 'Departamento de Finanzas', 'Contador', 'PUBLISHED', '2024-01-01', '2024-12-31');

INSERT INTO contests (id, department, position, status, start_date, end_date)
VALUES (7, 'Departamento de RRHH', 'Recruiter', 'PUBLISHED', '2024-01-01', '2024-12-31');

-- Concursos Cerrados (8-9)
INSERT INTO contests (id, department, position, status, start_date, end_date)
VALUES (8, 'Departamento de Marketing', 'Community Manager', 'CLOSED', '2023-01-01', '2023-12-31');

INSERT INTO contests (id, department, position, status, start_date, end_date)
VALUES (9, 'Departamento de Sistemas', 'DevOps Engineer', 'CLOSED', '2023-01-01', '2023-12-31');

-- Concurso Cancelado (10)
INSERT INTO contests (id, department, position, status, start_date, end_date)
VALUES (10, 'Departamento de IT', 'QA Engineer', 'CANCELLED', '2023-01-01', '2023-12-31');