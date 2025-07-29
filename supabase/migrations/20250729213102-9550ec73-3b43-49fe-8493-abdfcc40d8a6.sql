-- Add unique constraint to prevent multiple active roles per user
ALTER TABLE user_roles 
ADD CONSTRAINT unique_active_role_per_user 
UNIQUE (user_id, is_active) 
DEFERRABLE INITIALLY DEFERRED;