-- Script para verificar y corregir contraseñas
-- Ejecutar en MySQL para verificar usuarios actuales

USE mpd_concursos;

-- Ver usuarios actuales
SELECT username, password, email FROM user_entity;

-- Hash correcto para admin123 (generado con BCrypt online)
-- $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi

-- Actualizar contraseña del admin con hash correcto
UPDATE user_entity 
SET password = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' 
WHERE username = 'admin';

-- Verificar cambio
SELECT username, password FROM user_entity WHERE username = 'admin';
