-- Script para asignar el rol ROLE_USER a todos los usuarios que no tienen roles
-- Este script asume que la tabla de roles se llama 'roles', la tabla de usuarios 'user_entity' y la tabla de relación 'user_roles'

-- Asignar ROLE_USER a todos los usuarios sin roles
INSERT INTO user_roles (user_id, role_id)
SELECT user_entity.id, roles.id
FROM user_entity
CROSS JOIN roles
WHERE roles.name = 'ROLE_USER'
AND NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = user_entity.id
);

-- Mostrar cuántos usuarios se actualizaron
SELECT 'Usuarios actualizados con ROLE_USER' as Mensaje, COUNT(*) as Cantidad
FROM user_entity
WHERE EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = user_entity.id
); 