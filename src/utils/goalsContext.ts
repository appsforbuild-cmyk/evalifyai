import { supabase } from '@/integrations/supabase/client';

interface Goal {
  id: string;
  title: string;
  description: string | null;
  status: string;
  progress: number;
  category: string;
}

/**
 * Fetches goals for a given profile ID to provide context for AI feedback generation.
 * Returns an empty array if no goals exist or if there's an error.
 * This function is designed to be non-breaking - it never throws errors.
 */
export async function fetchGoalsForFeedbackContext(profileId: string): Promise<Goal[]> {
  try {
    const { data, error } = await supabase
      .from('goals')
      .select('id, title, description, status, progress, category')
      .eq('profile_id', profileId)
      .in('status', ['active', 'completed'])
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.warn('Failed to fetch goals for feedback context:', error);
      return [];
    }

    return data as Goal[] || [];
  } catch (error) {
    console.warn('Error fetching goals for feedback context:', error);
    return [];
  }
}

/**
 * Formats goals into a string that can be appended to AI prompts.
 * Returns empty string if no goals are provided.
 */
export function formatGoalsForPrompt(goals: Goal[]): string {
  if (!goals || goals.length === 0) {
    return '';
  }

  const goalsText = goals.map(goal => {
    const progressText = goal.status === 'completed' ? 'Completed' : `${goal.progress}% progress`;
    return `- ${goal.title} (${goal.category}, ${progressText})${goal.description ? `: ${goal.description}` : ''}`;
  }).join('\n');

  return `

## Employee's Current Goals and OKRs:
${goalsText}

Please consider these goals when providing feedback and align recommendations with the employee's objectives where relevant.`;
}

/**
 * Combined utility to fetch and format goals for AI prompt context.
 * Returns empty string if no goals exist - safe to append to any prompt.
 */
export async function getGoalsContextForPrompt(profileId: string): Promise<string> {
  const goals = await fetchGoalsForFeedbackContext(profileId);
  return formatGoalsForPrompt(goals);
}