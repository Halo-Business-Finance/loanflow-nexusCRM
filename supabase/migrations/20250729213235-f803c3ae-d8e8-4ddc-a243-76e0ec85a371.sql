-- Remove the problematic unique constraint
ALTER TABLE user_roles DROP CONSTRAINT unique_active_role_per_user;

-- Create a better approach using a partial unique index
-- This allows multiple inactive roles but only one active role per user
CREATE UNIQUE INDEX unique_active_role_per_user_idx 
ON user_roles (user_id) 
WHERE is_active = true;