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

-- Habilitar verificación de foreign keys
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE user_entity (
    id BINARY(16) PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    dni VARCHAR(255) UNIQUE NOT NULL,
    cuit VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE contests (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    department VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    CONSTRAINT check_status CHECK (status IN ('DRAFT', 'ACTIVE', 'IN_PROGRESS', 'CLOSED', 'CANCELLED')),
    CONSTRAINT check_dates CHECK (end_date >= start_date)
);

CREATE TABLE notifications (
    id BINARY(16) PRIMARY KEY,
    recipient_id BINARY(16) NOT NULL,
    subject VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(20) NOT NULL,
    sent_at TIMESTAMP NULL,
    read_at TIMESTAMP NULL,
    acknowledged_at TIMESTAMP NULL,
    acknowledgement_level VARCHAR(50) NOT NULL DEFAULT 'NONE',
    signature_type VARCHAR(50),
    signature_value TEXT,
    signature_metadata TEXT,
    version BIGINT NOT NULL DEFAULT 0,
    type VARCHAR(20) NOT NULL,
    CONSTRAINT check_notification_status CHECK (status IN ('PENDING', 'SENT', 'READ', 'ACKNOWLEDGED')),
    CONSTRAINT check_notification_type CHECK (type IN ('INSCRIPTION', 'SYSTEM', 'CONTEST', 'GENERAL')),
    FOREIGN KEY (recipient_id) REFERENCES user_entity(id)
);

CREATE TABLE roles (
    id BINARY(16) PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE user_roles (
    user_id BINARY(16),
    role_id BINARY(16),
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES user_entity(id),
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE experiencias (
    id BINARY(16) PRIMARY KEY,
    user_id BINARY(16),
    empresa VARCHAR(100) NOT NULL,
    cargo VARCHAR(100) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    descripcion TEXT,
    FOREIGN KEY (user_id) REFERENCES user_entity(id)
);

CREATE TABLE educacion (
    id BINARY(16) PRIMARY KEY,
    user_id BINARY(16),
    institucion VARCHAR(100) NOT NULL,
    titulo VARCHAR(100) NOT NULL,
    descripcion TEXT,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    FOREIGN KEY (user_id) REFERENCES user_entity(id)
);

CREATE TABLE habilidades (
    id BINARY(16) PRIMARY KEY,
    user_id BINARY(16),
    nombre VARCHAR(100) NOT NULL,
    nivel VARCHAR(50) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user_entity(id)
);

CREATE TABLE inscriptions (
    id BINARY(16) PRIMARY KEY,
    user_id BINARY(16) NOT NULL,
    contest_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL,
    inscription_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_inscription_status CHECK (status IN ('PENDING', 'ACTIVE', 'CANCELLED')),
    FOREIGN KEY (user_id) REFERENCES user_entity(id),
    FOREIGN KEY (contest_id) REFERENCES contests(id)
);
