import { motion } from 'framer-motion';
import { Star, TrendingUp, Award } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useGamification, LEVEL_THRESHOLDS } from '@/hooks/useGamification';

interface PointsDisplayProps {
  compact?: boolean;
}

export const PointsDisplay = ({ compact = false }: PointsDisplayProps) => {
  const { userPoints, loading, getNextLevelProgress } = useGamification();
  const levelProgress = getNextLevelProgress();

  if (loading || !userPoints) {
    return (
      <div className="animate-pulse bg-muted rounded-lg h-20" />
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10">
        <Star className="w-4 h-4 text-primary" />
        <span className="font-semibold text-sm">{userPoints.total_points}</span>
        <span className="text-xs text-muted-foreground">pts</span>
        <div className="w-px h-4 bg-border" />
        <span className="text-xs font-medium">Lv.{userPoints.level}</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border p-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            {userPoints.rank}
          </h3>
          <p className="text-sm text-muted-foreground">Level {userPoints.level}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary">{userPoints.total_points}</div>
          <p className="text-sm text-muted-foreground">total points</p>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Progress to Level {userPoints.level + 1}</span>
          <span className="font-medium">{Math.round(levelProgress.percentage)}%</span>
        </div>
        <Progress value={levelProgress.percentage} className="h-2" />
        <p className="text-xs text-muted-foreground text-center">
          {levelProgress.current} / {levelProgress.target} points
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="font-semibold">{userPoints.points_this_week}</span>
          </div>
          <p className="text-xs text-muted-foreground">This Week</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
            <Star className="w-4 h-4" />
            <span className="font-semibold">{userPoints.points_this_month}</span>
          </div>
          <p className="text-xs text-muted-foreground">This Month</p>
        </div>
      </div>
    </motion.div>
  );
};
