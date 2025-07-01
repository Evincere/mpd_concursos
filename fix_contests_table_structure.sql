-- CORREGIR ESTRUCTURA DE LA TABLA CONTESTS
-- Ejecutar en MySQL Workbench con la base de datos mpd_concursos

USE mpd_concursos;

-- 1. Verificar estructura actual
DESCRIBE contests;

-- 2. Verificar si las columnas están en camelCase o snake_case
SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'contests' 
AND TABLE_SCHEMA = 'mpd_concursos'
AND COLUMN_NAME IN ('description_url', 'descriptionUrl', 'bases_url', 'basesUrl', 'start_date', 'startDate', 'end_date', 'endDate');

-- 3. Si las columnas están en camelCase, renombrarlas a snake_case
-- (Ejecutar solo si es necesario según el resultado anterior)

-- Renombrar descriptionUrl a description_url si existe
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_NAME = 'contests' 
     AND COLUMN_NAME = 'descriptionUrl'
     AND TABLE_SCHEMA = 'mpd_concursos') > 0,
    'ALTER TABLE contests CHANGE COLUMN descriptionUrl description_url VARCHAR(255)',
    'SELECT "Column descriptionUrl does not exist" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Renombrar basesUrl a bases_url si existe
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_NAME = 'contests' 
     AND COLUMN_NAME = 'basesUrl'
     AND TABLE_SCHEMA = 'mpd_concursos') > 0,
    'ALTER TABLE contests CHANGE COLUMN basesUrl bases_url VARCHAR(255)',
    'SELECT "Column basesUrl does not exist" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Renombrar startDate a start_date si existe
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_NAME = 'contests' 
     AND COLUMN_NAME = 'startDate'
     AND TABLE_SCHEMA = 'mpd_concursos') > 0,
    'ALTER TABLE contests CHANGE COLUMN startDate start_date DATE NOT NULL',
    'SELECT "Column startDate does not exist" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Renombrar endDate a end_date si existe
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_NAME = 'contests' 
     AND COLUMN_NAME = 'endDate'
     AND TABLE_SCHEMA = 'mpd_concursos') > 0,
    'ALTER TABLE contests CHANGE COLUMN endDate end_date DATE NOT NULL',
    'SELECT "Column endDate does not exist" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Renombrar createdAt a created_at si existe
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_NAME = 'contests' 
     AND COLUMN_NAME = 'createdAt'
     AND TABLE_SCHEMA = 'mpd_concursos') > 0,
    'ALTER TABLE contests CHANGE COLUMN createdAt created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
    'SELECT "Column createdAt does not exist" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Renombrar updatedAt a updated_at si existe
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_NAME = 'contests' 
     AND COLUMN_NAME = 'updatedAt'
     AND TABLE_SCHEMA = 'mpd_concursos') > 0,
    'ALTER TABLE contests CHANGE COLUMN updatedAt updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
    'SELECT "Column updatedAt does not exist" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. Verificar estructura final
DESCRIBE contests;

-- 5. Mostrar las columnas relevantes para confirmar
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'contests' 
AND TABLE_SCHEMA = 'mpd_concursos'
ORDER BY ORDINAL_POSITION;
