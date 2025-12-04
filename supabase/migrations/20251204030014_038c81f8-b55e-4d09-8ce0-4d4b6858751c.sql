-- Create table for tracking milestone completions
CREATE TABLE public.milestone_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  employee_id uuid NOT NULL,
  milestone_key text NOT NULL,
  completed_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, employee_id, milestone_key)
);

-- Enable RLS
ALTER TABLE public.milestone_completions ENABLE ROW LEVEL SECURITY;

-- Managers can manage milestones for their team members
CREATE POLICY "Managers can manage milestone completions"
ON public.milestone_completions
FOR ALL
USING (has_role(auth.uid(), 'manager'::app_role) OR auth.uid() = employee_id)
WITH CHECK (has_role(auth.uid(), 'manager'::app_role) OR auth.uid() = employee_id);

-- Employees can view their own milestones
CREATE POLICY "Employees can view own milestones"
ON public.milestone_completions
FOR SELECT
USING (auth.uid() = employee_id);

-- HR can view all milestones
CREATE POLICY "HR can view all milestones"
ON public.milestone_completions
FOR SELECT
USING (has_role(auth.uid(), 'hr'::app_role));