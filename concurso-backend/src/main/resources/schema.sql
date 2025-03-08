-- Deshabilitar verificación de foreign keys
SET FOREIGN_KEY_CHECKS = 0;

-- Eliminar tablas en orden
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS experiencias;
DROP TABLE IF EXISTS educacion;
DROP TABLE IF EXISTS habilidades;
DROP TABLE IF EXISTS contests;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS user_entity;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS inscriptions;
DROP TABLE IF EXISTS question_options;
DROP TABLE IF EXISTS answers;
DROP TABLE IF EXISTS examination_sessions;
DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS examinations;
DROP TABLE IF EXISTS question_correct_answers;

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
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE roles (
    id BINARY(16) PRIMARY KEY,
    name ENUM('ROLE_USER', 'ROLE_ADMIN') NOT NULL
);

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
    type ENUM('MULTIPLE_CHOICE', 'WRITTEN', 'ORAL', 'MIXED') NOT NULL,
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

CREATE TABLE question_options (
    id BINARY(16) NOT NULL,
    question_id BINARY(16),
    text TEXT,
    is_correct BIT,
    PRIMARY KEY (id),
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


