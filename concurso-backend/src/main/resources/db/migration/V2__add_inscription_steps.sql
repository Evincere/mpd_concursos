-- Agregar nuevas columnas a la tabla inscriptions
ALTER TABLE inscriptions
    ADD COLUMN updated_at TIMESTAMP,
    ADD COLUMN current_step VARCHAR(50),
    ADD COLUMN accepted_terms BOOLEAN DEFAULT FALSE,
    ADD COLUMN confirmed_personal_data BOOLEAN DEFAULT FALSE,
    ADD COLUMN terms_acceptance_date TIMESTAMP,
    ADD COLUMN data_confirmation_date TIMESTAMP;

-- Crear tabla para las circunscripciones seleccionadas
CREATE TABLE inscription_circunscripciones (
    inscription_id BINARY(16) NOT NULL,
    circunscripcion VARCHAR(100) NOT NULL,
    PRIMARY KEY (inscription_id, circunscripcion),
    FOREIGN KEY (inscription_id) REFERENCES inscriptions(id)
);

-- Actualizar registros existentes
UPDATE inscriptions 
SET current_step = 'INITIAL',
    updated_at = created_at
WHERE current_step IS NULL; 