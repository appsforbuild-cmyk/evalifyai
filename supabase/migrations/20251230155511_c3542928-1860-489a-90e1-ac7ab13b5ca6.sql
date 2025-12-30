-- Add question_recordings column to voice_sessions for per-question recording support
ALTER TABLE public.voice_sessions
ADD COLUMN question_recordings JSONB DEFAULT '[]'::jsonb,
ADD COLUMN recording_mode TEXT DEFAULT 'full',
ADD COLUMN is_complete BOOLEAN DEFAULT false,
ADD COLUMN current_question_index INTEGER DEFAULT 0;

-- Add index for querying incomplete sessions
CREATE INDEX idx_voice_sessions_incomplete ON public.voice_sessions(manager_id, is_complete) WHERE is_complete = false;

-- Add comment for documentation
COMMENT ON COLUMN public.voice_sessions.question_recordings IS 'Array of {questionId, questionText, audioPath, transcript, duration, recordedAt} for per-question mode';
COMMENT ON COLUMN public.voice_sessions.recording_mode IS 'Either "full" for single recording or "per_question" for individual recordings';