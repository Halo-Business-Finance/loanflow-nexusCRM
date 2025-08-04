-- Update the user_role enum to replace 'viewer' with 'tech'
-- First, add the new 'tech' value
ALTER TYPE user_role ADD VALUE 'tech';

-- Update existing 'viewer' roles to 'tech'
UPDATE user_roles SET role = 'tech' WHERE role = 'viewer';

-- Note: We cannot remove the 'viewer' value from the enum without recreating it
-- but since we've updated all existing records, the old value won't be used