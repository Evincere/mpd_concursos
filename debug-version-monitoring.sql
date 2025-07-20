-- Script para monitorear cambios de version en tiempo real
-- Ejecutar en una ventana separada de MySQL Workbench o similar

-- 1. Ver estado actual de documentos
SELECT 
    id,
    user_id,
    file_name,
    version,
    is_archived,
    upload_date,
    archived_at
FROM documents 
ORDER BY upload_date DESC 
LIMIT 10;

-- 2. Monitorear inserts en tiempo real (ejecutar antes de la prueba)
-- Nota: Esto requiere configurar MySQL para logging de queries
SHOW VARIABLES LIKE 'general_log%';

-- 3. Query para ver documentos duplicados por tipo
SELECT 
    dt.name as tipo_documento,
    d.user_id,
    COUNT(*) as total_documentos,
    GROUP_CONCAT(CONCAT('ID:', d.id, ' V:', d.version, ' Arch:', d.is_archived) SEPARATOR ' | ') as detalles
FROM documents d
JOIN document_types dt ON d.document_type_id = dt.id
GROUP BY dt.name, d.user_id
HAVING COUNT(*) > 1
ORDER BY total_documentos DESC;

-- 4. Query para ver el historial de un usuario específico
-- Reemplazar 'USER_ID_AQUI' con el ID real del usuario de prueba
SELECT 
    d.id,
    dt.name as tipo_documento,
    d.version,
    d.is_archived,
    d.upload_date,
    d.archived_at,
    CASE 
        WHEN d.is_archived = 0 THEN 'ACTIVO'
        ELSE 'ARCHIVADO'
    END as estado
FROM documents d
JOIN document_types dt ON d.document_type_id = dt.id
WHERE d.user_id = 'USER_ID_AQUI'
ORDER BY dt.name, d.upload_date DESC;

-- 5. Trigger temporal para logging (SOLO PARA DEBUGGING)
DELIMITER $$
CREATE TRIGGER debug_document_insert 
AFTER INSERT ON documents
FOR EACH ROW
BEGIN
    INSERT INTO debug_log (message, created_at) 
    VALUES (
        CONCAT('INSERT - ID:', NEW.id, ' Version:', NEW.version, ' Archived:', NEW.is_archived),
        NOW()
    );
END$$

CREATE TRIGGER debug_document_update 
AFTER UPDATE ON documents
FOR EACH ROW
BEGIN
    INSERT INTO debug_log (message, created_at) 
    VALUES (
        CONCAT('UPDATE - ID:', NEW.id, ' Version OLD:', OLD.version, ' NEW:', NEW.version, ' Archived:', NEW.is_archived),
        NOW()
    );
END$$
DELIMITER ;

-- Crear tabla de debug si no existe
CREATE TABLE IF NOT EXISTS debug_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
