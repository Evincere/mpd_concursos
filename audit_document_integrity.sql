-- Auditoría de integridad de documentos
-- Obtener todos los documentos NO archivados con información del usuario

SELECT 
    LOWER(HEX(d.id)) as document_id,
    LOWER(HEX(d.user_id)) as user_id,
    ue.email,
    d.file_name,
    d.file_path,
    d.content_type,
    d.status,
    d.processing_status,
    d.upload_date,
    d.is_archived,
    dt.name as document_type_name
FROM documents d
LEFT JOIN user_entity ue ON d.user_id = ue.id
LEFT JOIN document_types dt ON d.document_type_id = dt.id
WHERE d.is_archived = 0 
    AND d.file_path IS NOT NULL 
    AND d.file_path != ''
ORDER BY d.upload_date DESC;
