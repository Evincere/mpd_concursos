-- MIGRACIÓN OPTIMIZADA PARA RESOLVER PROBLEMAS DE HIBERNATE
-- Ejecutar en MySQL Workbench antes de iniciar el backend

USE mpd_concursos;

-- PASO 1: Deshabilitar foreign key checks
SET FOREIGN_KEY_CHECKS = 0;

-- PASO 2: Eliminar TODAS las tablas en orden específico
-- Primero tablas dependientes (con foreign keys)
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS inscription_circunscripciones;
DROP TABLE IF EXISTS question_correct_answers;
DROP TABLE IF EXISTS question_options;
DROP TABLE IF EXISTS examination_security_violations;
DROP TABLE IF EXISTS examination_requirements;
DROP TABLE IF EXISTS examination_rules;
DROP TABLE IF EXISTS examination_allowed_materials;
DROP TABLE IF EXISTS options;
DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS examination_sessions;
DROP TABLE IF EXISTS examinations;
DROP TABLE IF EXISTS answers;
DROP TABLE IF EXISTS inscription_notes;
DROP TABLE IF EXISTS inscription_sessions;
DROP TABLE IF EXISTS inscriptions;
DROP TABLE IF EXISTS documents;
DROP TABLE IF EXISTS document_types;
DROP TABLE IF EXISTS experience;
DROP TABLE IF EXISTS education;
DROP TABLE IF EXISTS contest_dates;
DROP TABLE IF EXISTS contest_requirements;
DROP TABLE IF EXISTS contests;
DROP TABLE IF EXISTS notifications;

-- Luego tablas principales
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS user_entity;

-- PASO 3: Rehabilitar foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- PASO 4: Verificar limpieza completa
SELECT 'TABLAS RESTANTES DESPUÉS DE LA MIGRACIÓN:' as info;
SHOW TABLES;

-- PASO 5: Mensaje de confirmación
SELECT 'MIGRACIÓN COMPLETADA - REINICIAR BACKEND AHORA' as status;
