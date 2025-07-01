-- Script para aplicar manualmente la migración de processing_status
-- Solo ejecutar si la migración automática falló

-- Verificar si las columnas ya existen
SELECT COUNT(*) as processing_status_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'documents' 
AND COLUMN_NAME = 'processing_status'
AND TABLE_SCHEMA = DATABASE();

-- Si el resultado es 0, ejecutar las siguientes líneas:

-- Agregar nueva columna processing_status (solo si no existe)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_NAME = 'documents' 
     AND COLUMN_NAME = 'processing_status'
     AND TABLE_SCHEMA = DATABASE()) = 0,
    'ALTER TABLE documents ADD COLUMN processing_status VARCHAR(20) NOT NULL DEFAULT ''UPLOAD_COMPLETE''',
    'SELECT ''Column processing_status already exists'' as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar nueva columna error_message (solo si no existe)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_NAME = 'documents' 
     AND COLUMN_NAME = 'error_message'
     AND TABLE_SCHEMA = DATABASE()) = 0,
    'ALTER TABLE documents ADD COLUMN error_message TEXT',
    'SELECT ''Column error_message already exists'' as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Actualizar documentos existentes
UPDATE documents 
SET processing_status = 'UPLOAD_COMPLETE' 
WHERE processing_status IS NULL OR processing_status = '';

-- Permitir que status sea nullable (verificar si es necesario)
SET @sql = (SELECT IF(
    (SELECT IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_NAME = 'documents' 
     AND COLUMN_NAME = 'status'
     AND TABLE_SCHEMA = DATABASE()) = 'NO',
    'ALTER TABLE documents ALTER COLUMN status DROP NOT NULL',
    'SELECT ''Column status is already nullable'' as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar resultado final
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE, 
    COLUMN_DEFAULT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'documents' 
AND TABLE_SCHEMA = DATABASE()
AND COLUMN_NAME IN ('processing_status', 'error_message', 'status')
ORDER BY COLUMN_NAME;
