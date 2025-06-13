-- Script para crear usuarios iniciales
-- Contraseñas BCrypt generadas:
-- admin123 -> $2a$10$N.zmdr9k7uOCQb07YxWe.OFVdnI5iJlpQq0uP7oOqRqrJbLdHWKwi
-- test123  -> $2a$10$EblZqNptyYdGzP6.fwR.OOAQjYXlI5koEqX.fEGfxETaaa53Q4B4G
-- user123  -> $2a$10$DUy2WmWvdV5x4Ch5.3iOI.cqUkjdCvfmZMZs4T5Qf5OQf5OQf5OQf

-- Insertar usuario administrador
INSERT INTO user_entity (
    id,
    username,
    email,
    password,
    firstName,
    lastName,
    dni,
    cuit,
    status,
    createdAt
) VALUES (
    UNHEX(REPLACE(UUID(), '-', '')),
    'admin',
    'admin@mpd.gov.ar',
    '$2a$10$N.zmdr9k7uOCQb07YxWe.OFVdnI5iJlpQq0uP7oOqRqrJbLdHWKwi',
    'Administrador',
    'Sistema',
    '12345678',
    '20123456789',
    'ACTIVE',
    NOW()
);

-- Insertar usuario de prueba
INSERT INTO user_entity (
    id,
    username,
    email,
    password,
    firstName,
    lastName,
    dni,
    cuit,
    status,
    createdAt
) VALUES (
    UNHEX(REPLACE(UUID(), '-', '')),
    'test',
    'test@example.com',
    '$2a$10$EblZqNptyYdGzP6.fwR.OOAQjYXlI5koEqX.fEGfxETaaa53Q4B4G',
    'Usuario',
    'Prueba',
    '87654321',
    '20876543210',
    'ACTIVE',
    NOW()
);

-- Asignar rol ADMIN al usuario admin
INSERT INTO user_roles (userId, roleId)
SELECT u.id, r.id
FROM user_entity u, roles r
WHERE u.username = 'admin' AND r.name = 'ROLE_ADMIN';

-- Asignar rol USER al usuario test
INSERT INTO user_roles (userId, roleId)
SELECT u.id, r.id
FROM user_entity u, roles r
WHERE u.username = 'test' AND r.name = 'ROLE_USER';
