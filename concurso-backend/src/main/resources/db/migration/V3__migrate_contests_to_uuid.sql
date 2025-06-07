-- V3__migrate_contests_to_uuid.sql
-- Migración de contests table de BIGINT ID a UUID (BINARY(16))

-- Paso 1: Crear tabla temporal para mapeo de IDs
CREATE TABLE contest_id_mapping (
    old_id BIGINT NOT NULL,
    new_id BINARY(16) NOT NULL,
    PRIMARY KEY (old_id),
    UNIQUE KEY uk_new_id (new_id)
);

-- Paso 2: Generar UUIDs determinísticos para cada contest existente
INSERT INTO contest_id_mapping (old_id, new_id)
SELECT 
    id as old_id,
    UNHEX(REPLACE(UUID(), '-', '')) as new_id
FROM contests;

-- Paso 3: Crear nueva tabla contests con UUID
CREATE TABLE contests_new (
    id BINARY(16) PRIMARY KEY,
    title VARCHAR(255),
    category VARCHAR(255),
    class_ VARCHAR(255),
    functions TEXT,
    department VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    status ENUM('DRAFT', 'PUBLISHED', 'INSCRIPTION_PENDING', 'INSCRIPTION_OPEN', 'INSCRIPTION_CLOSED', 'IN_EVALUATION', 'RESULTS_PUBLISHED', 'CANCELLED') NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    bases_url VARCHAR(255),
    description_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT check_dates CHECK (end_date >= start_date)
);

-- Paso 4: Migrar datos de contests a contests_new
INSERT INTO contests_new (
    id, title, category, class_, functions, department, position, 
    status, start_date, end_date, bases_url, description_url
)
SELECT 
    cim.new_id,
    c.title,
    c.category,
    c.class_,
    c.functions,
    c.department,
    c.position,
    CASE 
        WHEN c.status = 'ACTIVE' THEN 'INSCRIPTION_OPEN'
        WHEN c.status = 'CLOSED' THEN 'INSCRIPTION_CLOSED'
        WHEN c.status = 'IN_PROGRESS' THEN 'IN_EVALUATION'
        ELSE c.status
    END as status,
    c.start_date,
    c.end_date,
    c.bases_url,
    c.description_url
FROM contests c
JOIN contest_id_mapping cim ON c.id = cim.old_id;

-- Paso 5: Crear nueva tabla contest_dates con UUID foreign key
CREATE TABLE contest_dates_new (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    contest_id BINARY(16) NOT NULL,
    date_type VARCHAR(50) NOT NULL,
    date_value DATE NOT NULL,
    description VARCHAR(255),
    FOREIGN KEY (contest_id) REFERENCES contests_new(id) ON DELETE CASCADE
);

-- Paso 6: Migrar datos de contest_dates si existe
INSERT INTO contest_dates_new (contest_id, date_type, date_value, description)
SELECT 
    cim.new_id,
    cd.date_type,
    cd.date_value,
    cd.description
FROM contest_dates cd
JOIN contest_id_mapping cim ON cd.contest_id = cim.old_id
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contest_dates');

-- Paso 7: Actualizar tabla inscriptions para usar UUID contest_id
-- Primero agregar nueva columna
ALTER TABLE inscriptions ADD COLUMN contest_id_new BINARY(16);

-- Actualizar con los nuevos UUIDs
UPDATE inscriptions i
JOIN contest_id_mapping cim ON i.contest_id = cim.old_id
SET i.contest_id_new = cim.new_id;

-- Verificar que todos los registros fueron actualizados
-- Si hay inscriptions sin contest_id_new, la migración falla
SET @missing_count = (SELECT COUNT(*) FROM inscriptions WHERE contest_id_new IS NULL);
SELECT CASE 
    WHEN @missing_count > 0 THEN 
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Hay inscripciones sin contest_id válido'
    ELSE 1
END;

-- Eliminar constraint de foreign key antigua
ALTER TABLE inscriptions DROP FOREIGN KEY inscriptions_ibfk_1;

-- Eliminar columna antigua y renombrar nueva
ALTER TABLE inscriptions DROP COLUMN contest_id;
ALTER TABLE inscriptions CHANGE COLUMN contest_id_new contest_id BINARY(16) NOT NULL;

-- Agregar nueva foreign key constraint
ALTER TABLE inscriptions ADD CONSTRAINT fk_inscriptions_contest 
    FOREIGN KEY (contest_id) REFERENCES contests_new(id) ON DELETE CASCADE;

-- Paso 8: Reemplazar tabla contests
DROP TABLE contests;
DROP TABLE contest_dates;
RENAME TABLE contests_new TO contests;
RENAME TABLE contest_dates_new TO contest_dates;

-- Paso 9: Limpiar tabla temporal
DROP TABLE contest_id_mapping;

-- Paso 10: Crear índices para optimizar performance
CREATE INDEX idx_contests_status ON contests(status);
CREATE INDEX idx_contests_department ON contests(department);
CREATE INDEX idx_contests_dates ON contests(start_date, end_date);
CREATE INDEX idx_contest_dates_contest_id ON contest_dates(contest_id);
