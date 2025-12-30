-- Create feedback_question_templates table for admin-managed question templates
CREATE TABLE public.feedback_question_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  category TEXT NOT NULL DEFAULT 'custom',
  department TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  version INTEGER NOT NULL DEFAULT 1,
  parent_template_id UUID REFERENCES public.feedback_question_templates(id),
  created_by UUID REFERENCES public.profiles(user_id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feedback_question_templates ENABLE ROW LEVEL SECURITY;

-- Admin/HR can manage all templates
CREATE POLICY "Admin and HR can manage templates"
ON public.feedback_question_templates
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'hr'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'hr'::app_role)
);

-- Managers can read active templates (for their department or default ones)
CREATE POLICY "Managers can view active templates"
ON public.feedback_question_templates
FOR SELECT
USING (
  has_role(auth.uid(), 'manager'::app_role) AND
  is_active = true AND
  (
    is_default = true OR
    department IS NULL OR
    department = (SELECT team FROM public.profiles WHERE user_id = auth.uid())
  )
);

-- Employees can read active default templates
CREATE POLICY "Employees can view default templates"
ON public.feedback_question_templates
FOR SELECT
USING (
  is_active = true AND
  is_default = true
);

-- Add trigger for updated_at
CREATE TRIGGER update_feedback_question_templates_updated_at
BEFORE UPDATE ON public.feedback_question_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for common queries
CREATE INDEX idx_templates_category ON public.feedback_question_templates(category);
CREATE INDEX idx_templates_department ON public.feedback_question_templates(department);
CREATE INDEX idx_templates_active ON public.feedback_question_templates(is_active);
CREATE INDEX idx_templates_parent ON public.feedback_question_templates(parent_template_id);