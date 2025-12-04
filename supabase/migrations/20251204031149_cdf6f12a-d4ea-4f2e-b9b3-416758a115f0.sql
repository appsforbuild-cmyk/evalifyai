-- 1. Quick Feedback table for ad-hoc feedback
CREATE TABLE public.quick_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by_profile_id uuid NOT NULL,
  employee_profile_id uuid NOT NULL,
  transcript text,
  audio_path text,
  feedback_type text DEFAULT 'quick' CHECK (feedback_type IN ('quick', 'praise', 'suggestion')),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quick_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quick_feedback
CREATE POLICY "Users can create quick feedback"
ON public.quick_feedback FOR INSERT
WITH CHECK (auth.uid() = created_by_profile_id);

CREATE POLICY "Managers can view feedback they created"
ON public.quick_feedback FOR SELECT
USING (auth.uid() = created_by_profile_id);

CREATE POLICY "Employees can view feedback about them"
ON public.quick_feedback FOR SELECT
USING (auth.uid() = employee_profile_id);

CREATE POLICY "HR can view all quick feedback"
ON public.quick_feedback FOR SELECT
USING (has_role(auth.uid(), 'hr'::app_role));

-- 2. Goals table for OKR tracking
CREATE TABLE public.goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'on-hold')),
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  due_date date,
  category text DEFAULT 'general',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for goals
CREATE POLICY "Users can manage their own goals"
ON public.goals FOR ALL
USING (auth.uid() = profile_id)
WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Managers can view team goals"
ON public.goals FOR SELECT
USING (has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "HR can view all goals"
ON public.goals FOR SELECT
USING (has_role(auth.uid(), 'hr'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_goals_updated_at
BEFORE UPDATE ON public.goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();