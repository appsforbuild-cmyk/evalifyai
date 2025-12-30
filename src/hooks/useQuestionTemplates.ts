import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { QuestionTemplate, TemplateQuestion } from '@/types/questionTemplate';
import { toast } from 'sonner';

export function useQuestionTemplates() {
  const [templates, setTemplates] = useState<QuestionTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('feedback_question_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
      toast.error('Failed to load templates');
    } else {
      // Parse questions JSON and cast to proper types
      const parsed = (data || []).map((t) => ({
        ...t,
        questions: (t.questions as unknown as TemplateQuestion[]) || [],
        category: t.category as QuestionTemplate['category'],
      }));
      setTemplates(parsed);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const createTemplate = async (template: Omit<QuestionTemplate, 'id' | 'created_at' | 'updated_at' | 'version' | 'parent_template_id'>) => {
    const { data, error } = await supabase
      .from('feedback_question_templates')
      .insert([{
        title: template.title,
        description: template.description,
        questions: JSON.parse(JSON.stringify(template.questions)),
        category: template.category,
        department: template.department,
        is_default: template.is_default,
        is_active: template.is_active,
        created_by: template.created_by,
      }])
      .select()
      .single();

    if (error) {
      toast.error('Failed to create template');
      return null;
    }

    toast.success('Template created successfully');
    await fetchTemplates();
    return data;
  };

  const updateTemplate = async (id: string, updates: Partial<QuestionTemplate>, createNewVersion = false) => {
    if (createNewVersion) {
      // Find current template to get parent info
      const current = templates.find(t => t.id === id);
      if (!current) return null;

      // Create new version
      const { data, error } = await supabase
        .from('feedback_question_templates')
        .insert([{
          title: updates.title ?? current.title,
          description: updates.description ?? current.description,
          questions: JSON.parse(JSON.stringify(updates.questions ?? current.questions)),
          category: updates.category ?? current.category,
          department: updates.department ?? current.department,
          is_default: updates.is_default ?? current.is_default,
          is_active: updates.is_active ?? current.is_active,
          created_by: current.created_by,
          version: current.version + 1,
          parent_template_id: current.parent_template_id || current.id,
        }])
        .select()
        .single();

      if (error) {
        toast.error('Failed to create new version');
        return null;
      }

      // Deactivate old version
      await supabase
        .from('feedback_question_templates')
        .update({ is_active: false })
        .eq('id', id);

      toast.success('New version created');
      await fetchTemplates();
      return data;
    }

    // Simple update without versioning
    const updatePayload: Record<string, unknown> = { ...updates };
    if (updates.questions) {
      updatePayload.questions = JSON.parse(JSON.stringify(updates.questions));
    }
    
    const { data, error } = await supabase
      .from('feedback_question_templates')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      toast.error('Failed to update template');
      return null;
    }

    toast.success('Template updated');
    await fetchTemplates();
    return data;
  };

  const deleteTemplate = async (id: string) => {
    const { error } = await supabase
      .from('feedback_question_templates')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete template');
      return false;
    }

    toast.success('Template deleted');
    await fetchTemplates();
    return true;
  };

  const getVersionHistory = async (templateId: string): Promise<QuestionTemplate[]> => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return [];

    const parentId = template.parent_template_id || template.id;

    const { data, error } = await supabase
      .from('feedback_question_templates')
      .select('*')
      .or(`id.eq.${parentId},parent_template_id.eq.${parentId}`)
      .order('version', { ascending: false });

    if (error) {
      toast.error('Failed to load version history');
      return [];
    }

    return (data || []).map((t) => ({
      ...t,
      questions: (t.questions as unknown as TemplateQuestion[]) || [],
      category: t.category as QuestionTemplate['category'],
    }));
  };

  return {
    templates,
    loading,
    error,
    refetch: fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    getVersionHistory,
  };
}
