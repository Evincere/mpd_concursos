-- VERIFICAR Y COMPLETAR MIGRACIÓN
-- Ejecutar en MySQL Workbench con la base de datos mpd_concursos

USE mpd_concursos;

-- 1. Verificar estructura completa de la tabla documents
SHOW COLUMNS FROM documents;

-- 2. Verificar si error_message existe, si no, agregarla
SELECT COUNT(*) as error_message_exists
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'documents' 
AND COLUMN_NAME = 'error_message'
AND TABLE_SCHEMA = 'mpd_concursos';

-- 3. Agregar error_message solo si no existe (ejecutar solo si el resultado anterior es 0)
-- ALTER TABLE documents ADD COLUMN error_message TEXT;

-- 4. Verificar si status es nullable
SELECT IS_NULLABLE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'documents' 
AND COLUMN_NAME = 'status'
AND TABLE_SCHEMA = 'mpd_concursos';

-- 5. Hacer status nullable si no lo es (ejecutar solo si el resultado anterior es 'NO')
-- ALTER TABLE documents MODIFY COLUMN status VARCHAR(20) NULL;

-- 6. Actualizar documentos existentes para asegurar que tengan processing_status correcto
UPDATE documents 
SET processing_status = 'UPLOAD_COMPLETE' 
WHERE processing_status IS NULL OR processing_status = '';

-- 7. Verificar estado final
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE, 
    COLUMN_DEFAULT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'documents' 
AND TABLE_SCHEMA = 'mpd_concursos'
AND COLUMN_NAME IN ('processing_status', 'error_message', 'status')
ORDER BY COLUMN_NAME;

-- 8. Mostrar algunos documentos para verificar
SELECT id, user_id, file_name, status, processing_status, error_message 
FROM documents 
LIMIT 5;
