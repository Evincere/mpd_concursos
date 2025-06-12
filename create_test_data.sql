-- Script para crear datos de prueba realistas
-- Concursos del Ministerio Público de la Defensa

USE mpd_concursos;

-- Limpiar datos existentes de concursos (mantener usuarios)
DELETE FROM contest_requirements WHERE contestId IN (SELECT id FROM contests);
DELETE FROM contest_dates WHERE contestId IN (SELECT id FROM contests);
DELETE FROM contests;

-- Reiniciar el auto_increment
ALTER TABLE contests AUTO_INCREMENT = 1;

-- Insertar concursos realistas
INSERT INTO contests (
    title, 
    category, 
    class_, 
    functions, 
    department, 
    position, 
    status, 
    startDate, 
    endDate, 
    basesUrl, 
    descriptionUrl, 
    createdAt, 
    updatedAt
) VALUES 
-- Concurso 1: Defensor Público
(
    'Concurso para Defensor Público Oficial',
    'PROFESIONAL',
    'Clase A',
    'Ejercer la defensa técnica de personas imputadas en procesos penales. Asesorar y representar a personas en situación de vulnerabilidad. Garantizar el acceso a la justicia.',
    'Defensoría General',
    'Defensor Público Oficial',
    'INSCRIPTION_OPEN',
    '2025-01-15',
    '2025-03-15',
    '/assets/bases/defensor-publico-2025.pdf',
    '/assets/descripcion/defensor-publico-desc.pdf',
    NOW(),
    NOW()
),

-- Concurso 2: Secretario Judicial
(
    'Concurso para Secretario Judicial',
    'ADMINISTRATIVO',
    'Clase B',
    'Asistir al Defensor Público en la tramitación de expedientes. Realizar notificaciones y diligencias judiciales. Organizar y mantener el archivo de la oficina.',
    'Defensoría General',
    'Secretario Judicial',
    'INSCRIPTION_OPEN',
    '2025-02-01',
    '2025-04-01',
    '/assets/bases/secretario-judicial-2025.pdf',
    '/assets/descripcion/secretario-judicial-desc.pdf',
    NOW(),
    NOW()
),

-- Concurso 3: Psicólogo Forense
(
    'Concurso para Psicólogo Forense',
    'TECNICO',
    'Clase A',
    'Realizar evaluaciones psicológicas en el ámbito penal. Elaborar informes periciales. Asistir en casos de violencia familiar y delitos contra la integridad sexual.',
    'Cuerpo Técnico Auxiliar',
    'Psicólogo Forense',
    'INSCRIPTION_OPEN',
    '2025-01-20',
    '2025-03-20',
    '/assets/bases/psicologo-forense-2025.pdf',
    '/assets/descripcion/psicologo-forense-desc.pdf',
    NOW(),
    NOW()
),

-- Concurso 4: Trabajador Social
(
    'Concurso para Trabajador Social',
    'TECNICO',
    'Clase B',
    'Realizar informes socio-ambientales. Asistir a personas en situación de vulnerabilidad social. Coordinar con organismos de protección social.',
    'Cuerpo Técnico Auxiliar',
    'Trabajador Social',
    'INSCRIPTION_OPEN',
    '2025-02-10',
    '2025-04-10',
    '/assets/bases/trabajador-social-2025.pdf',
    '/assets/descripcion/trabajador-social-desc.pdf',
    NOW(),
    NOW()
),

-- Concurso 5: Administrativo
(
    'Concurso para Personal Administrativo',
    'ADMINISTRATIVO',
    'Clase C',
    'Atención al público. Gestión de expedientes administrativos. Apoyo en tareas de oficina y archivo. Manejo de sistemas informáticos.',
    'Administración General',
    'Empleado Administrativo',
    'INSCRIPTION_OPEN',
    '2025-01-25',
    '2025-03-25',
    '/assets/bases/administrativo-2025.pdf',
    '/assets/descripcion/administrativo-desc.pdf',
    NOW(),
    NOW()
);

-- Insertar fechas importantes para cada concurso
INSERT INTO contest_dates (contestId, label, type, startDate, endDate) VALUES
-- Concurso 1: Defensor Público
(1, 'Inscripciones', 'INSCRIPTION', '2025-01-15', '2025-02-15'),
(1, 'Examen Escrito', 'WRITTEN_EXAM', '2025-03-01', '2025-03-01'),
(1, 'Examen Oral', 'ORAL_EXAM', '2025-03-15', '2025-03-15'),

-- Concurso 2: Secretario Judicial
(2, 'Inscripciones', 'INSCRIPTION', '2025-02-01', '2025-03-01'),
(2, 'Examen Escrito', 'WRITTEN_EXAM', '2025-03-15', '2025-03-15'),
(2, 'Entrevista', 'INTERVIEW', '2025-04-01', '2025-04-01'),

-- Concurso 3: Psicólogo Forense
(3, 'Inscripciones', 'INSCRIPTION', '2025-01-20', '2025-02-20'),
(3, 'Evaluación Técnica', 'TECHNICAL_EXAM', '2025-03-05', '2025-03-05'),
(3, 'Examen Oral', 'ORAL_EXAM', '2025-03-20', '2025-03-20'),

-- Concurso 4: Trabajador Social
(4, 'Inscripciones', 'INSCRIPTION', '2025-02-10', '2025-03-10'),
(4, 'Examen Escrito', 'WRITTEN_EXAM', '2025-03-25', '2025-03-25'),
(4, 'Evaluación Práctica', 'PRACTICAL_EXAM', '2025-04-10', '2025-04-10'),

-- Concurso 5: Administrativo
(5, 'Inscripciones', 'INSCRIPTION', '2025-01-25', '2025-02-25'),
(5, 'Examen Escrito', 'WRITTEN_EXAM', '2025-03-10', '2025-03-10'),
(5, 'Examen Práctico', 'PRACTICAL_EXAM', '2025-03-25', '2025-03-25');

-- Insertar requisitos para cada concurso
INSERT INTO contest_requirements (contestId, description, category, required, priority, documentType) VALUES
-- Requisitos para Defensor Público
(1, 'Título de Abogado expedido por Universidad Nacional o Privada reconocida', 'EDUCACION', TRUE, 1, 'TITULO_UNIVERSITARIO'),
(1, 'Matrícula profesional vigente en el Colegio de Abogados', 'PROFESIONAL', TRUE, 2, 'MATRICULA_PROFESIONAL'),
(1, 'Mínimo 3 años de experiencia en derecho penal', 'EXPERIENCIA', TRUE, 3, 'CERTIFICADO_EXPERIENCIA'),
(1, 'Certificado de antecedentes penales', 'DOCUMENTACION', TRUE, 4, 'ANTECEDENTES_PENALES'),

-- Requisitos para Secretario Judicial
(2, 'Título secundario completo', 'EDUCACION', TRUE, 1, 'TITULO_SECUNDARIO'),
(2, 'Curso de capacitación en procedimientos judiciales (deseable)', 'CAPACITACION', FALSE, 2, 'CERTIFICADO_CURSO'),
(2, 'Experiencia en atención al público (deseable)', 'EXPERIENCIA', FALSE, 3, 'CERTIFICADO_EXPERIENCIA'),
(2, 'Certificado de antecedentes penales', 'DOCUMENTACION', TRUE, 4, 'ANTECEDENTES_PENALES'),

-- Requisitos para Psicólogo Forense
(3, 'Título de Licenciado en Psicología', 'EDUCACION', TRUE, 1, 'TITULO_UNIVERSITARIO'),
(3, 'Matrícula profesional vigente', 'PROFESIONAL', TRUE, 2, 'MATRICULA_PROFESIONAL'),
(3, 'Especialización en Psicología Forense o Jurídica', 'ESPECIALIZACION', TRUE, 3, 'CERTIFICADO_ESPECIALIZACION'),
(3, 'Experiencia en evaluaciones psicológicas', 'EXPERIENCIA', TRUE, 4, 'CERTIFICADO_EXPERIENCIA'),

-- Requisitos para Trabajador Social
(4, 'Título de Licenciado en Trabajo Social', 'EDUCACION', TRUE, 1, 'TITULO_UNIVERSITARIO'),
(4, 'Matrícula profesional vigente', 'PROFESIONAL', TRUE, 2, 'MATRICULA_PROFESIONAL'),
(4, 'Experiencia en trabajo con poblaciones vulnerables', 'EXPERIENCIA', TRUE, 3, 'CERTIFICADO_EXPERIENCIA'),
(4, 'Certificado de antecedentes penales', 'DOCUMENTACION', TRUE, 4, 'ANTECEDENTES_PENALES'),

-- Requisitos para Administrativo
(5, 'Título secundario completo', 'EDUCACION', TRUE, 1, 'TITULO_SECUNDARIO'),
(5, 'Conocimientos básicos de informática', 'TECNICO', TRUE, 2, 'CERTIFICADO_INFORMATICA'),
(5, 'Experiencia en atención al público (deseable)', 'EXPERIENCIA', FALSE, 3, 'CERTIFICADO_EXPERIENCIA'),
(5, 'Certificado de antecedentes penales', 'DOCUMENTACION', TRUE, 4, 'ANTECEDENTES_PENALES');

-- Verificar que los datos se insertaron correctamente
SELECT 'Datos de prueba creados exitosamente' AS resultado;
SELECT COUNT(*) AS total_concursos FROM contests;
SELECT COUNT(*) AS total_fechas FROM contest_dates;
SELECT COUNT(*) AS total_requisitos FROM contest_requirements;

-- Mostrar resumen de concursos creados
SELECT 
    id,
    title,
    department,
    position,
    status,
    startDate,
    endDate
FROM contests
ORDER BY id;
