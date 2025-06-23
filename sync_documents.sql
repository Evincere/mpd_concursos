-- Script para sincronizar documentos físicos con la base de datos
-- Usuario: 87654321 (user_test@example.com)
-- ID Usuario: DCDFDD8C8B8A43E5B636867E2D1C98E6

-- Insertar documentos basados en archivos físicos existentes
INSERT INTO documents (id, user_id, document_type_id, file_name, content_type, file_path, status, upload_date, comments) VALUES

-- DNI Dorso
(UNHEX('017057f55cc4449b827ab9006609c471'),
 UNHEX('79935C04C4294814895C71BA6311AA7A'),
 UNHEX('BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB'),
 'DNI_Dorso.pdf',
 'application/pdf',
 '87654321/017057f5-5cc4-449b-827a-b9006609c471_DNI__Dorso__1750276495456.pdf',
 'PENDING',
 '2025-06-18 12:00:00',
 'Documento sincronizado desde archivo físico'),

-- Certificado de Sanciones Disciplinarias
(UNHEX('411b94d362004dba884535c5f425c978'),
 UNHEX('79935C04C4294814895C71BA6311AA7A'),
 UNHEX('88888888888888888888888888888888'),
 'Certificado_de_Sanciones_Disciplinarias.pdf',
 'application/pdf',
 '87654321/411b94d3-6200-4dba-8845-35c5f425c978_Certificado_de_Sanciones_Disciplinarias_1750276493366.pdf',
 'PENDING',
 '2025-06-18 12:00:00',
 'Documento sincronizado desde archivo físico'),

-- DNI Frente
(UNHEX('5be050ae59294257a73f3940fa699853'),
 UNHEX('79935C04C4294814895C71BA6311AA7A'),
 UNHEX('AAAAAAAAAAAAAAAAAAAAAAAAAAAA0000'),
 'DNI_Frente.pdf',
 'application/pdf',
 '87654321/5be050ae-5929-4257-a73f-3940fa699853_DNI__Frente__1750276496505.pdf',
 'PENDING',
 '2025-06-18 12:00:00',
 'Documento sincronizado desde archivo físico'),

-- Certificado de Ejercicio Profesional
(UNHEX('6d4a44b646c04b389b1a4d5d4eaaed6a'),
 UNHEX('79935C04C4294814895C71BA6311AA7A'),
 UNHEX('77777777777777777777777777777777'),
 'Certificado_de_Ejercicio_Profesional.pdf',
 'application/pdf',
 '87654321/6d4a44b6-46c0-4b38-9b1a-4d5d4eaaed6a_Certificado_de_Ejercicio_Profesional_1750276492332.pdf',
 'PENDING',
 '2025-06-18 12:00:00',
 'Documento sincronizado desde archivo físico'),

-- Certificado de Antecedentes Penales
(UNHEX('6e92a761cdab456cb8cc2863686742e1'),
 UNHEX('79935C04C4294814895C71BA6311AA7A'),
 UNHEX('66666666666666666666666666666666'),
 'Certificado_de_Antecedentes_Penales.pdf',
 'application/pdf',
 '87654321/6e92a761-cdab-456c-b8cc-2863686742e1_Certificado_de_Antecedentes_Penales_1750276491015.pdf',
 'PENDING',
 '2025-06-18 12:00:00',
 'Documento sincronizado desde archivo físico'),

-- Certificado Ley Micaela
(UNHEX('7d38fe3ea93e43f3b23db4f213f0e9ec'),
 UNHEX('79935C04C4294814895C71BA6311AA7A'),
 UNHEX('99999999999999999999999999999999'),
 'Certificado_Ley_Micaela.pdf',
 'application/pdf',
 '87654321/7d38fe3e-a93e-43f3-b23d-b4f213f0e9ec_Certificado_Ley_Micaela_1750280391830.pdf',
 'PENDING',
 '2025-06-18 12:00:00',
 'Documento sincronizado desde archivo físico'),

-- Titulo Universitario
(UNHEX('7f7e4550f4144315b7cc672695e9535f'),
 UNHEX('79935C04C4294814895C71BA6311AA7A'),
 UNHEX('22222222222222222222222222222222'),
 'Titulo_Universitario.pdf',
 'application/pdf',
 '87654321/7f7e4550-f414-4315-b7cc-672695e9535f_Titulo_Universitario_1750276497551.pdf',
 'PENDING',
 '2025-06-18 12:00:00',
 'Documento sincronizado desde archivo físico'),

-- Constancia de CUIL
(UNHEX('955bc7e2b29c481d917fc4d1ae198d14'),
 UNHEX('79935C04C4294814895C71BA6311AA7A'),
 UNHEX('55555555555555555555555555555555'),
 'Constancia_de_CUIL.pdf',
 'application/pdf',
 '87654321/955bc7e2-b29c-481d-917f-c4d1ae198d14_Constancia_de_CUIL_1750276494408.pdf',
 'PENDING',
 '2025-06-18 12:00:00',
 'Documento sincronizado desde archivo físico'),

-- Certificado de Buena Conducta
(UNHEX('fec5673cc19d4462b6669ed474b0f0f4'),
 UNHEX('79935C04C4294814895C71BA6311AA7A'),
 UNHEX('33333333333333333333333333333333'),
 'Certificado_de_Buena_Conducta.pdf',
 'application/pdf',
 '87654321/fec5673c-c19d-4462-b666-9ed474b0f0f4_Certificado_de_Buena_Conducta_1750276498588.pdf',
 'PENDING',
 '2025-06-18 12:00:00',
 'Documento sincronizado desde archivo físico');
