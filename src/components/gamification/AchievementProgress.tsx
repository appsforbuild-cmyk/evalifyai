import { motion } from 'framer-motion';
import { Trophy, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { useGamification } from '@/hooks/useGamification';
import { AchievementBadge } from './AchievementBadge';

export const AchievementProgress = () => {
  const { achievements, userAchievements, loading } = useGamification();

  if (loading) {
    return (
      <div className="bg-card rounded-xl border p-5 animate-pulse">
        <div className="h-6 bg-muted rounded w-1/3 mb-4" />
        <div className="space-y-3">
          <div className="h-12 bg-muted rounded" />
          <div className="h-12 bg-muted rounded" />
        </div>
      </div>
    );
  }

  // Get achievements in progress (not earned yet but have some progress)
  const inProgressAchievements = achievements
    .map(achievement => {
      const userAchievement = userAchievements.find(
        ua => ua.achievement_id === achievement.id
      );
      const criteria = achievement.criteria as { type: string; threshold: number } | null;
      const threshold = criteria?.threshold || 100;
      const progress = userAchievement?.progress || 0;
      const progressPercent = Math.min(100, (progress / threshold) * 100);

      return {
        ...achievement,
        progress,
        threshold,
        progressPercent,
        earned: !!userAchievement?.earned_at,
      };
    })
    .filter(a => !a.earned && a.progressPercent > 0)
    .sort((a, b) => b.progressPercent - a.progressPercent)
    .slice(0, 3);

  const earnedCount = userAchievements.filter(ua => ua.earned_at).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Achievement Progress
        </h3>
        <Link
          to="/leaderboards"
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          View All
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        {earnedCount} of {achievements.length} achievements unlocked
      </p>

      {inProgressAchievements.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Start using the app to unlock achievements!
        </p>
      ) : (
        <div className="space-y-4">
          {inProgressAchievements.map(achievement => (
            <div key={achievement.id} className="flex items-center gap-3">
              <AchievementBadge
                achievement={achievement}
                earned={false}
                progress={achievement.progressPercent}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{achievement.name}</p>
                <div className="flex items-center gap-2">
                  <Progress value={achievement.progressPercent} className="h-1.5 flex-1" />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {achievement.progress}/{achievement.threshold}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};
