
-- ============================================
-- MULTI-TENANT SAAS ARCHITECTURE MIGRATION
-- ============================================

-- 1. Create enums for organization status and plans
CREATE TYPE public.organization_status AS ENUM ('trial', 'active', 'suspended', 'cancelled');
CREATE TYPE public.organization_plan AS ENUM ('starter', 'professional', 'enterprise');
CREATE TYPE public.organization_role AS ENUM ('owner', 'admin', 'manager', 'employee');

-- 2. Create organizations table
CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  domain text,
  logo_url text,
  primary_color text DEFAULT '#6366f1',
  secondary_color text DEFAULT '#8b5cf6',
  status organization_status NOT NULL DEFAULT 'trial',
  plan organization_plan NOT NULL DEFAULT 'starter',
  max_users integer NOT NULL DEFAULT 10,
  max_storage_gb integer NOT NULL DEFAULT 5,
  features jsonb NOT NULL DEFAULT '{"voiceRecording": true, "biasDetection": true, "sso": false, "api": false, "whiteLabel": false}'::jsonb,
  billing_email text,
  trial_ends_at timestamp with time zone DEFAULT (now() + interval '14 days'),
  subscription_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create unique index on name (case-insensitive)
CREATE UNIQUE INDEX organizations_name_unique ON public.organizations (lower(name));

-- 3. Create organization_users junction table
CREATE TABLE public.organization_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role organization_role NOT NULL DEFAULT 'employee',
  is_primary_owner boolean NOT NULL DEFAULT false,
  invited_by uuid REFERENCES auth.users(id),
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- 4. Create invitations table
CREATE TABLE public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  role organization_role NOT NULL DEFAULT 'employee',
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by uuid NOT NULL REFERENCES auth.users(id),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 5. Create organization_settings table
CREATE TABLE public.organization_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
  company_name text,
  timezone text NOT NULL DEFAULT 'UTC',
  language text NOT NULL DEFAULT 'en',
  date_format text NOT NULL DEFAULT 'MM/DD/YYYY',
  email_notifications boolean NOT NULL DEFAULT true,
  feedback_reminder_days integer NOT NULL DEFAULT 7,
  custom_branding jsonb DEFAULT '{}'::jsonb,
  email_templates jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 6. Create helper function to get user's organization
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id 
  FROM public.organization_users 
  WHERE user_id = auth.uid() 
  LIMIT 1;
$$;

-- 7. Create helper function to check if user belongs to organization
CREATE OR REPLACE FUNCTION public.user_belongs_to_org(_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_users
    WHERE user_id = auth.uid() AND organization_id = _org_id
  );
$$;

-- 8. Create helper function to check user's org role
CREATE OR REPLACE FUNCTION public.get_user_org_role(_org_id uuid)
RETURNS organization_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.organization_users
  WHERE user_id = auth.uid() AND organization_id = _org_id
  LIMIT 1;
$$;

-- 9. Add organization_id to ALL existing tables
ALTER TABLE public.profiles ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.employees_directory ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.voice_sessions ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.feedback_entries ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.feedback_questions ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.feedback_question_templates ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.feedback_audit ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.goals ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.quick_feedback ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.recognition_posts ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.recognition_comments ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.recognition_likes ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.notifications ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.notification_preferences ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.user_roles ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.user_points ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.user_achievements ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.point_transactions ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.achievements ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.milestone_completions ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.attrition_predictions ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.attrition_prediction_history ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.retention_action_plans ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.bias_audit_log ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.bias_training_completions ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.organization_bias_benchmarks ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.analytics_feedback_aggregate ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.sso_config ADD COLUMN new_organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.sso_audit_log ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.admin_api_keys ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.user_import_history ADD COLUMN organization_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.risk_view_audit ADD COLUMN organization_id uuid REFERENCES public.organizations(id);

-- 10. Create indexes for organization_id on all tables
CREATE INDEX idx_profiles_org ON public.profiles(organization_id);
CREATE INDEX idx_employees_directory_org ON public.employees_directory(organization_id);
CREATE INDEX idx_voice_sessions_org ON public.voice_sessions(organization_id);
CREATE INDEX idx_feedback_entries_org ON public.feedback_entries(organization_id);
CREATE INDEX idx_goals_org ON public.goals(organization_id);
CREATE INDEX idx_quick_feedback_org ON public.quick_feedback(organization_id);
CREATE INDEX idx_recognition_posts_org ON public.recognition_posts(organization_id);
CREATE INDEX idx_notifications_org ON public.notifications(organization_id);
CREATE INDEX idx_user_roles_org ON public.user_roles(organization_id);
CREATE INDEX idx_achievements_org ON public.achievements(organization_id);

-- 11. Enable RLS on new tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;

-- 12. RLS Policies for organizations table
CREATE POLICY "Users can view their organizations"
  ON public.organizations FOR SELECT
  USING (public.user_belongs_to_org(id));

CREATE POLICY "Owners and admins can update their organization"
  ON public.organizations FOR UPDATE
  USING (public.get_user_org_role(id) IN ('owner', 'admin'));

-- 13. RLS Policies for organization_users table
CREATE POLICY "Users can view members of their organization"
  ON public.organization_users FOR SELECT
  USING (public.user_belongs_to_org(organization_id));

CREATE POLICY "Owners and admins can manage members"
  ON public.organization_users FOR ALL
  USING (public.get_user_org_role(organization_id) IN ('owner', 'admin'))
  WITH CHECK (public.get_user_org_role(organization_id) IN ('owner', 'admin'));

CREATE POLICY "Users can view their own membership"
  ON public.organization_users FOR SELECT
  USING (user_id = auth.uid());

-- 14. RLS Policies for invitations table
CREATE POLICY "Org admins can manage invitations"
  ON public.invitations FOR ALL
  USING (public.get_user_org_role(organization_id) IN ('owner', 'admin'))
  WITH CHECK (public.get_user_org_role(organization_id) IN ('owner', 'admin'));

CREATE POLICY "Anyone can view invitation by token"
  ON public.invitations FOR SELECT
  USING (true);

-- 15. RLS Policies for organization_settings table
CREATE POLICY "Users can view their org settings"
  ON public.organization_settings FOR SELECT
  USING (public.user_belongs_to_org(organization_id));

CREATE POLICY "Owners and admins can update org settings"
  ON public.organization_settings FOR ALL
  USING (public.get_user_org_role(organization_id) IN ('owner', 'admin'))
  WITH CHECK (public.get_user_org_role(organization_id) IN ('owner', 'admin'));

-- 16. Drop existing RLS policies that need updating (profiles)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "HR and Admin can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Managers can view team member profiles" ON public.profiles;

-- 17. Create new multi-tenant RLS policies for profiles
CREATE POLICY "Users can view profiles in their organization"
  ON public.profiles FOR SELECT
  USING (
    organization_id = public.get_user_organization_id()
    OR user_id = auth.uid()
  );

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- 18. Drop and recreate policies for voice_sessions
DROP POLICY IF EXISTS "Managers can create sessions" ON public.voice_sessions;
DROP POLICY IF EXISTS "Managers can delete their sessions" ON public.voice_sessions;
DROP POLICY IF EXISTS "Managers can update their sessions" ON public.voice_sessions;
DROP POLICY IF EXISTS "Managers can view their sessions" ON public.voice_sessions;

CREATE POLICY "Users can view sessions in their organization"
  ON public.voice_sessions FOR SELECT
  USING (
    organization_id = public.get_user_organization_id()
    AND (auth.uid() = manager_id OR auth.uid() = employee_id OR public.has_role(auth.uid(), 'hr'::app_role))
  );

CREATE POLICY "Managers can create sessions in their organization"
  ON public.voice_sessions FOR INSERT
  WITH CHECK (
    organization_id = public.get_user_organization_id()
    AND auth.uid() = manager_id 
    AND public.has_role(auth.uid(), 'manager'::app_role)
  );

CREATE POLICY "Managers can update their sessions"
  ON public.voice_sessions FOR UPDATE
  USING (organization_id = public.get_user_organization_id() AND auth.uid() = manager_id);

CREATE POLICY "Managers can delete their sessions"
  ON public.voice_sessions FOR DELETE
  USING (organization_id = public.get_user_organization_id() AND auth.uid() = manager_id);

-- 19. Drop and recreate policies for goals
DROP POLICY IF EXISTS "Users can manage their own goals" ON public.goals;
DROP POLICY IF EXISTS "HR can view all goals" ON public.goals;
DROP POLICY IF EXISTS "Managers can view team member goals" ON public.goals;

CREATE POLICY "Users can manage their own goals in their organization"
  ON public.goals FOR ALL
  USING (organization_id = public.get_user_organization_id() AND auth.uid() = profile_id)
  WITH CHECK (organization_id = public.get_user_organization_id() AND auth.uid() = profile_id);

CREATE POLICY "HR can view all goals in their organization"
  ON public.goals FOR SELECT
  USING (
    organization_id = public.get_user_organization_id()
    AND public.has_role(auth.uid(), 'hr'::app_role)
  );

CREATE POLICY "Managers can view team goals in their organization"
  ON public.goals FOR SELECT
  USING (
    organization_id = public.get_user_organization_id()
    AND public.has_role(auth.uid(), 'manager'::app_role)
  );

-- 20. Drop and recreate policies for recognition_posts
DROP POLICY IF EXISTS "Anyone can view public recognitions" ON public.recognition_posts;
DROP POLICY IF EXISTS "Users can create recognition posts" ON public.recognition_posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON public.recognition_posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON public.recognition_posts;

CREATE POLICY "Users can view recognitions in their organization"
  ON public.recognition_posts FOR SELECT
  USING (
    organization_id = public.get_user_organization_id()
    AND (is_public = true OR from_user_id = auth.uid() OR to_user_id = auth.uid())
  );

CREATE POLICY "Users can create recognition posts in their organization"
  ON public.recognition_posts FOR INSERT
  WITH CHECK (
    organization_id = public.get_user_organization_id()
    AND auth.uid() = from_user_id
  );

CREATE POLICY "Users can update their own posts"
  ON public.recognition_posts FOR UPDATE
  USING (organization_id = public.get_user_organization_id() AND auth.uid() = from_user_id);

CREATE POLICY "Users can delete their own posts"
  ON public.recognition_posts FOR DELETE
  USING (organization_id = public.get_user_organization_id() AND auth.uid() = from_user_id);

-- 21. Drop and recreate policies for notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

CREATE POLICY "Users can view their notifications in their organization"
  ON public.notifications FOR SELECT
  USING (organization_id = public.get_user_organization_id() AND auth.uid() = user_id);

CREATE POLICY "Users can update their notifications"
  ON public.notifications FOR UPDATE
  USING (organization_id = public.get_user_organization_id() AND auth.uid() = user_id);

CREATE POLICY "Users can delete their notifications"
  ON public.notifications FOR DELETE
  USING (organization_id = public.get_user_organization_id() AND auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- 22. Drop and recreate policies for employees_directory
DROP POLICY IF EXISTS "Authenticated users can view employees" ON public.employees_directory;
DROP POLICY IF EXISTS "Admins can manage employees" ON public.employees_directory;

CREATE POLICY "Users can view employees in their organization"
  ON public.employees_directory FOR SELECT
  USING (organization_id = public.get_user_organization_id());

CREATE POLICY "Admins can manage employees in their organization"
  ON public.employees_directory FOR ALL
  USING (
    organization_id = public.get_user_organization_id()
    AND public.has_role(auth.uid(), 'admin'::app_role)
  )
  WITH CHECK (
    organization_id = public.get_user_organization_id()
    AND public.has_role(auth.uid(), 'admin'::app_role)
  );

-- 23. Update triggers for updated_at
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organization_settings_updated_at
  BEFORE UPDATE ON public.organization_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 24. Function to create organization with initial setup
CREATE OR REPLACE FUNCTION public.create_organization_with_owner(
  _name text,
  _slug text,
  _owner_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _org_id uuid;
BEGIN
  -- Create organization
  INSERT INTO public.organizations (name, slug, status, plan)
  VALUES (_name, _slug, 'trial', 'starter')
  RETURNING id INTO _org_id;
  
  -- Add owner to organization_users
  INSERT INTO public.organization_users (organization_id, user_id, role, is_primary_owner)
  VALUES (_org_id, _owner_id, 'owner', true);
  
  -- Create default settings
  INSERT INTO public.organization_settings (organization_id, company_name)
  VALUES (_org_id, _name);
  
  -- Update user's profile with organization_id
  UPDATE public.profiles
  SET organization_id = _org_id
  WHERE user_id = _owner_id;
  
  RETURN _org_id;
END;
$$;

-- 25. Function to accept invitation
CREATE OR REPLACE FUNCTION public.accept_invitation(_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _invitation record;
  _user_id uuid;
BEGIN
  _user_id := auth.uid();
  
  -- Get invitation
  SELECT * INTO _invitation
  FROM public.invitations
  WHERE token = _token
    AND accepted_at IS NULL
    AND expires_at > now();
    
  IF _invitation IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation');
  END IF;
  
  -- Add user to organization
  INSERT INTO public.organization_users (organization_id, user_id, role, invited_by)
  VALUES (_invitation.organization_id, _user_id, _invitation.role, _invitation.invited_by);
  
  -- Update profile with organization_id
  UPDATE public.profiles
  SET organization_id = _invitation.organization_id
  WHERE user_id = _user_id;
  
  -- Mark invitation as accepted
  UPDATE public.invitations
  SET accepted_at = now()
  WHERE id = _invitation.id;
  
  RETURN jsonb_build_object('success', true, 'organization_id', _invitation.organization_id);
END;
$$;
