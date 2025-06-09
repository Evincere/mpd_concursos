-- Migration V3: Migrate legacy inscription states to standardized states
-- This migration updates existing data to use only standardized English states

-- Step 1: Update legacy states to standardized states
UPDATE inscriptions 
SET status = 'ACTIVE' 
WHERE status = 'IN_PROCESS';

UPDATE inscriptions 
SET status = 'PENDING' 
WHERE status IN ('PENDIENTE', 'CONFIRMADA');

UPDATE inscriptions 
SET status = 'APPROVED' 
WHERE status = 'INSCRIPTO';

-- Step 2: Handle any remaining edge cases
UPDATE inscriptions 
SET status = 'CANCELLED' 
WHERE status IN ('CANCELADA', 'CANCELADO');

UPDATE inscriptions 
SET status = 'REJECTED' 
WHERE status IN ('RECHAZADA', 'RECHAZADO');

-- Step 3: Set default state for any NULL or unknown states
UPDATE inscriptions 
SET status = 'ACTIVE' 
WHERE status IS NULL OR status NOT IN (
    'ACTIVE', 'PENDING', 'COMPLETED_WITH_DOCS', 'COMPLETED_PENDING_DOCS', 
    'FROZEN', 'APPROVED', 'REJECTED', 'CANCELLED'
);

-- Step 4: Update the ENUM to only include standardized states
-- Note: This will be done in a separate migration to ensure data integrity
-- ALTER TABLE inscriptions MODIFY COLUMN status ENUM(
--     'ACTIVE', 'PENDING', 'COMPLETED_WITH_DOCS', 'COMPLETED_PENDING_DOCS', 
--     'FROZEN', 'APPROVED', 'REJECTED', 'CANCELLED'
-- );

-- Step 5: Add indexes for better performance on status queries
CREATE INDEX IF NOT EXISTS idx_inscriptions_status ON inscriptions(status);
CREATE INDEX IF NOT EXISTS idx_inscriptions_status_created ON inscriptions(status, created_at);

-- Step 6: Add comments for documentation
ALTER TABLE inscriptions COMMENT = 'Inscriptions table with standardized English states only';
