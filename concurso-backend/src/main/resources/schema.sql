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
DROP TABLE IF EXISTS examenes;
DROP TABLE IF EXISTS preguntas;
DROP TABLE IF EXISTS opciones;
DROP TABLE IF EXISTS respuestas_examen;
DROP TABLE IF EXISTS intentos_examen;

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
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,
    observaciones TEXT,
    documentacion_completa BOOLEAN DEFAULT FALSE,
    fecha_revision TIMESTAMP,
    revisado_por BINARY(16),
    CONSTRAINT check_inscription_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
    FOREIGN KEY (user_id) REFERENCES user_entity(id),
    FOREIGN KEY (contest_id) REFERENCES contests(id),
    FOREIGN KEY (revisado_por) REFERENCES user_entity(id)
);

-- Tablas para exámenes
CREATE TABLE examenes (
    id BINARY(16) PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    tipo VARCHAR(50) NOT NULL,
    estado VARCHAR(50) NOT NULL,
    duracion INT NOT NULL,
    puntaje_maximo DECIMAL(5,2) NOT NULL,
    fecha_inicio TIMESTAMP NOT NULL,
    fecha_fin TIMESTAMP,
    intentos_permitidos INT DEFAULT 1,
    intentos_realizados INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT check_estado_examen CHECK (estado IN ('BORRADOR', 'DISPONIBLE', 'EN_CURSO', 'FINALIZADO', 'ANULADO')),
    CONSTRAINT check_tipo_examen CHECK (tipo IN ('INGRESO', 'EVALUACION', 'PRACTICA'))
);

CREATE TABLE preguntas (
    id BINARY(16) PRIMARY KEY,
    examen_id BINARY(16) NOT NULL,
    texto TEXT NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    puntaje DECIMAL(5,2) NOT NULL,
    orden INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_tipo_pregunta CHECK (tipo IN ('OPCION_MULTIPLE', 'SELECCION_MULTIPLE', 'ORDENAMIENTO', 'VERDADERO_FALSO', 'DESARROLLO')),
    FOREIGN KEY (examen_id) REFERENCES examenes(id)
);

CREATE TABLE opciones (
    id BINARY(16) PRIMARY KEY,
    pregunta_id BINARY(16) NOT NULL,
    texto TEXT NOT NULL,
    es_correcta BOOLEAN DEFAULT FALSE,
    orden INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pregunta_id) REFERENCES preguntas(id)
);

CREATE TABLE respuestas_examen (
    id BINARY(16) PRIMARY KEY,
    examen_id BINARY(16) NOT NULL,
    user_id BINARY(16) NOT NULL,
    pregunta_id BINARY(16) NOT NULL,
    respuesta TEXT,
    es_correcta BOOLEAN,
    puntaje_obtenido DECIMAL(5,2),
    tiempo_respuesta INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (examen_id) REFERENCES examenes(id),
    FOREIGN KEY (user_id) REFERENCES user_entity(id),
    FOREIGN KEY (pregunta_id) REFERENCES preguntas(id)
);

CREATE TABLE intentos_examen (
    id BINARY(16) PRIMARY KEY,
    examen_id BINARY(16) NOT NULL,
    user_id BINARY(16) NOT NULL,
    estado VARCHAR(50) NOT NULL,
    fecha_inicio TIMESTAMP NOT NULL,
    fecha_fin TIMESTAMP,
    tiempo_utilizado INT,
    puntaje_total DECIMAL(5,2),
    motivo_anulacion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_estado_intento CHECK (estado IN ('EN_CURSO', 'FINALIZADO', 'ANULADO')),
    FOREIGN KEY (examen_id) REFERENCES examenes(id),
    FOREIGN KEY (user_id) REFERENCES user_entity(id)
);
