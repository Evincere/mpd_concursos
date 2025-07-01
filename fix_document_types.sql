-- Script para insertar tipos de documentos con UUIDs correctos
-- Ejecutar este script para restaurar los tipos de documento después de limpiar la base de datos

USE mpd_concursos;

-- Verificar estado actual
SELECT 'TIPOS DE DOCUMENTOS ANTES DE LA INSERCIÓN:' AS info;
SELECT COUNT(*) as total_tipos FROM document_types;

-- Limpiar tipos de documentos existentes si hay alguno
DELETE FROM document_types;

-- Insertar tipos de documentos con UUIDs válidos
-- NOTA: Usamos UUIDs específicos que coinciden con los que espera el frontend

INSERT INTO document_types (id, code, name, description, parent_id, required, `order`, is_active) VALUES
-- Documentos obligatorios
(UNHEX(REPLACE('646e692d-6672-656e-7465-000000000000', '-', '')), 'dni-frente', 'DNI (Frente)', 'Documento Nacional de Identidad - Lado frontal', NULL, TRUE, 1, TRUE),
(UNHEX(REPLACE('646e692d-646f-7273-6f00-000000000000', '-', '')), 'dni-dorso', 'DNI (Dorso)', 'Documento Nacional de Identidad - Lado posterior', NULL, TRUE, 2, TRUE),
(UNHEX(REPLACE('6375696c-0000-0000-0000-000000000000', '-', '')), 'cuil', 'Constancia de CUIL', 'Constancia de CUIL actualizada', NULL, TRUE, 3, TRUE),
(UNHEX(REPLACE('74697475-6c6f-2d75-6e69-766572736974', '-', '')), 'titulo-universitario', 'Título Universitario', 'Título de grado universitario', NULL, TRUE, 4, TRUE),
(UNHEX(REPLACE('616e7465-6365-6465-6e74-65732d70656e', '-', '')), 'antecedentes-penales', 'Certificado de Antecedentes Penales', 'Certificado vigente con antigüedad no mayor a 90 días desde su emisión', NULL, TRUE, 5, TRUE),
(UNHEX(REPLACE('63657274-6966-6963-6164-6f2d70726f66', '-', '')), 'certificado-profesional', 'Certificado de Ejercicio Profesional', 'Certificado expedido por la Oficina de Profesionales de la SCJ o Colegio de Abogados, o certificación de servicios del Poder Judicial. Antigüedad máxima: 6 meses', NULL, TRUE, 6, TRUE),
(UNHEX(REPLACE('63657274-6966-6963-6164-6f2d73616e63', '-', '')), 'certificado-sanciones', 'Certificado de Sanciones Disciplinarias', 'Certificado que acredite no registrar sanciones disciplinarias y/o en trámite. Antigüedad máxima: 6 meses', NULL, TRUE, 7, TRUE),

-- Documentos opcionales
(UNHEX(REPLACE('63657274-6966-6963-6164-6f2d6c65792d', '-', '')), 'certificado-ley-micaela', 'Certificado Ley Micaela', 'Certificado de capacitación en Ley Micaela (opcional)', NULL, FALSE, 8, TRUE),

-- Documento genérico para casos especiales
(UNHEX(REPLACE('646f6375-6d65-6e74-6f2d-67656e657269', '-', '')), 'documento-generico', 'Documento Genérico', 'Tipo de documento genérico para casos no especificados', NULL, FALSE, 999, TRUE);

-- Verificar inserción
SELECT 'TIPOS DE DOCUMENTOS DESPUÉS DE LA INSERCIÓN:' AS info;
SELECT 
    HEX(id) as id_hex,
    code,
    name,
    required,
    `order`,
    is_active
FROM document_types 
ORDER BY `order`;

-- Verificar total
SELECT COUNT(*) as total_tipos_insertados FROM document_types;

SELECT 'SCRIPT COMPLETADO EXITOSAMENTE' AS resultado;
