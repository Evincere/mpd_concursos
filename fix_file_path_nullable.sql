-- Migración para permitir que filePath sea nullable durante el procesamiento en cola
-- Esto resuelve el error de validación cuando se encolan documentos

USE mpd_concursos;

-- Permitir que file_path sea nullable
ALTER TABLE documents 
MODIFY COLUMN file_path VARCHAR(500) NULL;

-- Verificar el cambio
DESCRIBE documents;

-- Comentario para documentación
-- file_path puede ser NULL durante el estado UPLOADING/PROCESSING
-- Se establece cuando el procesamiento se completa exitosamente
