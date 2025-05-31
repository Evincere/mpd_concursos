-- Añadir columna status a la tabla user_entity
ALTER TABLE user_entity
ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';

-- Actualizar los usuarios existentes para establecer el estado correcto
-- Por defecto, todos los usuarios se establecen como ACTIVE
UPDATE user_entity SET status = 'ACTIVE';

-- Asegurarse de que los usuarios de prueba tengan el estado correcto
-- Estos IDs deben coincidir con los usuarios de prueba en data.sql
UPDATE user_entity SET status = 'ACTIVE' WHERE id = UUID_TO_BIN('44444444-4444-4444-4444-444444444444');
UPDATE user_entity SET status = 'ACTIVE' WHERE id = UUID_TO_BIN('55555555-5555-5555-5555-555555555555');
UPDATE user_entity SET status = 'ACTIVE' WHERE id = UUID_TO_BIN('66666666-6666-6666-6666-666666666666');
UPDATE user_entity SET status = 'ACTIVE' WHERE id = UUID_TO_BIN('cb08a8ed-1a78-416b-a997-debfbb28b36d'); -- superadmin
