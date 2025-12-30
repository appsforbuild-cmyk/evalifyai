export interface QuestionRecording {
  questionId: string;
  questionText: string;
  audioPath: string | null;
  audioUrl?: string;
  transcript: string | null;
  duration: number;
  recordedAt: string | null;
}

export interface PerQuestionSession {
  id: string;
  title: string;
  description: string | null;
  employee_id: string;
  manager_id: string;
  recording_mode: 'full' | 'per_question';
  question_recordings: QuestionRecording[];
  current_question_index: number;
  is_complete: boolean;
  status: string;
  audio_url: string | null;
  transcript: string | null;
  created_at: string;
  updated_at: string;
}
