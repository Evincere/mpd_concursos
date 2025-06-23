-- Script para corregir los UUIDs de los documentos insertados
-- Convertir de formato hexadecimal sin guiones a formato UUID con guiones

-- Mapeo de UUIDs:
-- AAAAAAAAAAAAAAAAAAAAAAAAAAAA0000 -> aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0000 (DNI Frente)
-- BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB -> bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb (DNI Dorso)
-- 22222222222222222222222222222222 -> 22222222-2222-2222-2222-222222222222 (Título Universitario)
-- 33333333333333333333333333333333 -> 33333333-3333-3333-3333-333333333333 (Certificado de Buena Conducta)
-- 55555555555555555555555555555555 -> 55555555-5555-5555-5555-555555555555 (Constancia de CUIL)
-- 66666666666666666666666666666666 -> 66666666-6666-6666-6666-666666666666 (Certificado de Antecedentes Penales)
-- 77777777777777777777777777777777 -> 77777777-7777-7777-7777-777777777777 (Certificado de Ejercicio Profesional)
-- 88888888888888888888888888888888 -> 88888888-8888-8888-8888-888888888888 (Certificado de Sanciones Disciplinarias)
-- 99999999999999999999999999999999 -> 99999999-9999-9999-9999-999999999999 (Certificado Ley Micaela)

-- Actualizar los document_type_id en los documentos insertados
UPDATE documents SET document_type_id = UNHEX(REPLACE('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0000', '-', '')) WHERE document_type_id = UNHEX('AAAAAAAAAAAAAAAAAAAAAAAAAAAA0000');
UPDATE documents SET document_type_id = UNHEX(REPLACE('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '-', '')) WHERE document_type_id = UNHEX('BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB');
UPDATE documents SET document_type_id = UNHEX(REPLACE('22222222-2222-2222-2222-222222222222', '-', '')) WHERE document_type_id = UNHEX('22222222222222222222222222222222');
UPDATE documents SET document_type_id = UNHEX(REPLACE('33333333-3333-3333-3333-333333333333', '-', '')) WHERE document_type_id = UNHEX('33333333333333333333333333333333');
UPDATE documents SET document_type_id = UNHEX(REPLACE('55555555-5555-5555-5555-555555555555', '-', '')) WHERE document_type_id = UNHEX('55555555555555555555555555555555');
UPDATE documents SET document_type_id = UNHEX(REPLACE('66666666-6666-6666-6666-666666666666', '-', '')) WHERE document_type_id = UNHEX('66666666666666666666666666666666');
UPDATE documents SET document_type_id = UNHEX(REPLACE('77777777-7777-7777-7777-777777777777', '-', '')) WHERE document_type_id = UNHEX('77777777777777777777777777777777');
UPDATE documents SET document_type_id = UNHEX(REPLACE('88888888-8888-8888-8888-888888888888', '-', '')) WHERE document_type_id = UNHEX('88888888888888888888888888888888');
UPDATE documents SET document_type_id = UNHEX(REPLACE('99999999-9999-9999-9999-999999999999', '-', '')) WHERE document_type_id = UNHEX('99999999999999999999999999999999');

-- Verificar los cambios
SELECT 
    HEX(document_type_id) as document_type_hex,
    file_name,
    status
FROM documents 
WHERE user_id = UNHEX('79935C04C4294814895C71BA6311AA7A')
ORDER BY file_name;
