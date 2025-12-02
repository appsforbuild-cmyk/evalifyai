-- Create feedback_audit table for tracking changes
CREATE TABLE public.feedback_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feedback_id UUID NOT NULL REFERENCES public.feedback_entries(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'published', 'unpublished', 'edited', 'tone_changed'
  previous_content TEXT,
  new_content TEXT,
  previous_tone TEXT,
  new_tone TEXT,
  performed_by UUID NOT NULL,
  performed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  can_undo_until TIMESTAMP WITH TIME ZONE, -- For 10-minute undo window
  is_undone BOOLEAN DEFAULT false,
  metadata JSONB
);

-- Enable RLS
ALTER TABLE public.feedback_audit ENABLE ROW LEVEL SECURITY;

-- Managers can view audit logs for their feedback
CREATE POLICY "Managers can view their feedback audits"
ON public.feedback_audit
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM feedback_entries fe
    JOIN voice_sessions vs ON fe.session_id = vs.id
    WHERE fe.id = feedback_audit.feedback_id
    AND vs.manager_id = auth.uid()
  )
);

-- Managers can create audit entries for their feedback
CREATE POLICY "Managers can create audit entries"
ON public.feedback_audit
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM feedback_entries fe
    JOIN voice_sessions vs ON fe.session_id = vs.id
    WHERE fe.id = feedback_id
    AND vs.manager_id = auth.uid()
  )
);

-- Managers can update audit entries (for undo)
CREATE POLICY "Managers can update audit entries"
ON public.feedback_audit
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM feedback_entries fe
    JOIN voice_sessions vs ON fe.session_id = vs.id
    WHERE fe.id = feedback_audit.feedback_id
    AND vs.manager_id = auth.uid()
  )
);

-- HR can view all audit logs
CREATE POLICY "HR can view all audits"
ON public.feedback_audit
FOR SELECT
USING (has_role(auth.uid(), 'hr'));

-- Create index for faster lookups
CREATE INDEX idx_feedback_audit_feedback_id ON public.feedback_audit(feedback_id);
CREATE INDEX idx_feedback_audit_performed_at ON public.feedback_audit(performed_at DESC);