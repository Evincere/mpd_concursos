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
    FOREIGN KEY (recipient_id) REFERENCES user_entity(id)
);
