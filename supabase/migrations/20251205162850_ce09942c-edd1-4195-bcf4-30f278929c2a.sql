-- Drop existing policies on feedback_entries
DROP POLICY IF EXISTS "Users can view feedback for their sessions" ON public.feedback_entries;
DROP POLICY IF EXISTS "Managers can update feedback" ON public.feedback_entries;
DROP POLICY IF EXISTS "System can insert feedback" ON public.feedback_entries;

-- Add ON DELETE CASCADE to the foreign key if not already present
-- First drop the existing constraint and recreate with CASCADE
ALTER TABLE public.feedback_entries 
DROP CONSTRAINT IF EXISTS feedback_entries_session_id_fkey;

ALTER TABLE public.feedback_entries
ADD CONSTRAINT feedback_entries_session_id_fkey 
FOREIGN KEY (session_id) 
REFERENCES public.voice_sessions(id) 
ON DELETE CASCADE;

-- Add NOT NULL constraint to session_id if not already present
ALTER TABLE public.feedback_entries 
ALTER COLUMN session_id SET NOT NULL;

-- Create more explicit RLS policies with clear access rules

-- Policy: Managers can view feedback for sessions they created
CREATE POLICY "Managers can view their feedback"
ON public.feedback_entries
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.voice_sessions vs
    WHERE vs.id = feedback_entries.session_id
    AND vs.manager_id = auth.uid()
  )
);

-- Policy: Employees can view published feedback about them
CREATE POLICY "Employees can view their published feedback"
ON public.feedback_entries
FOR SELECT
USING (
  feedback_entries.is_published = true
  AND EXISTS (
    SELECT 1 FROM public.voice_sessions vs
    WHERE vs.id = feedback_entries.session_id
    AND vs.employee_id = auth.uid()
  )
);

-- Policy: HR can view all published feedback
CREATE POLICY "HR can view all published feedback"
ON public.feedback_entries
FOR SELECT
USING (
  feedback_entries.is_published = true
  AND has_role(auth.uid(), 'hr'::app_role)
);

-- Policy: Managers can insert feedback for their sessions
CREATE POLICY "Managers can insert feedback"
ON public.feedback_entries
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.voice_sessions vs
    WHERE vs.id = feedback_entries.session_id
    AND vs.manager_id = auth.uid()
  )
);

-- Policy: Managers can update feedback for their sessions
CREATE POLICY "Managers can update their feedback"
ON public.feedback_entries
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.voice_sessions vs
    WHERE vs.id = feedback_entries.session_id
    AND vs.manager_id = auth.uid()
  )
);