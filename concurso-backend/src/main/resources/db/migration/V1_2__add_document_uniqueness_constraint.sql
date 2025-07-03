-- Migración para agregar constraint de unicidad y tabla de auditoría
-- Evita múltiples documentos del mismo tipo por usuario

-- 1. Crear tabla de auditoría para documentos
CREATE TABLE document_audit (
    id BINARY(16) PRIMARY KEY,
    document_id BINARY(16) NOT NULL,
    user_id BINARY(16) NOT NULL,
    action_type ENUM('CREATED', 'UPDATED', 'DELETED', 'REPLACED') NOT NULL,
    old_file_path VARCHAR(500),
    new_file_path VARCHAR(500),
    action_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    action_by BINARY(16),
    reason TEXT,
    metadata JSON,
    INDEX idx_document_audit_document_id (document_id),
    INDEX idx_document_audit_user_id (user_id),
    INDEX idx_document_audit_action_date (action_date)
);

-- 2. Agregar columna para marcar documentos como archivados
ALTER TABLE documents 
ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT FALSE;

-- 3. Agregar columna para referenciar documento reemplazado
ALTER TABLE documents 
ADD COLUMN replaced_document_id BINARY(16),
ADD FOREIGN KEY (replaced_document_id) REFERENCES documents(id);

-- 4. Crear índice único compuesto para evitar duplicados activos
-- Solo permite un documento activo (no archivado) por usuario y tipo
CREATE UNIQUE INDEX idx_unique_active_document 
ON documents (user_id, document_type_id, is_archived) 
WHERE is_archived = FALSE;

-- 5. Agregar columna de versión para control de concurrencia
ALTER TABLE documents 
ADD COLUMN version INT NOT NULL DEFAULT 1;

-- 6. Crear función para archivar documento anterior
DELIMITER //
CREATE PROCEDURE ArchiveExistingDocument(
    IN p_user_id BINARY(16),
    IN p_document_type_id BINARY(16),
    IN p_new_document_id BINARY(16),
    IN p_action_by BINARY(16)
)
BEGIN
    DECLARE v_existing_id BINARY(16);
    DECLARE v_existing_path VARCHAR(500);
    
    -- Buscar documento existente activo
    SELECT id, file_path INTO v_existing_id, v_existing_path
    FROM documents 
    WHERE user_id = p_user_id 
      AND document_type_id = p_document_type_id 
      AND is_archived = FALSE
    LIMIT 1;
    
    -- Si existe, archivarlo
    IF v_existing_id IS NOT NULL THEN
        -- Archivar documento anterior
        UPDATE documents 
        SET is_archived = TRUE,
            replaced_document_id = p_new_document_id
        WHERE id = v_existing_id;
        
        -- Registrar en auditoría
        INSERT INTO document_audit (
            id, document_id, user_id, action_type, 
            old_file_path, action_by, reason
        ) VALUES (
            UUID(), v_existing_id, p_user_id, 'REPLACED',
            v_existing_path, p_action_by, 'Documento reemplazado por nueva versión'
        );
    END IF;
END //
DELIMITER ;

-- 7. Comentarios para documentación
COMMENT ON TABLE document_audit IS 'Auditoría de cambios en documentos para trazabilidad completa';
COMMENT ON COLUMN documents.is_archived IS 'Indica si el documento está archivado (reemplazado por una nueva versión)';
COMMENT ON COLUMN documents.replaced_document_id IS 'ID del documento que reemplaza a este (si está archivado)';
COMMENT ON COLUMN documents.version IS 'Versión del documento para control de concurrencia optimista';
