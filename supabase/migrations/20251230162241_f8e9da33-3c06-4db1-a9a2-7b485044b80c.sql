-- Create user_import_history table
CREATE TABLE public.user_import_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  imported_by UUID NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('csv', 'manual', 'api')),
  total_count INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  error_details JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create admin_api_keys table for API integration
CREATE TABLE public.admin_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on both tables
ALTER TABLE public.user_import_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_api_keys ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_import_history
CREATE POLICY "Admins and HR can view import history"
ON public.user_import_history
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'hr'::app_role)
);

CREATE POLICY "Admins and HR can create import history"
ON public.user_import_history
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'hr'::app_role)
);

-- RLS policies for admin_api_keys
CREATE POLICY "Admins can manage API keys"
ON public.admin_api_keys
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Index for faster lookups
CREATE INDEX idx_import_history_imported_by ON public.user_import_history(imported_by);
CREATE INDEX idx_import_history_created_at ON public.user_import_history(created_at DESC);
CREATE INDEX idx_api_keys_key_prefix ON public.admin_api_keys(key_prefix);

-- Add comments
COMMENT ON TABLE public.user_import_history IS 'Tracks all user bulk import operations';
COMMENT ON TABLE public.admin_api_keys IS 'API keys for programmatic user imports';