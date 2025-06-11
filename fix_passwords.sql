-- Script para limpiar completamente la base de datos y eliminar tablas legacy
USE mpd_concursos;

-- PASO 1: Deshabilitar verificación de foreign keys temporalmente
SET FOREIGN_KEY_CHECKS = 0;

-- PASO 2: Eliminar todas las tablas legacy que están causando problemas
-- Primero eliminar tablas que dependen de otras
DROP TABLE IF EXISTS contest_documents;
DROP TABLE IF EXISTS experiencia;
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS options;
DROP TABLE IF EXISTS question_options;
DROP TABLE IF EXISTS question_correct_answers;
DROP TABLE IF EXISTS inscription_circunscripciones;
DROP TABLE IF EXISTS inscription_notes;
DROP TABLE IF EXISTS inscription_sessions;
DROP TABLE IF EXISTS examination_allowed_materials;
DROP TABLE IF EXISTS examination_requirements;
DROP TABLE IF EXISTS examination_rules;
DROP TABLE IF EXISTS examination_security_violations;
DROP TABLE IF EXISTS examination_sessions;
DROP TABLE IF EXISTS contest_dates;
DROP TABLE IF EXISTS contest_requirements;
DROP TABLE IF EXISTS answers;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS education;
DROP TABLE IF EXISTS experience;

-- PASO 3: Eliminar tablas principales si existen
DROP TABLE IF EXISTS inscriptions;
DROP TABLE IF EXISTS documents;
DROP TABLE IF EXISTS document_types;
DROP TABLE IF EXISTS examinations;
DROP TABLE IF EXISTS contests;
DROP TABLE IF EXISTS user_entity;
DROP TABLE IF EXISTS roles;

-- PASO 4: Rehabilitar verificación de foreign keys
SET FOREIGN_KEY_CHECKS = 1;

-- PASO 5: Verificar que no queden tablas
SELECT 'TABLAS RESTANTES DESPUÉS DE LA LIMPIEZA:' as info;
SHOW TABLES;
