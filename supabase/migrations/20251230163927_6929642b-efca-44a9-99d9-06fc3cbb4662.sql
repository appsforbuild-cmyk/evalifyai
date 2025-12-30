-- Create SSO configuration table
CREATE TABLE public.sso_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL CHECK (provider IN ('google', 'microsoft', 'saml')),
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(organization_id, provider)
);

-- Create SSO audit log table
CREATE TABLE public.sso_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL,
  provider TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sso_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sso_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for sso_config - only admins can manage
CREATE POLICY "Admins can manage SSO config"
ON public.sso_config
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS policies for sso_audit_log
CREATE POLICY "Admins and HR can view SSO audit logs"
ON public.sso_audit_log
FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'hr'));

CREATE POLICY "System can insert SSO audit logs"
ON public.sso_audit_log
FOR INSERT
WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_sso_config_provider ON public.sso_config(provider);
CREATE INDEX idx_sso_config_org ON public.sso_config(organization_id);
CREATE INDEX idx_sso_audit_user ON public.sso_audit_log(user_id);
CREATE INDEX idx_sso_audit_event ON public.sso_audit_log(event_type);
CREATE INDEX idx_sso_audit_created ON public.sso_audit_log(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_sso_config_updated_at
BEFORE UPDATE ON public.sso_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();