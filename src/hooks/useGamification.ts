import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  points: number;
  rarity: string;
  criteria: unknown;
}

interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
  progress: number;
  is_displayed: boolean;
  achievement?: Achievement;
}

interface UserPoints {
  id: string;
  user_id: string;
  total_points: number;
  points_this_week: number;
  points_this_month: number;
  level: number;
  rank: string;
  gamification_opt_out: boolean;
}

interface PointTransaction {
  id: string;
  user_id: string;
  points: number;
  action_type: string;
  reference_id: string | null;
  created_at: string;
}

export const POINT_VALUES = {
  give_feedback: 10,
  receive_feedback: 5,
  complete_goal: 15,
  achieve_milestone: 20,
  give_recognition: 10,
  receive_recognition: 20,
  complete_training: 25,
  high_fairness_bonus: 5,
};

export const LEVEL_THRESHOLDS = [
  { level: 1, points: 0, rank: 'Beginner' },
  { level: 2, points: 100, rank: 'Contributor' },
  { level: 3, points: 300, rank: 'Achiever' },
  { level: 4, points: 600, rank: 'Champion' },
  { level: 5, points: 1000, rank: 'Expert' },
  { level: 6, points: 1500, rank: 'Master' },
  { level: 7, points: 2500, rank: 'Legend' },
];

export const useGamification = () => {
  const { user } = useAuth();
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<PointTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchGamificationData();
    }
  }, [user]);

  const fetchGamificationData = async () => {
    if (!user) return;

    try {
      // Fetch or create user points
      const { data: pointsData, error: pointsError } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!pointsData && !pointsError) {
        // Create initial points record
        const { data: newPoints } = await supabase
          .from('user_points')
          .insert({ user_id: user.id })
          .select()
          .single();
        setUserPoints(newPoints);
      } else {
        setUserPoints(pointsData);
      }

      // Fetch all achievements
      const { data: achievementsData } = await supabase
        .from('achievements')
        .select('*')
        .order('points', { ascending: true });

      setAchievements(achievementsData || []);

      // Fetch user achievements
      const { data: userAchievementsData } = await supabase
        .from('user_achievements')
        .select('*, achievement:achievements(*)')
        .eq('user_id', user.id);

      setUserAchievements(userAchievementsData || []);

      // Fetch recent transactions
      const { data: transactionsData } = await supabase
        .from('point_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      setRecentTransactions(transactionsData || []);
    } catch (error) {
      console.error('Error fetching gamification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const awardPoints = async (
    actionType: keyof typeof POINT_VALUES,
    referenceId?: string
  ): Promise<{ newTotal: number; leveledUp: boolean; newLevel?: number }> => {
    if (!user) throw new Error('User not authenticated');

    const points = POINT_VALUES[actionType];
    
    // Record transaction
    await supabase.from('point_transactions').insert({
      user_id: user.id,
      points,
      action_type: actionType,
      reference_id: referenceId || null,
    });

    // Get current points
    const { data: currentPoints } = await supabase
      .from('user_points')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const newTotal = (currentPoints?.total_points || 0) + points;
    const newWeek = (currentPoints?.points_this_week || 0) + points;
    const newMonth = (currentPoints?.points_this_month || 0) + points;

    // Calculate new level
    const newLevel = LEVEL_THRESHOLDS.filter(t => newTotal >= t.points).pop();
    const leveledUp = newLevel && currentPoints && newLevel.level > currentPoints.level;

    // Update points
    await supabase
      .from('user_points')
      .upsert({
        user_id: user.id,
        total_points: newTotal,
        points_this_week: newWeek,
        points_this_month: newMonth,
        level: newLevel?.level || 1,
        rank: newLevel?.rank || 'Beginner',
        updated_at: new Date().toISOString(),
      });

    await fetchGamificationData();

    return {
      newTotal,
      leveledUp: !!leveledUp,
      newLevel: newLevel?.level,
    };
  };

  const checkAndAwardAchievement = async (
    achievementType: string,
    currentProgress: number
  ): Promise<Achievement | null> => {
    if (!user) return null;

    const matchingAchievements = achievements.filter(
      a => (a.criteria as { type: string; threshold: number }).type === achievementType
    );

    for (const achievement of matchingAchievements) {
      const criteria = achievement.criteria as { type: string; threshold: number };
      const existingAchievement = userAchievements.find(
        ua => ua.achievement_id === achievement.id
      );

      if (existingAchievement?.earned_at) continue; // Already earned

      if (currentProgress >= criteria.threshold) {
        // Award achievement
        await supabase.from('user_achievements').upsert({
          user_id: user.id,
          achievement_id: achievement.id,
          progress: currentProgress,
          earned_at: new Date().toISOString(),
        });

        // Award achievement points
        await awardPoints('complete_training'); // Generic points for achievements

        await fetchGamificationData();
        return achievement;
      } else {
        // Update progress
        await supabase.from('user_achievements').upsert({
          user_id: user.id,
          achievement_id: achievement.id,
          progress: currentProgress,
        });
      }
    }

    return null;
  };

  const getNextLevelProgress = () => {
    if (!userPoints) return { current: 0, target: 100, percentage: 0 };

    const currentLevel = LEVEL_THRESHOLDS.find(t => t.level === userPoints.level);
    const nextLevel = LEVEL_THRESHOLDS.find(t => t.level === userPoints.level + 1);

    if (!nextLevel) return { current: userPoints.total_points, target: userPoints.total_points, percentage: 100 };

    const currentThreshold = currentLevel?.points || 0;
    const pointsInLevel = userPoints.total_points - currentThreshold;
    const pointsNeeded = nextLevel.points - currentThreshold;

    return {
      current: pointsInLevel,
      target: pointsNeeded,
      percentage: Math.min(100, (pointsInLevel / pointsNeeded) * 100),
    };
  };

  const toggleDisplayedAchievement = async (achievementId: string, isDisplayed: boolean) => {
    if (!user) return;

    await supabase
      .from('user_achievements')
      .update({ is_displayed: isDisplayed })
      .eq('user_id', user.id)
      .eq('achievement_id', achievementId);

    await fetchGamificationData();
  };

  const toggleOptOut = async (optOut: boolean) => {
    if (!user) return;

    await supabase
      .from('user_points')
      .update({ gamification_opt_out: optOut })
      .eq('user_id', user.id);

    await fetchGamificationData();
  };

  return {
    userPoints,
    achievements,
    userAchievements,
    recentTransactions,
    loading,
    awardPoints,
    checkAndAwardAchievement,
    getNextLevelProgress,
    toggleDisplayedAchievement,
    toggleOptOut,
    refetch: fetchGamificationData,
  };
};
