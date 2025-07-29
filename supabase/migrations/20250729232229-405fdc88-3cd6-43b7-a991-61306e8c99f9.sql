-- Create user_role enum first (separate transaction)
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('agent', 'manager', 'admin', 'super_admin');
EXCEPTION
    WHEN duplicate_object THEN
        -- If enum exists, try to add super_admin
        BEGIN
            ALTER TYPE public.user_role ADD VALUE 'super_admin';
        EXCEPTION
            WHEN others THEN null; -- super_admin might already exist
        END;
END $$;