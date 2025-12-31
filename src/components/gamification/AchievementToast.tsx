import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { 
  Trophy, Star, Target, Flame, ShieldCheck, Users, Clock, 
  Brain, Gift, CalendarCheck, Flag, Award, MessageSquare, Mic, Zap 
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  rarity: string;
}

interface AchievementToastProps {
  achievement: Achievement | null;
  onClose: () => void;
  onShare?: () => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  'trophy': <Trophy className="w-12 h-12" />,
  'star': <Star className="w-12 h-12" />,
  'target': <Target className="w-12 h-12" />,
  'flame': <Flame className="w-12 h-12" />,
  'shield-check': <ShieldCheck className="w-12 h-12" />,
  'users': <Users className="w-12 h-12" />,
  'clock': <Clock className="w-12 h-12" />,
  'brain': <Brain className="w-12 h-12" />,
  'gift': <Gift className="w-12 h-12" />,
  'calendar-check': <CalendarCheck className="w-12 h-12" />,
  'flag': <Flag className="w-12 h-12" />,
  'award': <Award className="w-12 h-12" />,
  'message-square': <MessageSquare className="w-12 h-12" />,
  'message-circle': <MessageSquare className="w-12 h-12" />,
  'mic': <Mic className="w-12 h-12" />,
  'zap': <Zap className="w-12 h-12" />,
};

const RARITY_COLORS: Record<string, { bg: string; border: string; glow: string }> = {
  common: { bg: 'bg-slate-100', border: 'border-slate-300', glow: 'shadow-slate-200' },
  rare: { bg: 'bg-blue-100', border: 'border-blue-400', glow: 'shadow-blue-300' },
  epic: { bg: 'bg-purple-100', border: 'border-purple-500', glow: 'shadow-purple-400' },
  legendary: { bg: 'bg-gradient-to-br from-yellow-100 to-orange-100', border: 'border-yellow-500', glow: 'shadow-yellow-400' },
};

export const AchievementToast = ({ achievement, onClose, onShare }: AchievementToastProps) => {
  useEffect(() => {
    if (achievement) {
      // Fire confetti
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          clearInterval(interval);
          return;
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [achievement]);

  const rarityStyle = achievement ? RARITY_COLORS[achievement.rarity] : RARITY_COLORS.common;

  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: -50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -50 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={onClose}
        >
          <motion.div
            initial={{ rotateY: -180 }}
            animate={{ rotateY: 0 }}
            transition={{ duration: 0.6, type: 'spring' }}
            className={`relative p-8 rounded-2xl ${rarityStyle.bg} border-4 ${rarityStyle.border} shadow-2xl ${rarityStyle.glow} max-w-md mx-4`}
            onClick={e => e.stopPropagation()}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              className="flex flex-col items-center text-center"
            >
              <div className="mb-4 p-4 rounded-full bg-white shadow-lg">
                <div className={achievement.rarity === 'legendary' ? 'text-yellow-500' : 
                  achievement.rarity === 'epic' ? 'text-purple-500' : 
                  achievement.rarity === 'rare' ? 'text-blue-500' : 'text-slate-500'}>
                  {ICON_MAP[achievement.icon] || <Trophy className="w-12 h-12" />}
                </div>
              </div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-2xl font-bold text-foreground mb-2"
              >
                Achievement Unlocked!
              </motion.h2>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <h3 className="text-xl font-semibold text-foreground mb-1">
                  {achievement.name}
                </h3>
                <p className="text-muted-foreground mb-4">{achievement.description}</p>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                    achievement.rarity === 'legendary' ? 'bg-yellow-200 text-yellow-800' :
                    achievement.rarity === 'epic' ? 'bg-purple-200 text-purple-800' :
                    achievement.rarity === 'rare' ? 'bg-blue-200 text-blue-800' :
                    'bg-slate-200 text-slate-800'
                  }`}>
                    {achievement.rarity}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-green-200 text-green-800 text-sm font-medium">
                    +{achievement.points} points
                  </span>
                </div>
              </motion.div>

              <div className="flex gap-3">
                {onShare && (
                  <Button variant="outline" onClick={onShare}>
                    Share with Team
                  </Button>
                )}
                <Button onClick={onClose}>
                  Awesome!
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
