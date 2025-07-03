-- Migración para agregar processing_status y error_message a la tabla documents
-- Separar estados técnicos de estados de negocio

-- Agregar nueva columna processing_status
ALTER TABLE documents 
ADD COLUMN processing_status VARCHAR(20) NOT NULL DEFAULT 'UPLOAD_COMPLETE';

-- Agregar nueva columna error_message
ALTER TABLE documents 
ADD COLUMN error_message TEXT;

-- Actualizar documentos existentes:
-- Los documentos que ya existen se consideran procesados exitosamente
UPDATE documents 
SET processing_status = 'UPLOAD_COMPLETE' 
WHERE processing_status IS NULL OR processing_status = '';

-- Permitir que status sea nullable (para documentos en procesamiento)
ALTER TABLE documents 
ALTER COLUMN status DROP NOT NULL;

-- Comentarios para documentación
COMMENT ON COLUMN documents.processing_status IS 'Estado técnico del procesamiento: UPLOADING, PROCESSING, UPLOAD_COMPLETE, UPLOAD_FAILED';
COMMENT ON COLUMN documents.status IS 'Estado de negocio para revisión administrativa: PENDING, APPROVED, REJECTED (puede ser null durante procesamiento)';
COMMENT ON COLUMN documents.error_message IS 'Mensaje de error cuando processing_status es UPLOAD_FAILED';
