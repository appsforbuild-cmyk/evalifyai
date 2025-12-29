-- =============================================
-- FIX 1: Profiles table - restrict email visibility
-- =============================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Users can always view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

-- HR and Admin can view all profiles
CREATE POLICY "HR and Admin can view all profiles"
ON public.profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'hr'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Managers can view profiles of employees on their team
CREATE POLICY "Managers can view team member profiles"
ON public.profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'manager'::app_role) AND
  team IS NOT NULL AND
  team = (SELECT p.team FROM public.profiles p WHERE p.user_id = auth.uid())
);

-- =============================================
-- FIX 2: Analytics - remove redundant permissive policy
-- =============================================

-- Drop the overly permissive policy (service role bypasses RLS anyway)
DROP POLICY IF EXISTS "Service role can manage analytics" ON public.analytics_feedback_aggregate;

-- =============================================
-- FIX 3: Goals - add team verification for managers
-- =============================================

-- Drop the overly permissive manager policy
DROP POLICY IF EXISTS "Managers can view team goals" ON public.goals;

-- Create a more restrictive policy that checks team membership
CREATE POLICY "Managers can view team member goals"
ON public.goals
FOR SELECT
USING (
  has_role(auth.uid(), 'manager'::app_role) AND
  EXISTS (
    SELECT 1 FROM public.profiles manager_profile
    WHERE manager_profile.user_id = auth.uid()
    AND manager_profile.team IS NOT NULL
    AND manager_profile.team = (
      SELECT emp_profile.team 
      FROM public.profiles emp_profile 
      WHERE emp_profile.user_id = goals.profile_id
    )
  )
);