-- Add new loan-specific roles to the user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'loan_processor';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'funder'; 
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'closer';

-- Insert default roles for existing users if they don't have specific roles
-- This ensures backwards compatibility
INSERT INTO user_roles (user_id, role) 
SELECT DISTINCT u.id, 'loan_processor'::user_role
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM user_roles ur 
  WHERE ur.user_id = u.id 
  AND ur.role IN ('loan_processor', 'funder', 'underwriter', 'closer')
)
ON CONFLICT (user_id, role) DO NOTHING;