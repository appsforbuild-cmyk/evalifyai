-- Create super_admins table for platform-level administrators
CREATE TABLE public.super_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  permissions jsonb NOT NULL DEFAULT '{"manageOrgs": true, "viewAnalytics": true, "billing": true, "support": true, "systemConfig": true}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  last_login_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create admin_audit_logs for tracking all admin actions
CREATE TABLE public.admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  super_admin_id uuid REFERENCES public.super_admins(id),
  action text NOT NULL,
  target_type text NOT NULL, -- 'organization', 'user', 'system', etc.
  target_id uuid,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create admin_notes for internal notes on organizations
CREATE TABLE public.admin_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  super_admin_id uuid REFERENCES public.super_admins(id),
  content text NOT NULL,
  is_pinned boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create impersonation_sessions for tracking admin impersonation
CREATE TABLE public.impersonation_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  super_admin_id uuid REFERENCES public.super_admins(id) NOT NULL,
  impersonated_user_id uuid NOT NULL,
  organization_id uuid REFERENCES public.organizations(id),
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  ended_at timestamp with time zone,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '1 hour'),
  reason text
);

-- Create platform_alerts for system alerts
CREATE TABLE public.platform_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL,
  severity text NOT NULL DEFAULT 'info', -- 'info', 'warning', 'critical'
  title text NOT NULL,
  message text NOT NULL,
  organization_id uuid REFERENCES public.organizations(id),
  metadata jsonb DEFAULT '{}'::jsonb,
  is_resolved boolean DEFAULT false,
  resolved_by uuid REFERENCES public.super_admins(id),
  resolved_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create feature_flags for global feature management
CREATE TABLE public.feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  is_enabled boolean NOT NULL DEFAULT false,
  rollout_percentage integer DEFAULT 100,
  allowed_organizations uuid[] DEFAULT '{}',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES public.super_admins(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impersonation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Create function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.super_admins
    WHERE user_id = _user_id AND is_active = true
  )
$$;

-- Create function to check super admin permission
CREATE OR REPLACE FUNCTION public.has_super_admin_permission(_user_id uuid, _permission text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.super_admins
    WHERE user_id = _user_id 
      AND is_active = true
      AND (permissions->_permission)::boolean = true
  )
$$;

-- RLS Policies for super_admins
CREATE POLICY "Super admins can view all super admins"
ON public.super_admins FOR SELECT
USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins with systemConfig can manage super admins"
ON public.super_admins FOR ALL
USING (has_super_admin_permission(auth.uid(), 'systemConfig'))
WITH CHECK (has_super_admin_permission(auth.uid(), 'systemConfig'));

-- RLS Policies for admin_audit_logs
CREATE POLICY "Super admins can view audit logs"
ON public.admin_audit_logs FOR SELECT
USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can insert audit logs"
ON public.admin_audit_logs FOR INSERT
WITH CHECK (is_super_admin(auth.uid()));

-- RLS Policies for admin_notes
CREATE POLICY "Super admins can manage admin notes"
ON public.admin_notes FOR ALL
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

-- RLS Policies for impersonation_sessions
CREATE POLICY "Super admins can manage impersonation sessions"
ON public.impersonation_sessions FOR ALL
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

-- RLS Policies for platform_alerts
CREATE POLICY "Super admins can manage platform alerts"
ON public.platform_alerts FOR ALL
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

-- RLS Policies for feature_flags
CREATE POLICY "Super admins can manage feature flags"
ON public.feature_flags FOR ALL
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

-- Create triggers for updated_at
CREATE TRIGGER update_super_admins_updated_at
BEFORE UPDATE ON public.super_admins
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_admin_notes_updated_at
BEFORE UPDATE ON public.admin_notes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_feature_flags_updated_at
BEFORE UPDATE ON public.feature_flags
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.platform_alerts;