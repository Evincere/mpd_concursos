-- Script para limpiar completamente la base de datos
-- Elimina todas las tablas legacy que causan conflictos con Hibernate

SET FOREIGN_KEY_CHECKS = 0;

-- PASO 1: Eliminar tablas legacy que causan problemas de foreign keys
DROP TABLE IF EXISTS contest_documents;
DROP TABLE IF EXISTS experiencia;

-- PASO 2: Eliminar todas las tablas del sistema actual
DROP TABLE IF EXISTS answers;
DROP TABLE IF EXISTS contest_dates;
DROP TABLE IF EXISTS contest_requirements;
DROP TABLE IF EXISTS contests;
DROP TABLE IF EXISTS document_types;
DROP TABLE IF EXISTS documents;
DROP TABLE IF EXISTS education;
DROP TABLE IF EXISTS examination_allowed_materials;
DROP TABLE IF EXISTS examination_requirements;
DROP TABLE IF EXISTS examination_rules;
DROP TABLE IF EXISTS examination_security_violations;
DROP TABLE IF EXISTS examination_sessions;
DROP TABLE IF EXISTS examinations;
DROP TABLE IF EXISTS experience;
DROP TABLE IF EXISTS inscription_circunscripciones;
DROP TABLE IF EXISTS inscription_notes;
DROP TABLE IF EXISTS inscription_sessions;
DROP TABLE IF EXISTS inscriptions;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS options;
DROP TABLE IF EXISTS question_correct_answers;
DROP TABLE IF EXISTS question_options;
DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS user_entity;
DROP TABLE IF EXISTS user_roles;

-- PASO 3: Verificar que no queden tablas
SHOW TABLES;

SET FOREIGN_KEY_CHECKS = 1;
