import { createContext, useContext, useState, ReactNode } from 'react';
import { AchievementToast } from './AchievementToast';
import { LevelUpToast } from './LevelUpToast';
import { PointsEarnedToast } from './PointsEarnedToast';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  rarity: string;
}

interface GamificationContextType {
  showAchievement: (achievement: Achievement) => void;
  showLevelUp: (level: number) => void;
  showPointsEarned: (points: number, action?: string) => void;
}

const GamificationContext = createContext<GamificationContextType | null>(null);

export const useGamificationToasts = () => {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamificationToasts must be used within GamificationProvider');
  }
  return context;
};

interface GamificationProviderProps {
  children: ReactNode;
}

export const GamificationProvider = ({ children }: GamificationProviderProps) => {
  const [achievement, setAchievement] = useState<Achievement | null>(null);
  const [levelUp, setLevelUp] = useState<number | null>(null);
  const [pointsEarned, setPointsEarned] = useState<{ points: number; action?: string } | null>(null);

  const showAchievement = (newAchievement: Achievement) => {
    setAchievement(newAchievement);
  };

  const showLevelUp = (level: number) => {
    setLevelUp(level);
  };

  const showPointsEarned = (points: number, action?: string) => {
    setPointsEarned({ points, action });
  };

  return (
    <GamificationContext.Provider value={{ showAchievement, showLevelUp, showPointsEarned }}>
      {children}
      
      <AchievementToast
        achievement={achievement}
        onClose={() => setAchievement(null)}
      />
      
      <LevelUpToast
        newLevel={levelUp}
        onClose={() => setLevelUp(null)}
      />
      
      <PointsEarnedToast
        points={pointsEarned?.points || null}
        action={pointsEarned?.action}
        onClose={() => setPointsEarned(null)}
      />
    </GamificationContext.Provider>
  );
};
