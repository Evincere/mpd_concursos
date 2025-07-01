-- Script directo para agregar las columnas faltantes a la tabla documents

-- Verificar estructura actual
DESCRIBE documents;

-- Agregar columna processing_status
ALTER TABLE documents 
ADD COLUMN processing_status VARCHAR(20) NOT NULL DEFAULT 'UPLOAD_COMPLETE';

-- Agregar columna error_message
ALTER TABLE documents 
ADD COLUMN error_message TEXT;

-- Permitir que status sea nullable
ALTER TABLE documents 
MODIFY COLUMN status VARCHAR(20) NULL;

-- Actualizar documentos existentes para que tengan el estado correcto
UPDATE documents 
SET processing_status = 'UPLOAD_COMPLETE' 
WHERE processing_status IS NULL OR processing_status = '';

-- Verificar que las columnas se agregaron correctamente
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE, 
    COLUMN_DEFAULT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'documents' 
AND TABLE_SCHEMA = DATABASE()
ORDER BY ORDINAL_POSITION;

-- Verificar contenido de la tabla
SELECT COUNT(*) as total_documents FROM documents;

-- Mostrar algunos documentos de ejemplo
SELECT id, user_id, file_name, status, processing_status, error_message 
FROM documents 
LIMIT 5;
