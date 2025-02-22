DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS contests CASCADE;
DROP TABLE IF EXISTS user_entity CASCADE;

CREATE TABLE user_entity (
    id UUID PRIMARY KEY,
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
    id BIGINT PRIMARY KEY,
    department VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('DRAFT', 'ACTIVE', 'IN_PROGRESS', 'CLOSED', 'CANCELLED')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    CHECK (end_date >= start_date)
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY,
    recipient_id UUID NOT NULL,
    subject VARCHAR(200) NOT NULL,
    content VARCHAR(5000) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'SENT', 'READ', 'ACKNOWLEDGED')),
    sent_at TIMESTAMP,
    read_at TIMESTAMP,
    acknowledged_at TIMESTAMP,
    acknowledgement_level VARCHAR(50) NOT NULL DEFAULT 'NONE',
    signature_type VARCHAR(50),
    signature_value CLOB,
    signature_metadata CLOB,
    version BIGINT NOT NULL DEFAULT 0,
    type VARCHAR(20) NOT NULL CHECK (type IN ('INSCRIPTION', 'SYSTEM', 'CONTEST', 'GENERAL')),
    FOREIGN KEY (recipient_id) REFERENCES user_entity(id)
);

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    dni VARCHAR(8) UNIQUE NOT NULL,
    cuit VARCHAR(13) UNIQUE NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    telefono VARCHAR(20),
    direccion TEXT,
    created_at TIMESTAMP NOT NULL
);

-- Tabla de roles
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

-- Tabla de relación usuarios-roles
CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID REFERENCES users(id),
    role_id UUID REFERENCES roles(id),
    PRIMARY KEY (user_id, role_id)
);

-- Tabla de experiencias
CREATE TABLE IF NOT EXISTS experiencias (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    empresa VARCHAR(100) NOT NULL,
    cargo VARCHAR(100) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    descripcion TEXT
);

-- Tabla de educación
CREATE TABLE IF NOT EXISTS educacion (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    institucion VARCHAR(100) NOT NULL,
    titulo VARCHAR(100) NOT NULL,
    descripcion TEXT,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE
);

-- Tabla de habilidades
CREATE TABLE IF NOT EXISTS habilidades (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    nombre VARCHAR(100) NOT NULL,
    nivel VARCHAR(50) NOT NULL
);
