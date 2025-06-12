-- Script para verificar y crear tipos de documentos necesarios
USE mpd_concursos;

-- Verificar tipos de documentos existentes
SELECT 'TIPOS DE DOCUMENTOS ACTUALES:' AS info;
SELECT * FROM document_types ORDER BY name;

-- Insertar tipos de documentos básicos si no existen
INSERT IGNORE INTO document_types (name, description, required, category, maxSizeBytes, allowedExtensions) VALUES
('DNI_FRENTE', 'Documento Nacional de Identidad - Frente', TRUE, 'IDENTIFICACION', 10485760, 'pdf,jpg,jpeg,png'),
('DNI_DORSO', 'Documento Nacional de Identidad - Dorso', TRUE, 'IDENTIFICACION', 10485760, 'pdf,jpg,jpeg,png'),
('TITULO_UNIVERSITARIO', 'Título Universitario', TRUE, 'EDUCACION', 10485760, 'pdf'),
('TITULO_SECUNDARIO', 'Título Secundario', TRUE, 'EDUCACION', 10485760, 'pdf'),
('MATRICULA_PROFESIONAL', 'Matrícula Profesional', TRUE, 'PROFESIONAL', 10485760, 'pdf'),
('CERTIFICADO_EXPERIENCIA', 'Certificado de Experiencia Laboral', TRUE, 'EXPERIENCIA', 10485760, 'pdf'),
('ANTECEDENTES_PENALES', 'Certificado de Antecedentes Penales', TRUE, 'DOCUMENTACION', 10485760, 'pdf'),
('CERTIFICADO_CURSO', 'Certificado de Curso o Capacitación', FALSE, 'CAPACITACION', 10485760, 'pdf'),
('CERTIFICADO_ESPECIALIZACION', 'Certificado de Especialización', TRUE, 'ESPECIALIZACION', 10485760, 'pdf'),
('CERTIFICADO_INFORMATICA', 'Certificado de Conocimientos Informáticos', TRUE, 'TECNICO', 10485760, 'pdf'),
('CV_ACTUALIZADO', 'Curriculum Vitae Actualizado', TRUE, 'DOCUMENTACION', 10485760, 'pdf'),
('FOTO_CARNET', 'Fotografía tipo carnet', TRUE, 'IDENTIFICACION', 5242880, 'jpg,jpeg,png');

-- Verificar que se insertaron correctamente
SELECT 'TIPOS DE DOCUMENTOS DESPUÉS DE LA INSERCIÓN:' AS info;
SELECT COUNT(*) AS total_tipos_documentos FROM document_types;
SELECT * FROM document_types ORDER BY category, name;

-- Verificar si hay usuarios en el sistema
SELECT 'USUARIOS EN EL SISTEMA:' AS info;
SELECT COUNT(*) AS total_usuarios FROM user_entity;
SELECT username, email, firstName, lastName FROM user_entity LIMIT 5;
