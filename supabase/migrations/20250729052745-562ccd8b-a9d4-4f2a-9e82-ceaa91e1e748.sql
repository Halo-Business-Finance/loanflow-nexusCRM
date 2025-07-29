-- Add missing notification columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_notifications boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS new_application_alerts boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS status_change_notifications boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS daily_summary_reports boolean DEFAULT false;