-- Deshabilitar verificación de foreign keys
SET FOREIGN_KEY_CHECKS = 0;

-- Eliminar tablas en orden
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS experiencias;
DROP TABLE IF EXISTS education;
DROP TABLE IF EXISTS educacion;
DROP TABLE IF EXISTS habilidades;
DROP TABLE IF EXISTS contests;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS user_entity;
DROP TABLE IF EXISTS users;
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

-- Habilitar verificación de foreign keys
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE user_entity (
    id BINARY(16) PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    dni VARCHAR(255) UNIQUE NOT NULL,
    cuit VARCHAR(255) UNIQUE,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    telefono VARCHAR(255),
    direccion VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE roles (
    id BINARY(16) PRIMARY KEY,
    name ENUM('ROLE_USER', 'ROLE_ADMIN') NOT NULL
);

-- Tabla de experiencia para almacenar experiencias laborales
CREATE TABLE experiencia (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    empresa VARCHAR(255) NOT NULL,
    cargo VARCHAR(255) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    descripcion TEXT,
    comentario TEXT,
    user_id BINARY(16) NOT NULL,
    CONSTRAINT fk_experiencia_user FOREIGN KEY (user_id) REFERENCES user_entity(id) ON DELETE CASCADE
);

-- Crear índice para búsqueda rápida por usuario
CREATE INDEX idx_experiencia_user_id ON experiencia(user_id);

CREATE TABLE contests (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    department VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    status ENUM('DRAFT', 'ACTIVE', 'IN_PROGRESS', 'CLOSED', 'CANCELLED') NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    CONSTRAINT check_dates CHECK (end_date >= start_date)
);

CREATE TABLE examinations (
    id BINARY(16) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    duration_minutes BIGINT,
    status ENUM('DRAFT', 'PUBLISHED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED') NOT NULL,
    start_time DATETIME,
    end_time DATETIME,
    cancellation_date DATETIME,
    cancellation_reason VARCHAR(255),
    type ENUM('TECHNICAL_LEGAL', 'TECHNICAL_ADMINISTRATIVE', 'PSYCHOLOGICAL') NOT NULL,
    answers TEXT
);

CREATE TABLE examination_sessions (
    id BINARY(16) PRIMARY KEY,
    examination_id BINARY(16) NOT NULL,
    user_id BINARY(16) NOT NULL,
    start_time DATETIME(6),
    deadline DATETIME(6),
    status ENUM('CREATED', 'IN_PROGRESS', 'PAUSED', 'FINISHED', 'INVALIDATED') NOT NULL,
    current_question_index INTEGER,
    FOREIGN KEY (examination_id) REFERENCES examinations(id),
    FOREIGN KEY (user_id) REFERENCES user_entity(id)
);

CREATE TABLE questions (
    id BINARY(16) PRIMARY KEY,
    examination_id BINARY(16),
    text VARCHAR(255),
    type ENUM('MULTIPLE_CHOICE', 'SINGLE_CHOICE', 'TEXT', 'TRUE_FALSE') NOT NULL,
    score INTEGER,
    order_number INTEGER,
    correct_answer VARCHAR(255),
    FOREIGN KEY (examination_id) REFERENCES examinations(id)
) ENGINE=InnoDB;

CREATE TABLE options (
    id BINARY(16) PRIMARY KEY,
    text TEXT,
    order_number INTEGER,
    question_id BINARY(16),
    FOREIGN KEY (question_id) REFERENCES questions(id)
) ENGINE=InnoDB;

CREATE TABLE answers (
    id BINARY(16) PRIMARY KEY,
    question_id BINARY(16),
    response TEXT,
    response_time_ms BIGINT,
    status ENUM('DRAFT', 'SUBMITTED', 'VALIDATED', 'INVALIDATED', 'SUSPICIOUS'),
    timestamp DATETIME(6),
    session_id BINARY(16),
    attempts INTEGER,
    hash VARCHAR(255),
    FOREIGN KEY (question_id) REFERENCES questions(id),
    FOREIGN KEY (session_id) REFERENCES examination_sessions(id)
);

CREATE TABLE user_roles (
    user_id BINARY(16),
    role_id BINARY(16),
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES user_entity(id),
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

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
    contest_id BIGINT,
    created_at DATETIME(6),
    inscription_date DATETIME(6),
    status ENUM('ACTIVE', 'CANCELLED', 'PENDING'),
    user_id BINARY(16),
    PRIMARY KEY (id)
) ENGINE=InnoDB;

CREATE TABLE question_correct_answers (
    question_entity_id BINARY(16) NOT NULL,
    correct_answers VARCHAR(255),
    FOREIGN KEY (question_entity_id) REFERENCES questions(id)
) ENGINE=InnoDB;

CREATE TABLE examination_requirements (
    examination_id BINARY(16) NOT NULL,
    requirement TEXT NOT NULL,
    FOREIGN KEY (examination_id) REFERENCES examinations(id)
);

CREATE TABLE examination_rules (
    examination_id BINARY(16) NOT NULL,
    rule TEXT NOT NULL,
    FOREIGN KEY (examination_id) REFERENCES examinations(id)
);

CREATE TABLE examination_allowed_materials (
    examination_id BINARY(16) NOT NULL,
    material TEXT NOT NULL,
    FOREIGN KEY (examination_id) REFERENCES examinations(id)
);

CREATE TABLE examination_security_violations (
    examination_id BINARY(16) NOT NULL,
    violation VARCHAR(255) NOT NULL,
    FOREIGN KEY (examination_id) REFERENCES examinations(id)
);

-- Tabla de tipos de documento
CREATE TABLE document_types (
    id BINARY(16) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    required BOOLEAN NOT NULL DEFAULT FALSE,
    `order` INT
);

-- Tabla de documentos
CREATE TABLE documents (
    id BINARY(16) PRIMARY KEY,
    user_id BINARY(16) NOT NULL,
    document_type_id BINARY(16) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    comments TEXT,
    upload_date DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user_entity(id),
    FOREIGN KEY (document_type_id) REFERENCES document_types(id)
);

-- Tabla de educación
CREATE TABLE education (
    id BINARY(16) PRIMARY KEY,
    user_id BINARY(16) NOT NULL,
    type VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    institution VARCHAR(255) NOT NULL,
    issue_date DATE,
    document_url VARCHAR(500),
    
    -- Campos para Carreras de Nivel Superior y Grado
    duration_years INT,
    average DOUBLE,
    
    -- Campos para Posgrados
    thesis_topic VARCHAR(255),
    
    -- Campos para Diplomaturas y Cursos de Capacitación
    hourly_load INT,
    had_final_evaluation BOOLEAN,
    
    -- Campos para Actividad Científica
    activity_type VARCHAR(50),
    topic VARCHAR(255),
    activity_role VARCHAR(100),
    exposition_place_date VARCHAR(255),
    comments TEXT,
    
    FOREIGN KEY (user_id) REFERENCES user_entity(id)
);


