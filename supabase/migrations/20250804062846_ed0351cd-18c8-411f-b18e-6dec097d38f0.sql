-- Update the user_role enum to replace 'viewer' with 'tech'
-- First, add the new 'tech' value
ALTER TYPE user_role ADD VALUE 'tech';

-- Commit the transaction to make the new enum value available
COMMIT;

-- Start a new transaction and update existing 'viewer' roles to 'tech'
BEGIN;
UPDATE user_roles SET role = 'tech' WHERE role = 'viewer';
COMMIT;