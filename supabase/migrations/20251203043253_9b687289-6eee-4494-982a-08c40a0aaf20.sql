-- Create analytics_feedback_aggregate table for storing computed metrics
CREATE TABLE public.analytics_feedback_aggregate (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  computed_at timestamp with time zone NOT NULL DEFAULT now(),
  period_start date NOT NULL,
  period_end date NOT NULL,
  team text,
  org_unit text,
  avg_sentiment numeric,
  avg_fairness numeric,
  feedback_count integer DEFAULT 0,
  skill_gaps jsonb DEFAULT '[]'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.analytics_feedback_aggregate ENABLE ROW LEVEL SECURITY;

-- Only HR can view analytics
CREATE POLICY "HR can view analytics"
ON public.analytics_feedback_aggregate
FOR SELECT
USING (has_role(auth.uid(), 'hr'::app_role));

-- System can insert/update analytics (via service role)
CREATE POLICY "Service role can manage analytics"
ON public.analytics_feedback_aggregate
FOR ALL
USING (true)
WITH CHECK (true);

-- Add team and org_unit to profiles for grouping
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS team text,
ADD COLUMN IF NOT EXISTS org_unit text;