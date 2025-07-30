-- Add security_notifications table for monitoring alerts
CREATE TABLE IF NOT EXISTS public.security_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  metadata JSONB DEFAULT '{}',
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.security_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage security notifications" 
ON public.security_notifications 
FOR ALL 
USING (has_role('admin'::user_role));

CREATE POLICY "System can insert security notifications" 
ON public.security_notifications 
FOR INSERT 
WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_security_notifications_user_id ON public.security_notifications(user_id);
CREATE INDEX idx_security_notifications_type ON public.security_notifications(notification_type);
CREATE INDEX idx_security_notifications_severity ON public.security_notifications(severity);
CREATE INDEX idx_security_notifications_created_at ON public.security_notifications(created_at);
CREATE INDEX idx_security_notifications_acknowledged ON public.security_notifications(acknowledged);

-- Add trigger for updated_at
CREATE TRIGGER update_security_notifications_updated_at
  BEFORE UPDATE ON public.security_notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();