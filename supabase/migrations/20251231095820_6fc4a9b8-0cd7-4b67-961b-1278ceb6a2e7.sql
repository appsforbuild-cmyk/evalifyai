-- Add branding fields to organization_settings
ALTER TABLE public.organization_settings
ADD COLUMN IF NOT EXISTS logo_icon_url text,
ADD COLUMN IF NOT EXISTS secondary_color text DEFAULT '#8b5cf6',
ADD COLUMN IF NOT EXISTS accent_color text DEFAULT '#10b981',
ADD COLUMN IF NOT EXISTS error_color text DEFAULT '#ef4444',
ADD COLUMN IF NOT EXISTS background_color text DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS font_heading text DEFAULT 'Inter',
ADD COLUMN IF NOT EXISTS font_body text DEFAULT 'Inter',
ADD COLUMN IF NOT EXISTS email_header_logo_url text,
ADD COLUMN IF NOT EXISTS email_footer_content text,
ADD COLUMN IF NOT EXISTS platform_name text DEFAULT 'EvalifyAI',
ADD COLUMN IF NOT EXISTS powered_by_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS domain_verification_token text,
ADD COLUMN IF NOT EXISTS domain_status text DEFAULT 'none';

-- Add primary_color to organization_settings (currently on organizations table)
ALTER TABLE public.organization_settings
ADD COLUMN IF NOT EXISTS primary_color text DEFAULT '#6366f1';

-- Create storage bucket for branding assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('branding', 'branding', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for branding bucket
CREATE POLICY "Users can view branding assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'branding');

CREATE POLICY "Admins can upload branding assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'branding' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM organization_users ou
    WHERE ou.user_id = auth.uid()
    AND ou.organization_id::text = (storage.foldername(name))[1]
    AND ou.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Admins can update branding assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'branding' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM organization_users ou
    WHERE ou.user_id = auth.uid()
    AND ou.organization_id::text = (storage.foldername(name))[1]
    AND ou.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Admins can delete branding assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'branding' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM organization_users ou
    WHERE ou.user_id = auth.uid()
    AND ou.organization_id::text = (storage.foldername(name))[1]
    AND ou.role IN ('owner', 'admin')
  )
);