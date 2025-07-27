-- Actualizar la URL del documento para la experiencia existente
UPDATE work_experience 
SET supporting_document_url = 'f8424c19-e1e4-493b-8d02-8736a4e840f1/experiences/d10ddc18-6734-430f-a504-d85d346759df_experience_20250727_100530.pdf'
WHERE id = 'd10ddc18-6734-430f-a504-d85d346759df';

-- Verificar el resultado
SELECT id, company_name, position_title, supporting_document_url 
FROM work_experience 
WHERE id = 'd10ddc18-6734-430f-a504-d85d346759df';