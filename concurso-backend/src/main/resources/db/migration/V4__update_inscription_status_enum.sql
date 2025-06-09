-- Migration V4: Update inscription status ENUM to only include standardized states
-- This migration removes legacy states from the ENUM definition

-- Step 1: Verify all data uses standardized states (safety check)
-- This query should return 0 rows if migration V3 was successful
SELECT COUNT(*) as legacy_count 
FROM inscriptions 
WHERE status NOT IN (
    'ACTIVE', 'PENDING', 'COMPLETED_WITH_DOCS', 'COMPLETED_PENDING_DOCS', 
    'FROZEN', 'APPROVED', 'REJECTED', 'CANCELLED'
);

-- Step 2: Create a temporary column with the new ENUM
ALTER TABLE inscriptions 
ADD COLUMN status_new ENUM(
    'ACTIVE', 
    'PENDING', 
    'COMPLETED_WITH_DOCS', 
    'COMPLETED_PENDING_DOCS', 
    'FROZEN', 
    'APPROVED', 
    'REJECTED', 
    'CANCELLED'
) NOT NULL DEFAULT 'ACTIVE';

-- Step 3: Copy data from old column to new column
UPDATE inscriptions SET status_new = status;

-- Step 4: Drop the old column
ALTER TABLE inscriptions DROP COLUMN status;

-- Step 5: Rename the new column to the original name
ALTER TABLE inscriptions CHANGE COLUMN status_new status ENUM(
    'ACTIVE', 
    'PENDING', 
    'COMPLETED_WITH_DOCS', 
    'COMPLETED_PENDING_DOCS', 
    'FROZEN', 
    'APPROVED', 
    'REJECTED', 
    'CANCELLED'
) NOT NULL DEFAULT 'ACTIVE';

-- Step 6: Recreate indexes that were dropped
CREATE INDEX IF NOT EXISTS idx_inscriptions_status ON inscriptions(status);
CREATE INDEX IF NOT EXISTS idx_inscriptions_status_created ON inscriptions(status, created_at);

-- Step 7: Add constraint to ensure only valid states
ALTER TABLE inscriptions 
ADD CONSTRAINT chk_inscription_status 
CHECK (status IN (
    'ACTIVE', 'PENDING', 'COMPLETED_WITH_DOCS', 'COMPLETED_PENDING_DOCS', 
    'FROZEN', 'APPROVED', 'REJECTED', 'CANCELLED'
));

-- Step 8: Update table comment
ALTER TABLE inscriptions 
COMMENT = 'Inscriptions table with standardized English states only - Legacy states removed';
