import { supabase } from '@/integrations/supabase/client';

export const POINT_VALUES = {
  give_feedback: 10,
  receive_feedback: 5,
  complete_goal: 15,
  achieve_milestone: 20,
  give_recognition: 10,
  receive_recognition: 20,
  complete_training: 25,
  high_fairness_bonus: 5,
  create_goal: 5,
  quick_feedback: 10,
} as const;

export const LEVEL_THRESHOLDS = [
  { level: 1, points: 0, rank: 'Beginner' },
  { level: 2, points: 100, rank: 'Contributor' },
  { level: 3, points: 300, rank: 'Achiever' },
  { level: 4, points: 600, rank: 'Champion' },
  { level: 5, points: 1000, rank: 'Expert' },
  { level: 6, points: 1500, rank: 'Master' },
  { level: 7, points: 2500, rank: 'Legend' },
];

export type PointAction = keyof typeof POINT_VALUES;

/**
 * Award points to a user for completing an action
 * This function handles all the database updates including:
 * - Recording the transaction
 * - Updating total/weekly/monthly points
 * - Calculating new level
 */
export const awardPointsToUser = async (
  userId: string,
  actionType: PointAction,
  referenceId?: string
): Promise<{ 
  success: boolean; 
  newTotal?: number; 
  leveledUp?: boolean; 
  newLevel?: number;
  pointsAwarded?: number;
}> => {
  try {
    const points = POINT_VALUES[actionType];
    
    // Record transaction
    await supabase.from('point_transactions').insert({
      user_id: userId,
      points,
      action_type: actionType,
      reference_id: referenceId || null,
    });

    // Get current points
    const { data: currentPoints } = await supabase
      .from('user_points')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    const newTotal = (currentPoints?.total_points || 0) + points;
    const newWeek = (currentPoints?.points_this_week || 0) + points;
    const newMonth = (currentPoints?.points_this_month || 0) + points;

    // Calculate new level
    const newLevelInfo = LEVEL_THRESHOLDS.filter(t => newTotal >= t.points).pop();
    const leveledUp = newLevelInfo && currentPoints && newLevelInfo.level > currentPoints.level;

    // Update or insert points
    await supabase
      .from('user_points')
      .upsert({
        user_id: userId,
        total_points: newTotal,
        points_this_week: newWeek,
        points_this_month: newMonth,
        level: newLevelInfo?.level || 1,
        rank: newLevelInfo?.rank || 'Beginner',
        updated_at: new Date().toISOString(),
      });

    return {
      success: true,
      newTotal,
      leveledUp: !!leveledUp,
      newLevel: newLevelInfo?.level,
      pointsAwarded: points,
    };
  } catch (error) {
    console.error('Error awarding points:', error);
    return { success: false };
  }
};

/**
 * Award points for receiving recognition (called when someone recognizes you)
 */
export const awardRecognitionPoints = async (
  fromUserId: string,
  toUserId: string,
  recognitionId: string
) => {
  // Award points to giver
  await awardPointsToUser(fromUserId, 'give_recognition', recognitionId);
  // Award points to receiver
  await awardPointsToUser(toUserId, 'receive_recognition', recognitionId);
};

/**
 * Check and update achievement progress for a user
 */
export const checkAchievementProgress = async (
  userId: string,
  achievementType: string,
  currentProgress: number
) => {
  try {
    // Get matching achievements
    const { data: achievements } = await supabase
      .from('achievements')
      .select('*');

    if (!achievements) return null;

    const matchingAchievements = achievements.filter(a => {
      const criteria = a.criteria as { type?: string; threshold?: number } | null;
      return criteria?.type === achievementType;
    });

    for (const achievement of matchingAchievements) {
      const criteria = achievement.criteria as { type: string; threshold: number };
      
      // Check if already earned
      const { data: existing } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId)
        .eq('achievement_id', achievement.id)
        .maybeSingle();

      if (existing?.earned_at) continue; // Already earned

      if (currentProgress >= criteria.threshold) {
        // Award achievement
        await supabase.from('user_achievements').upsert({
          user_id: userId,
          achievement_id: achievement.id,
          progress: currentProgress,
          earned_at: new Date().toISOString(),
        });

        return achievement;
      } else {
        // Update progress
        await supabase.from('user_achievements').upsert({
          user_id: userId,
          achievement_id: achievement.id,
          progress: currentProgress,
        });
      }
    }

    return null;
  } catch (error) {
    console.error('Error checking achievement progress:', error);
    return null;
  }
};
