-- Add language and timezone columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS language text DEFAULT 'en-US',
ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'America/New_York';