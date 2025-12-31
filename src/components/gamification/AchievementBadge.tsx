import { motion } from 'framer-motion';
import { 
  Trophy, Star, Target, Flame, ShieldCheck, Users, Clock, 
  Brain, Gift, CalendarCheck, Flag, Award, MessageSquare, Mic, Zap,
  LucideIcon
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  rarity: string;
}

interface AchievementBadgeProps {
  achievement: Achievement;
  earned?: boolean;
  progress?: number;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

const ICON_MAP: Record<string, LucideIcon> = {
  'trophy': Trophy,
  'star': Star,
  'target': Target,
  'flame': Flame,
  'shield-check': ShieldCheck,
  'users': Users,
  'clock': Clock,
  'brain': Brain,
  'gift': Gift,
  'calendar-check': CalendarCheck,
  'flag': Flag,
  'award': Award,
  'message-square': MessageSquare,
  'message-circle': MessageSquare,
  'mic': Mic,
  'zap': Zap,
};

const RARITY_STYLES: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  common: { bg: 'bg-slate-100', border: 'border-slate-300', text: 'text-slate-600', glow: '' },
  rare: { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-600', glow: 'shadow-blue-200' },
  epic: { bg: 'bg-purple-100', border: 'border-purple-500', text: 'text-purple-600', glow: 'shadow-purple-300' },
  legendary: { bg: 'bg-gradient-to-br from-yellow-100 to-orange-100', border: 'border-yellow-500', text: 'text-yellow-600', glow: 'shadow-yellow-300' },
};

const SIZE_CLASSES = {
  sm: 'w-8 h-8 p-1.5',
  md: 'w-12 h-12 p-2.5',
  lg: 'w-16 h-16 p-3.5',
};

const ICON_SIZE_CLASSES = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

export const AchievementBadge = ({ 
  achievement, 
  earned = true, 
  progress = 0,
  size = 'md',
  showTooltip = true 
}: AchievementBadgeProps) => {
  const Icon = ICON_MAP[achievement.icon] || Trophy;
  const style = RARITY_STYLES[achievement.rarity] || RARITY_STYLES.common;

  const badge = (
    <motion.div
      whileHover={{ scale: 1.1 }}
      className={`
        relative rounded-full border-2 flex items-center justify-center
        ${SIZE_CLASSES[size]}
        ${earned ? style.bg : 'bg-muted'}
        ${earned ? style.border : 'border-muted-foreground/30'}
        ${earned ? `shadow-lg ${style.glow}` : 'opacity-50'}
        transition-all duration-200
      `}
    >
      <Icon className={`${ICON_SIZE_CLASSES[size]} ${earned ? style.text : 'text-muted-foreground'}`} />
      
      {!earned && progress > 0 && (
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 36 36">
          <path
            className="text-primary/30"
            strokeWidth="3"
            stroke="currentColor"
            fill="none"
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path
            className="text-primary"
            strokeWidth="3"
            strokeDasharray={`${progress}, 100`}
            stroke="currentColor"
            fill="none"
            strokeLinecap="round"
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
      )}

      {achievement.rarity === 'legendary' && earned && (
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-yellow-400/50"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </motion.div>
  );

  if (!showTooltip) return badge;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-1">
            <div className="font-semibold flex items-center gap-2">
              {achievement.name}
              <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                achievement.rarity === 'legendary' ? 'bg-yellow-200 text-yellow-800' :
                achievement.rarity === 'epic' ? 'bg-purple-200 text-purple-800' :
                achievement.rarity === 'rare' ? 'bg-blue-200 text-blue-800' :
                'bg-slate-200 text-slate-800'
              }`}>
                {achievement.rarity}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{achievement.description}</p>
            <p className="text-xs text-primary font-medium">+{achievement.points} points</p>
            {!earned && progress > 0 && (
              <p className="text-xs text-muted-foreground">Progress: {progress}%</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
