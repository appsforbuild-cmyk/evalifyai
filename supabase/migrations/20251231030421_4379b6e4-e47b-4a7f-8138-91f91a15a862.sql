-- Create attrition predictions table
CREATE TABLE public.attrition_predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL,
  risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  contributing_factors JSONB NOT NULL DEFAULT '[]'::jsonb,
  predicted_timeframe TEXT NOT NULL DEFAULT '90+ days',
  confidence INTEGER NOT NULL DEFAULT 50 CHECK (confidence >= 0 AND confidence <= 100),
  recommended_actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_calculated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(employee_id)
);

-- Create retention action plans table
CREATE TABLE public.retention_action_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL,
  created_by UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  impact_score_before INTEGER,
  impact_score_after INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create risk view audit log for privacy/compliance
CREATE TABLE public.risk_view_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  viewer_id UUID NOT NULL,
  employee_id UUID NOT NULL,
  action TEXT NOT NULL DEFAULT 'view',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create attrition history for tracking predictions vs actuals
CREATE TABLE public.attrition_prediction_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL,
  risk_score INTEGER NOT NULL,
  risk_level TEXT NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add employee opt-out preference
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS attrition_opt_out BOOLEAN DEFAULT false;

-- Enable RLS on all tables
ALTER TABLE public.attrition_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retention_action_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_view_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attrition_prediction_history ENABLE ROW LEVEL SECURITY;

-- RLS for attrition_predictions
CREATE POLICY "HR can view all predictions"
ON public.attrition_predictions FOR SELECT
USING (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Managers can view team predictions"
ON public.attrition_predictions FOR SELECT
USING (
  has_role(auth.uid(), 'manager'::app_role) AND
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = attrition_predictions.employee_id
    AND p.team = (SELECT team FROM profiles WHERE user_id = auth.uid())
  )
);

CREATE POLICY "System can manage predictions"
ON public.attrition_predictions FOR ALL
USING (true)
WITH CHECK (true);

-- RLS for retention_action_plans
CREATE POLICY "HR can view all action plans"
ON public.retention_action_plans FOR SELECT
USING (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Managers can manage their action plans"
ON public.retention_action_plans FOR ALL
USING (
  auth.uid() = created_by OR
  has_role(auth.uid(), 'hr'::app_role)
)
WITH CHECK (
  auth.uid() = created_by OR
  has_role(auth.uid(), 'hr'::app_role)
);

-- RLS for risk_view_audit
CREATE POLICY "HR and Admin can view audit logs"
ON public.risk_view_audit FOR SELECT
USING (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert audit logs"
ON public.risk_view_audit FOR INSERT
WITH CHECK (true);

-- RLS for prediction history
CREATE POLICY "HR can view prediction history"
ON public.attrition_prediction_history FOR SELECT
USING (has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Managers can view team history"
ON public.attrition_prediction_history FOR SELECT
USING (
  has_role(auth.uid(), 'manager'::app_role) AND
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = attrition_prediction_history.employee_id
    AND p.team = (SELECT team FROM profiles WHERE user_id = auth.uid())
  )
);

CREATE POLICY "System can manage history"
ON public.attrition_prediction_history FOR ALL
USING (true)
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_attrition_predictions_employee ON public.attrition_predictions(employee_id);
CREATE INDEX idx_attrition_predictions_risk ON public.attrition_predictions(risk_level, risk_score);
CREATE INDEX idx_retention_plans_employee ON public.retention_action_plans(employee_id);
CREATE INDEX idx_prediction_history_employee ON public.attrition_prediction_history(employee_id, recorded_at);

-- Trigger for updated_at on action plans
CREATE TRIGGER update_retention_action_plans_updated_at
BEFORE UPDATE ON public.retention_action_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();