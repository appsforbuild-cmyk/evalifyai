-- Create feedback_questions table for global question templates
CREATE TABLE public.feedback_questions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_text text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feedback_questions ENABLE ROW LEVEL SECURITY;

-- Policies: Admins can manage, everyone can view active questions
CREATE POLICY "Admins can manage questions"
ON public.feedback_questions
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view active questions"
ON public.feedback_questions
FOR SELECT
TO authenticated
USING (is_active = true);

-- Update trigger for updated_at
CREATE TRIGGER update_feedback_questions_updated_at
BEFORE UPDATE ON public.feedback_questions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Allow admins to view all user_roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Allow admins to manage user_roles
CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Insert default OKR/KRA feedback questions
INSERT INTO public.feedback_questions (question_text, category, display_order) VALUES
('How well did the employee meet their key objectives this period?', 'OKR Achievement', 1),
('What specific results or outcomes demonstrate their performance against KRAs?', 'KRA Performance', 2),
('How effectively did they collaborate with team members and stakeholders?', 'Collaboration', 3),
('What growth or skill development have you observed?', 'Growth & Development', 4),
('What areas require improvement or additional support?', 'Areas for Improvement', 5);