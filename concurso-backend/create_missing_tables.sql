-- Script para crear las tablas faltantes: notifications e inscriptions
-- Ejecutar este script manualmente en MySQL para solucionar el problema inmediatamente

USE mpd_concursos;

-- Verificar si la tabla notifications existe, si no, crearla
CREATE TABLE IF NOT EXISTS notifications (
    id BINARY(16) PRIMARY KEY,
    recipient_id BINARY(16) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    status ENUM('PENDING', 'SENT', 'READ', 'ACKNOWLEDGED') NOT NULL,
    sent_at DATETIME(6) NOT NULL,
    read_at DATETIME(6),
    acknowledged_at DATETIME(6),
    acknowledgement_level ENUM('NONE', 'SIMPLE', 'SIGNATURE_BASIC', 'SIGNATURE_ADVANCED') NOT NULL,
    signature_type ENUM('PIN', 'BIOMETRIC', 'DIGITAL_CERT', 'DECLARATION'),
    signature_value VARCHAR(255),
    signature_metadata VARCHAR(255),
    version BIGINT,
    type ENUM('INSCRIPTION', 'SYSTEM', 'CONTEST', 'GENERAL') NOT NULL,
    FOREIGN KEY (recipient_id) REFERENCES user_entity(id)
) ENGINE=InnoDB;

-- Verificar si la tabla inscriptions existe, si no, crearla
CREATE TABLE IF NOT EXISTS inscriptions (
    id BINARY(16) NOT NULL,
    contestId BIGINT,
    userId BINARY(16),
    createdAt DATETIME(6),
    updatedAt DATETIME(6),
    inscriptionDate DATETIME(6),
    status ENUM('ACTIVE', 'PENDING', 'COMPLETED_WITH_DOCS', 'COMPLETED_PENDING_DOCS', 'FROZEN', 'APPROVED', 'REJECTED', 'CANCELLED'),
    currentStep ENUM('INITIAL', 'TERMS_ACCEPTANCE', 'LOCATION_SELECTION', 'DOCUMENTATION', 'DATA_CONFIRMATION', 'COMPLETED'),
    acceptedTerms BOOLEAN DEFAULT FALSE,
    confirmedPersonalData BOOLEAN DEFAULT FALSE,
    documentosCompletos BOOLEAN DEFAULT FALSE,
    centroDeVida VARCHAR(500),
    termsAcceptanceDate DATETIME(6),
    dataConfirmationDate DATETIME(6),
    documentationDeadline DATETIME(6),
    frozenDate DATETIME(6),
    PRIMARY KEY (id),
    FOREIGN KEY (contestId) REFERENCES contests(id),
    FOREIGN KEY (userId) REFERENCES user_entity(id)
) ENGINE=InnoDB;

-- Crear tabla de sesiones de inscripción si no existe
CREATE TABLE IF NOT EXISTS inscription_sessions (
    id BINARY(16) PRIMARY KEY,
    inscriptionId BINARY(16) NOT NULL,
    contestId BIGINT NOT NULL,
    userId BINARY(16) NOT NULL,
    currentStep ENUM('INITIAL', 'TERMS_ACCEPTANCE', 'LOCATION_SELECTION', 'DOCUMENTATION', 'DATA_CONFIRMATION', 'COMPLETED') NOT NULL,
    formData LONGTEXT NOT NULL,
    createdAt DATETIME NOT NULL,
    updatedAt DATETIME NOT NULL,
    expiresAt DATETIME NOT NULL,
    FOREIGN KEY (inscriptionId) REFERENCES inscriptions(id) ON DELETE CASCADE,
    FOREIGN KEY (contestId) REFERENCES contests(id),
    FOREIGN KEY (userId) REFERENCES user_entity(id)
) ENGINE=InnoDB;

-- Crear tabla de circunscripciones de inscripción si no existe
CREATE TABLE IF NOT EXISTS inscription_circunscripciones (
    inscriptionId BINARY(16) NOT NULL,
    circunscripcion VARCHAR(100) NOT NULL,
    PRIMARY KEY (inscriptionId, circunscripcion),
    FOREIGN KEY (inscriptionId) REFERENCES inscriptions(id)
) ENGINE=InnoDB;

-- Verificar que las tablas se crearon correctamente
SELECT 'Tablas creadas exitosamente' AS resultado;
SHOW TABLES LIKE '%notifications%';
SHOW TABLES LIKE '%inscriptions%';
