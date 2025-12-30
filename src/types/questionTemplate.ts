export interface TemplateQuestion {
  id: string;
  text: string;
  type: 'text' | 'rating' | 'multiple_choice';
  required: boolean;
  voiceEnabled: boolean;
  options?: string[];
}

export interface QuestionTemplate {
  id: string;
  title: string;
  description: string | null;
  questions: TemplateQuestion[];
  category: 'performance' | 'technical' | 'leadership' | 'custom';
  department: string | null;
  is_default: boolean;
  is_active: boolean;
  version: number;
  parent_template_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuestionTemplateFormData {
  title: string;
  description: string;
  category: 'performance' | 'technical' | 'leadership' | 'custom';
  department: string | null;
  is_default: boolean;
  questions: TemplateQuestion[];
}

export const TEMPLATE_CATEGORIES = [
  { value: 'performance', label: 'Performance' },
  { value: 'technical', label: 'Technical' },
  { value: 'leadership', label: 'Leadership' },
  { value: 'custom', label: 'Custom' },
] as const;

export const QUESTION_TYPES = [
  { value: 'text', label: 'Text Response' },
  { value: 'rating', label: 'Rating Scale' },
  { value: 'multiple_choice', label: 'Multiple Choice' },
] as const;
