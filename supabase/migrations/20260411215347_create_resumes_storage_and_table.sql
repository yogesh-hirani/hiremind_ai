-- Create resumes storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'resumes',
    'resumes',
    false,
    10485760,
    ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']
)
ON CONFLICT (id) DO NOTHING;

-- Storage bucket RLS policies
DROP POLICY IF EXISTS "allow_upload_resumes" ON storage.objects;
CREATE POLICY "allow_upload_resumes"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'resumes');

DROP POLICY IF EXISTS "allow_read_resumes" ON storage.objects;
CREATE POLICY "allow_read_resumes"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'resumes');

DROP POLICY IF EXISTS "allow_delete_resumes" ON storage.objects;
CREATE POLICY "allow_delete_resumes"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'resumes');

-- Create resumes table to store uploaded resume metadata and parsed results
CREATE TABLE IF NOT EXISTS public.resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    extracted_text TEXT,
    parsed_data JSONB,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_resumes_created_at ON public.resumes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_resumes_status ON public.resumes(status);

-- Enable RLS
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

-- Open access policy (no auth required for this app)
DROP POLICY IF EXISTS "open_access_resumes" ON public.resumes;
CREATE POLICY "open_access_resumes"
ON public.resumes
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_resumes_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_resumes_updated_at ON public.resumes;
CREATE TRIGGER set_resumes_updated_at
    BEFORE UPDATE ON public.resumes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_resumes_updated_at();
