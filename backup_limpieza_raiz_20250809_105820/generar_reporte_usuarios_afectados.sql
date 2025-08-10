SELECT 
    u.email,
    u.first_name,
    u.last_name,
    u.dni,
    dt.name as tipo_documento,
    d.file_name as archivo_faltante,
    d.file_path as ruta_archivo,
    DATE(d.upload_date) as fecha_subida,
    d.status as estado_documento
FROM documents d
INNER JOIN user_entity u ON d.user_id = u.id
INNER JOIN document_types dt ON d.document_type_id = dt.id
WHERE d.upload_date >= '2025-08-01'
  AND d.file_path IS NOT NULL
ORDER BY u.email, DATE(d.upload_date), dt.name;
