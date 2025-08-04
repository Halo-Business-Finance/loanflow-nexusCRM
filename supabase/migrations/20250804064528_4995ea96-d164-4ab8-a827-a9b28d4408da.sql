-- Simply add the missing roles to the enum without removing anything
-- This will fix the TypeScript errors by making loan_originator and tech available

-- Add loan_originator if it doesn't exist
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'loan_originator';

-- Add tech if it doesn't exist  
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'tech';

-- Update any existing 'viewer' roles to 'tech' (if any exist)
UPDATE public.user_roles 
SET role = 'tech'::user_role 
WHERE role = 'viewer'::user_role;