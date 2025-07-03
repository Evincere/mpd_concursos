-- Migración para insertar tipos de documento básicos
-- Esta migración se ejecuta automáticamente y garantiza que siempre haya tipos de documento disponibles

-- Insertar tipos de documento según REGLAS DE NEGOCIO MPD CONCURSOS
-- Documentación requerida para la pestaña de Documentación (no Curriculum)
INSERT INTO document_types (id, code, name, description, is_active, required, `order`, parent_id) VALUES

-- === DOCUMENTOS DE IDENTIDAD (REQUERIDOS) ===
(UNHEX(REPLACE('550e8400-e29b-41d4-a716-446655440001', '-', '')), 'DNI_FRONTAL', 'DNI (Frontal)', 'Documento Nacional de Identidad - Lado frontal', true, true, 1, NULL),
(UNHEX(REPLACE('550e8400-e29b-41d4-a716-446655440002', '-', '')), 'DNI_DORSO', 'DNI (Dorso)', 'Documento Nacional de Identidad - Lado posterior', true, true, 2, NULL),
(UNHEX(REPLACE('550e8400-e29b-41d4-a716-446655440003', '-', '')), 'CONSTANCIA_CUIL', 'Constancia de CUIL', 'Constancia de Código Único de Identificación Laboral', true, true, 3, NULL),

-- === CERTIFICADOS LEGALES (REQUERIDOS) ===
(UNHEX(REPLACE('550e8400-e29b-41d4-a716-446655440004', '-', '')), 'ANTECEDENTES_PENALES', 'Certificado de Antecedentes Penales', 'Certificado de Antecedentes Penales vigente (antigüedad no mayor a 90 días desde su emisión)', true, true, 4, NULL),

-- === CERTIFICADOS PROFESIONALES (REQUERIDOS) ===
(UNHEX(REPLACE('550e8400-e29b-41d4-a716-446655440005', '-', '')), 'CERTIFICADO_PROFESIONAL_ANTIGUEDAD', 'Certificado de Antigüedad Profesional', 'Certificado de la Oficina de Profesionales de la SCJN o Colegio de Abogados que acredite antigüedad en el ejercicio profesional, o certificación de servicios del Poder Judicial (antigüedad no mayor a 6 meses)', true, true, 5, NULL),

(UNHEX(REPLACE('550e8400-e29b-41d4-a716-446655440006', '-', '')), 'CERTIFICADO_SIN_SANCIONES', 'Certificado Sin Sanciones Disciplinarias', 'Certificado que acredite no registrar sanciones disciplinarias según Ley N° 4.976 o Ley N° 9.103 (antigüedad no mayor a 6 meses)', true, true, 6, NULL),

-- === CERTIFICADOS OPCIONALES ===
(UNHEX(REPLACE('550e8400-e29b-41d4-a716-446655440007', '-', '')), 'CERTIFICADO_LEY_MICAELA', 'Certificado Ley Micaela', 'Certificado de capacitación en Ley Micaela (opcional - si lo tiene)', true, false, 7, NULL),

-- === DOCUMENTOS GENÉRICOS (PARA CASOS ESPECIALES) ===
(UNHEX(REPLACE('550e8400-e29b-41d4-a716-446655440008', '-', '')), 'DOCUMENTO_ADICIONAL', 'Documento Adicional', 'Cualquier documento adicional requerido específicamente para el concurso', true, false, 99, NULL);

-- Verificar que se insertaron correctamente
-- Esta consulta debería retornar 8 filas
SELECT COUNT(*) as total_tipos_insertados FROM document_types WHERE is_active = true;

-- Mostrar los tipos insertados para verificación
SELECT code, name, required, `order` FROM document_types WHERE is_active = true ORDER BY `order`;
