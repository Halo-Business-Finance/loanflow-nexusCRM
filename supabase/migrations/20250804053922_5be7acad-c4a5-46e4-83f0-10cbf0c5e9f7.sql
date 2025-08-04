-- Add new loan-specific roles to the user_role enum (split into separate commands)
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'loan_processor';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'funder'; 
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'closer';