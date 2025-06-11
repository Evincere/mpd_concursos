-- Script completo para crear TODAS las tablas faltantes
-- Ejecutar este script si el schema.sql automático no funciona

USE mpd_concursos;

-- Deshabilitar verificación de foreign keys temporalmente
SET FOREIGN_KEY_CHECKS = 0;

-- Crear tabla experience (CRÍTICA - faltante)
CREATE TABLE IF NOT EXISTS experience (
    id BINARY(16) PRIMARY KEY,
    userId BINARY(16) NOT NULL,
    company VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    startDate DATE NOT NULL,
    endDate DATE,
    description TEXT,
    comments TEXT,
    documentUrl VARCHAR(255),
    CONSTRAINT fk_experience_user FOREIGN KEY (userId) REFERENCES user_entity(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Crear índice para experience
CREATE INDEX IF NOT EXISTS idx_experience_user_id ON experience(userId);

-- Crear tabla experiencia (antigua, por compatibilidad)
CREATE TABLE IF NOT EXISTS experiencia (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    empresa VARCHAR(255) NOT NULL,
    cargo VARCHAR(255) NOT NULL,
    fechaInicio DATE NOT NULL,
    fechaFin DATE,
    descripcion TEXT,
    comentario TEXT,
    userId BINARY(16) NOT NULL,
    CONSTRAINT fk_experiencia_user FOREIGN KEY (userId) REFERENCES user_entity(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Crear índice para experiencia
CREATE INDEX IF NOT EXISTS idx_experiencia_user_id ON experiencia(userId);

-- Crear tabla examinations si no existe
CREATE TABLE IF NOT EXISTS examinations (
    id BINARY(16) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    durationMinutes BIGINT,
    status ENUM('DRAFT', 'PUBLISHED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED') NOT NULL,
    startTime DATETIME,
    endTime DATETIME,
    cancellationDate DATETIME,
    cancellationReason VARCHAR(255),
    type ENUM('TECHNICAL_LEGAL', 'TECHNICAL_ADMINISTRATIVE', 'PSYCHOLOGICAL') NOT NULL,
    answers TEXT
) ENGINE=InnoDB;

-- Crear tabla examination_sessions si no existe
CREATE TABLE IF NOT EXISTS examination_sessions (
    id BINARY(16) PRIMARY KEY,
    examinationId BINARY(16) NOT NULL,
    userId BINARY(16) NOT NULL,
    startTime DATETIME(6),
    deadline DATETIME(6),
    status ENUM('CREATED', 'IN_PROGRESS', 'PAUSED', 'FINISHED', 'INVALIDATED') NOT NULL,
    currentQuestionIndex INTEGER,
    FOREIGN KEY (examinationId) REFERENCES examinations(id),
    FOREIGN KEY (userId) REFERENCES user_entity(id)
) ENGINE=InnoDB;

-- Crear tabla questions si no existe
CREATE TABLE IF NOT EXISTS questions (
    id BINARY(16) PRIMARY KEY,
    examinationId BINARY(16),
    text VARCHAR(255),
    type ENUM('MULTIPLE_CHOICE', 'SINGLE_CHOICE', 'TEXT', 'TRUE_FALSE') NOT NULL,
    score INTEGER,
    orderNumber INTEGER,
    correctAnswer VARCHAR(255),
    FOREIGN KEY (examinationId) REFERENCES examinations(id)
) ENGINE=InnoDB;

-- Crear tabla options si no existe
CREATE TABLE IF NOT EXISTS options (
    id BINARY(16) PRIMARY KEY,
    text TEXT,
    orderNumber INTEGER,
    questionId BINARY(16),
    FOREIGN KEY (questionId) REFERENCES questions(id)
) ENGINE=InnoDB;

-- Crear tabla answers si no existe
CREATE TABLE IF NOT EXISTS answers (
    id BINARY(16) PRIMARY KEY,
    questionId BINARY(16),
    response TEXT,
    responseTimeMs BIGINT,
    status ENUM('DRAFT', 'SUBMITTED', 'VALIDATED', 'INVALIDATED', 'SUSPICIOUS'),
    timestamp DATETIME(6),
    sessionId BINARY(16),
    attempts INTEGER,
    hash VARCHAR(255),
    FOREIGN KEY (questionId) REFERENCES questions(id),
    FOREIGN KEY (sessionId) REFERENCES examination_sessions(id)
) ENGINE=InnoDB;

-- Crear tabla contest_documents si no existe
CREATE TABLE IF NOT EXISTS contest_documents (
    id BINARY(16) NOT NULL,
    contestId BIGINT,
    name VARCHAR(255),
    description TEXT,
    fileUrl VARCHAR(500),
    fileName VARCHAR(255),
    fileType VARCHAR(100),
    fileSize BIGINT,
    required BOOLEAN DEFAULT FALSE,
    public BOOLEAN DEFAULT FALSE,
    uploadedBy BINARY(16),
    uploadedAt DATETIME(6),
    PRIMARY KEY (id),
    FOREIGN KEY (contestId) REFERENCES contests(id),
    FOREIGN KEY (uploadedBy) REFERENCES user_entity(id)
) ENGINE=InnoDB;

-- Crear tablas de exámenes adicionales
CREATE TABLE IF NOT EXISTS question_correct_answers (
    questionEntityId BINARY(16) NOT NULL,
    correctAnswers VARCHAR(255),
    FOREIGN KEY (questionEntityId) REFERENCES questions(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS examination_requirements (
    examinationId BINARY(16) NOT NULL,
    requirement TEXT NOT NULL,
    FOREIGN KEY (examinationId) REFERENCES examinations(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS examination_rules (
    examinationId BINARY(16) NOT NULL,
    rule TEXT NOT NULL,
    FOREIGN KEY (examinationId) REFERENCES examinations(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS examination_allowed_materials (
    examinationId BINARY(16) NOT NULL,
    material TEXT NOT NULL,
    FOREIGN KEY (examinationId) REFERENCES examinations(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS examination_security_violations (
    examinationId BINARY(16) NOT NULL,
    violation VARCHAR(255) NOT NULL,
    FOREIGN KEY (examinationId) REFERENCES examinations(id)
) ENGINE=InnoDB;

-- Habilitar verificación de foreign keys
SET FOREIGN_KEY_CHECKS = 1;

-- Verificar que las tablas se crearon correctamente
SELECT 'Todas las tablas faltantes creadas exitosamente' AS resultado;
SHOW TABLES;
SELECT COUNT(*) AS total_tablas FROM information_schema.tables WHERE table_schema = 'mpd_concursos';
