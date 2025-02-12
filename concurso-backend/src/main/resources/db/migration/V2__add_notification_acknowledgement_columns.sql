ALTER TABLE notifications
    ADD COLUMN acknowledgement_level VARCHAR(50) NOT NULL DEFAULT 'NONE',
    ADD COLUMN signature_type VARCHAR(50),
    ADD COLUMN signature_value TEXT,
    ADD COLUMN signature_metadata JSON; 