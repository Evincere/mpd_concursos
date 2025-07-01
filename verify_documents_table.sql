-- Verificar estructura de la tabla documents
DESCRIBE documents;

-- Verificar si existen las nuevas columnas
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'documents' 
AND TABLE_SCHEMA = DATABASE()
ORDER BY ORDINAL_POSITION;

-- Verificar estado de migraciones Flyway
SELECT * FROM flyway_schema_history ORDER BY installed_rank;

-- Verificar si hay documentos existentes
SELECT COUNT(*) as total_documents FROM documents;

-- Verificar tipos de documento disponibles
SELECT id, code, name FROM document_types ORDER BY name;
