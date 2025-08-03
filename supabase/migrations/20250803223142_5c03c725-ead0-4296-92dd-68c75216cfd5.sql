-- Create lead_documents table for storing financial documents
CREATE TABLE public.lead_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL,
  contact_entity_id UUID REFERENCES public.contact_entities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  document_name TEXT NOT NULL,
  document_type TEXT NOT NULL,
  file_path TEXT,
  file_size BIGINT,
  file_mime_type TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lead_documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own lead documents" 
ON public.lead_documents 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create lead documents" 
ON public.lead_documents 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lead documents" 
ON public.lead_documents 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lead documents" 
ON public.lead_documents 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all lead documents" 
ON public.lead_documents 
FOR ALL 
USING (has_role('admin'::user_role));

-- Create storage bucket for lead documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('lead-documents', 'lead-documents', false);

-- Create storage policies for lead documents
CREATE POLICY "Users can upload their lead documents"
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'lead-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their lead documents"
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'lead-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their lead documents"
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'lead-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their lead documents"
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'lead-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create trigger for updated_at
CREATE TRIGGER update_lead_documents_updated_at
  BEFORE UPDATE ON public.lead_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();