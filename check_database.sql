-- Script para verificar el estado de la base de datos
USE mpd_concursos;

-- Verificar usuarios
SELECT 'USUARIOS:' as info;
SELECT username, email, password, dni, cuit FROM user_entity;

-- Verificar roles
SELECT 'ROLES:' as info;
SELECT * FROM roles;

-- Verificar user_roles
SELECT 'USER_ROLES:' as info;
SELECT * FROM user_roles;

-- Verificar si las tablas existen
SELECT 'TABLAS EXISTENTES:' as info;
SHOW TABLES;
