-- Deshabilitar verificación de foreign keys
SET FOREIGN_KEY_CHECKS = 0;

-- Eliminar tablas en orden
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS experiencias;
DROP TABLE IF EXISTS experience;
DROP TABLE IF EXISTS education;
DROP TABLE IF EXISTS educacion;
DROP TABLE IF EXISTS habilidades;
DROP TABLE IF EXISTS contests;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS user_entity;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS inscription_circunscripciones;
DROP TABLE IF EXISTS inscription_sessions;
DROP TABLE IF EXISTS inscriptions;
DROP TABLE IF EXISTS options;
DROP TABLE IF EXISTS answers;
DROP TABLE IF EXISTS examination_sessions;
DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS examinations;
DROP TABLE IF EXISTS question_correct_answers;
DROP TABLE IF EXISTS examination_requirements;
DROP TABLE IF EXISTS examination_rules;
DROP TABLE IF EXISTS examination_allowed_materials;
DROP TABLE IF EXISTS examination_security_violations;
DROP TABLE IF EXISTS documents;
DROP TABLE IF EXISTS document_types;
DROP TABLE IF EXISTS contest_requirements;
DROP TABLE IF EXISTS contest_dates;

-- Habilitar verificación de foreign keys
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE user_entity (
    id BINARY(16) PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    dni VARCHAR(255) UNIQUE NOT NULL,
    cuit VARCHAR(255) UNIQUE,
    firstName VARCHAR(255) NOT NULL,
    lastName VARCHAR(255) NOT NULL,
    birthDate DATE,
    country VARCHAR(255),
    province VARCHAR(255),
    municipality VARCHAR(255),
    legalAddress VARCHAR(255),
    residentialAddress VARCHAR(255),
    telefono VARCHAR(255),
    direccion VARCHAR(255),
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('ACTIVE', 'INACTIVE', 'BLOCKED') NOT NULL DEFAULT 'ACTIVE',
    version BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE roles (
    id BINARY(16) PRIMARY KEY,
    name ENUM('ROLE_USER', 'ROLE_ADMIN') NOT NULL
);

-- Tabla de relación user_roles (CRÍTICA - FALTABA)
CREATE TABLE user_roles (
    userId BINARY(16) NOT NULL,
    roleId BINARY(16) NOT NULL,
    PRIMARY KEY (userId, roleId),
    FOREIGN KEY (userId) REFERENCES user_entity(id) ON DELETE CASCADE,
    FOREIGN KEY (roleId) REFERENCES roles(id) ON DELETE CASCADE
);

-- Tabla antigua de experiencia (por compatibilidad)
CREATE TABLE experiencia (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    empresa VARCHAR(255) NOT NULL,
    cargo VARCHAR(255) NOT NULL,
    fechaInicio DATE NOT NULL,
    fechaFin DATE,
    descripcion TEXT,
    comentario TEXT,
    userId BINARY(16) NOT NULL,
    CONSTRAINT fk_experiencia_user FOREIGN KEY (userId) REFERENCES user_entity(id) ON DELETE CASCADE
);

-- Índice para búsqueda rápida por usuario en tabla antigua
CREATE INDEX idx_experiencia_user_id ON experiencia(userId);

-- Nueva tabla de experiencia con UUID como clave primaria
CREATE TABLE experience (
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
);

-- Índice para búsqueda rápida por usuario en nueva tabla
CREATE INDEX idx_experience_user_id ON experience(userId);

CREATE TABLE contests (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255),
    category VARCHAR(255),
    class_ VARCHAR(255),
    functions TEXT,
    department VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    status ENUM('DRAFT', 'PUBLISHED', 'PAUSED', 'CANCELLED', 'FINISHED', 'ARCHIVED', 'INSCRIPTION_PENDING', 'INSCRIPTION_OPEN', 'INSCRIPTION_CLOSED', 'IN_EVALUATION', 'RESULTS_PUBLISHED') NOT NULL,
    startDate DATE NOT NULL,
    endDate DATE NOT NULL,
    basesUrl VARCHAR(255),
    descriptionUrl VARCHAR(255),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT check_dates CHECK (endDate >= startDate)
);

CREATE TABLE contest_dates (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    contestId BIGINT NOT NULL,
    label VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    startDate DATE NOT NULL,
    endDate DATE NOT NULL,
    FOREIGN KEY (contestId) REFERENCES contests(id) ON DELETE CASCADE
);

CREATE TABLE contest_requirements (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    contestId BIGINT NOT NULL,
    description VARCHAR(500) NOT NULL,
    category VARCHAR(100) NOT NULL,
    required BOOLEAN NOT NULL DEFAULT TRUE,
    priority INTEGER NOT NULL DEFAULT 1,
    documentType VARCHAR(100),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (contestId) REFERENCES contests(id) ON DELETE CASCADE,
    INDEX idx_contest_requirements_contest_id (contestId),
    INDEX idx_contest_requirements_category (category),
    INDEX idx_contest_requirements_priority (priority)
);

CREATE TABLE examinations (
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
);

CREATE TABLE examination_sessions (
    id BINARY(16) PRIMARY KEY,
    examinationId BINARY(16) NOT NULL,
    userId BINARY(16) NOT NULL,
    startTime DATETIME(6),
    deadline DATETIME(6),
    status ENUM('CREATED', 'IN_PROGRESS', 'PAUSED', 'FINISHED', 'INVALIDATED') NOT NULL,
    currentQuestionIndex INTEGER,
    FOREIGN KEY (examinationId) REFERENCES examinations(id),
    FOREIGN KEY (userId) REFERENCES user_entity(id)
);

CREATE TABLE questions (
    id BINARY(16) PRIMARY KEY,
    examinationId BINARY(16),
    text VARCHAR(255),
    type ENUM('MULTIPLE_CHOICE', 'SINGLE_CHOICE', 'TEXT', 'TRUE_FALSE') NOT NULL,
    score INTEGER,
    orderNumber INTEGER,
    correctAnswer VARCHAR(255),
    FOREIGN KEY (examinationId) REFERENCES examinations(id)
) ENGINE=InnoDB;

CREATE TABLE options (
    id BINARY(16) PRIMARY KEY,
    text TEXT,
    orderNumber INTEGER,
    questionId BINARY(16),
    FOREIGN KEY (questionId) REFERENCES questions(id)
) ENGINE=InnoDB;

CREATE TABLE answers (
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
);

-- DUPLICACIÓN ELIMINADA: user_roles ya está definida en líneas 65-71

CREATE TABLE notifications (
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
);

CREATE TABLE inscriptions (
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

-- Tabla de documentos de concursos
CREATE TABLE contest_documents (
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

-- Tabla de sesiones de inscripción
CREATE TABLE inscription_sessions (
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

CREATE TABLE inscription_circunscripciones (
    inscriptionId BINARY(16) NOT NULL,
    circunscripcion VARCHAR(100) NOT NULL,
    PRIMARY KEY (inscriptionId, circunscripcion),
    FOREIGN KEY (inscriptionId) REFERENCES inscriptions(id)
) ENGINE=InnoDB;

CREATE TABLE question_correct_answers (
    questionEntityId BINARY(16) NOT NULL,
    correctAnswers VARCHAR(255),
    FOREIGN KEY (questionEntityId) REFERENCES questions(id)
) ENGINE=InnoDB;

CREATE TABLE examination_requirements (
    examinationId BINARY(16) NOT NULL,
    requirement TEXT NOT NULL,
    FOREIGN KEY (examinationId) REFERENCES examinations(id)
);

CREATE TABLE examination_rules (
    examinationId BINARY(16) NOT NULL,
    rule TEXT NOT NULL,
    FOREIGN KEY (examinationId) REFERENCES examinations(id)
);

CREATE TABLE examination_allowed_materials (
    examinationId BINARY(16) NOT NULL,
    material TEXT NOT NULL,
    FOREIGN KEY (examinationId) REFERENCES examinations(id)
);

CREATE TABLE examination_security_violations (
    examinationId BINARY(16) NOT NULL,
    violation VARCHAR(255) NOT NULL,
    FOREIGN KEY (examinationId) REFERENCES examinations(id)
);

-- Tabla de tipos de documento
CREATE TABLE document_types (
    id BINARY(16) PRIMARY KEY,
    code VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    required BOOLEAN NOT NULL DEFAULT FALSE,
    `order` INT,
    parentId BINARY(16),
    isActive BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (parentId) REFERENCES document_types(id)
);

-- Tabla de documentos
CREATE TABLE documents (
    id BINARY(16) PRIMARY KEY,
    userId BINARY(16) NOT NULL,
    documentTypeId BINARY(16) NOT NULL,
    fileName VARCHAR(255) NOT NULL,
    contentType VARCHAR(100) NOT NULL,
    filePath VARCHAR(500) NOT NULL,
    status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    comments TEXT,
    uploadDate DATETIME NOT NULL,
    validatedBy BINARY(16),
    validatedAt DATETIME,
    rejectionReason TEXT,
    FOREIGN KEY (userId) REFERENCES user_entity(id),
    FOREIGN KEY (documentTypeId) REFERENCES document_types(id),
    FOREIGN KEY (validatedBy) REFERENCES user_entity(id)
);

-- Tabla de educación
CREATE TABLE education (
    id BINARY(16) PRIMARY KEY,
    userId BINARY(16) NOT NULL,
    type VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    institution VARCHAR(255) NOT NULL,
    issueDate DATE,
    documentUrl VARCHAR(500),

    -- Campos para Carreras de Nivel Superior y Grado
    durationYears INT,
    average DOUBLE,

    -- Campos para Posgrados
    thesisTopic VARCHAR(255),

    -- Campos para Diplomaturas y Cursos de Capacitación
    hourlyLoad INT,
    hadFinalEvaluation BOOLEAN,

    -- Campos para Actividad Científica
    activityType VARCHAR(50),
    topic VARCHAR(255),
    activityRole VARCHAR(100),
    expositionPlaceDate VARCHAR(255),
    comments TEXT,

    FOREIGN KEY (userId) REFERENCES user_entity(id)
);


