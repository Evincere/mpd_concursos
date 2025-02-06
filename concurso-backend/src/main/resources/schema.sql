DROP TABLE IF EXISTS contests;

CREATE TABLE contests (
    id BIGINT PRIMARY KEY,
    department VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('DRAFT', 'ACTIVE', 'IN_PROGRESS', 'CLOSED', 'CANCELLED')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    CHECK (end_date >= start_date)
);
