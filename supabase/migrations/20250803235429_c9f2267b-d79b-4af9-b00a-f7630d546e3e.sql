-- Create document analytics table
CREATE TABLE public.document_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  document_id UUID NOT NULL,
  document_name TEXT NOT NULL,
  view_started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  view_ended_at TIMESTAMP WITH TIME ZONE,
  total_view_time_seconds INTEGER DEFAULT 0,
  pages_viewed JSONB DEFAULT '[]'::jsonb,
  max_page_reached INTEGER DEFAULT 1,
  zoom_events INTEGER DEFAULT 0,
  download_attempted BOOLEAN DEFAULT false,
  print_attempted BOOLEAN DEFAULT false,
  viewer_type TEXT DEFAULT 'adobe', -- 'adobe', 'google', 'direct'
  session_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create document error logs table
CREATE TABLE public.document_error_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  document_id UUID,
  document_name TEXT,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  viewer_type TEXT, -- 'adobe', 'google', 'direct'
  browser_info JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.document_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_error_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for document_analytics
CREATE POLICY "Users can view their own document analytics" 
ON public.document_analytics 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own document analytics" 
ON public.document_analytics 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own document analytics" 
ON public.document_analytics 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all document analytics" 
ON public.document_analytics 
FOR ALL 
USING (has_role('admin'::user_role));

-- Create policies for document_error_logs
CREATE POLICY "Users can create document error logs" 
ON public.document_error_logs 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can view their own document error logs" 
ON public.document_error_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all document error logs" 
ON public.document_error_logs 
FOR ALL 
USING (has_role('admin'::user_role));

-- Create indexes for better performance
CREATE INDEX idx_document_analytics_user_id ON public.document_analytics(user_id);
CREATE INDEX idx_document_analytics_document_id ON public.document_analytics(document_id);
CREATE INDEX idx_document_analytics_created_at ON public.document_analytics(created_at);
CREATE INDEX idx_document_error_logs_user_id ON public.document_error_logs(user_id);
CREATE INDEX idx_document_error_logs_created_at ON public.document_error_logs(created_at);

-- Create trigger for updating updated_at
CREATE TRIGGER update_document_analytics_updated_at
BEFORE UPDATE ON public.document_analytics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();