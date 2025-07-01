-- MIGRACIÓN SIMPLE PARA TABLA DOCUMENTS
-- Ejecutar este script en tu cliente MySQL (phpMyAdmin, MySQL Workbench, etc.)

USE concursos_db;

-- 1. Verificar estructura actual de la tabla
SHOW COLUMNS FROM documents;

-- 2. Agregar columna processing_status
ALTER TABLE documents 
ADD COLUMN processing_status VARCHAR(20) NOT NULL DEFAULT 'UPLOAD_COMPLETE';

-- 3. Agregar columna error_message  
ALTER TABLE documents 
ADD COLUMN error_message TEXT;

-- 4. Hacer que la columna status sea nullable
ALTER TABLE documents 
MODIFY COLUMN status VARCHAR(20) NULL;

-- 5. Actualizar documentos existentes
UPDATE documents 
SET processing_status = 'UPLOAD_COMPLETE' 
WHERE processing_status IS NULL OR processing_status = '';

-- 6. Verificar que todo se aplicó correctamente
SHOW COLUMNS FROM documents;

-- 7. Mostrar algunos registros para verificar
SELECT id, user_id, file_name, status, processing_status, error_message 
FROM documents 
LIMIT 3;
