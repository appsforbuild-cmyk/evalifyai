-- Create bias_audit_log table for compliance reporting
CREATE TABLE public.bias_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content_type TEXT NOT NULL,
  original_text TEXT NOT NULL,
  bias_score INTEGER NOT NULL,
  issues JSONB DEFAULT '[]'::jsonb,
  suggestions_applied JSONB DEFAULT '[]'::jsonb,
  context TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bias_training_completions table for certification tracking
CREATE TABLE public.bias_training_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  module_type TEXT NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  quiz_score INTEGER,
  UNIQUE(user_id, module_type)
);

-- Create organization_bias_benchmarks for tracking org-wide metrics
CREATE TABLE public.organization_bias_benchmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  avg_bias_score NUMERIC,
  total_feedbacks INTEGER DEFAULT 0,
  bias_type_breakdown JSONB DEFAULT '{}'::jsonb,
  department_scores JSONB DEFAULT '{}'::jsonb,
  computed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bias_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bias_training_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_bias_benchmarks ENABLE ROW LEVEL SECURITY;

-- RLS for bias_audit_log
CREATE POLICY "Users can view their own bias audits"
  ON public.bias_audit_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create bias audits"
  ON public.bias_audit_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "HR and Admin can view all bias audits"
  ON public.bias_audit_log FOR SELECT
  USING (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- RLS for bias_training_completions
CREATE POLICY "Users can view their training completions"
  ON public.bias_training_completions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their training completions"
  ON public.bias_training_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "HR can view all training completions"
  ON public.bias_training_completions FOR SELECT
  USING (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- RLS for organization_bias_benchmarks
CREATE POLICY "HR and Admin can view benchmarks"
  ON public.organization_bias_benchmarks FOR SELECT
  USING (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can manage benchmarks"
  ON public.organization_bias_benchmarks FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_bias_audit_user ON public.bias_audit_log(user_id);
CREATE INDEX idx_bias_audit_created ON public.bias_audit_log(created_at DESC);
CREATE INDEX idx_bias_audit_score ON public.bias_audit_log(bias_score);
CREATE INDEX idx_training_user ON public.bias_training_completions(user_id);