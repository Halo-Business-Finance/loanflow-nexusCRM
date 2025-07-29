-- Clean up duplicate role entries and ensure only one active role per user

-- First, let's create a temporary function to clean up duplicate roles
CREATE OR REPLACE FUNCTION cleanup_duplicate_roles()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record RECORD;
    latest_role_record RECORD;
BEGIN
    -- For each user with multiple active roles
    FOR user_record IN 
        SELECT user_id 
        FROM user_roles 
        WHERE is_active = true 
        GROUP BY user_id 
        HAVING COUNT(*) > 1
    LOOP
        -- Get the most recent role for this user
        SELECT * INTO latest_role_record
        FROM user_roles 
        WHERE user_id = user_record.user_id 
        AND is_active = true
        ORDER BY id DESC 
        LIMIT 1;
        
        -- Deactivate all roles for this user
        UPDATE user_roles 
        SET is_active = false 
        WHERE user_id = user_record.user_id;
        
        -- Reactivate only the latest role
        UPDATE user_roles 
        SET is_active = true 
        WHERE id = latest_role_record.id;
        
        RAISE NOTICE 'Cleaned up roles for user %, kept role: %', user_record.user_id, latest_role_record.role;
    END LOOP;
END;
$$;

-- Execute the cleanup
SELECT cleanup_duplicate_roles();

-- Drop the temporary function
DROP FUNCTION cleanup_duplicate_roles();