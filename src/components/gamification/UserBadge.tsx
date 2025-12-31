import { motion } from 'framer-motion';
import { Star, Award, Crown, Zap } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface UserBadgeProps {
  level: number;
  rank: string;
  compact?: boolean;
}

const LEVEL_ICONS: Record<number, React.ReactNode> = {
  1: <Star className="w-3 h-3" />,
  2: <Star className="w-3 h-3" />,
  3: <Zap className="w-3 h-3" />,
  4: <Award className="w-3 h-3" />,
  5: <Award className="w-3 h-3" />,
  6: <Crown className="w-3 h-3" />,
  7: <Crown className="w-3 h-3" />,
};

const LEVEL_COLORS: Record<number, string> = {
  1: 'bg-slate-100 text-slate-600 border-slate-300',
  2: 'bg-green-100 text-green-700 border-green-300',
  3: 'bg-blue-100 text-blue-700 border-blue-400',
  4: 'bg-purple-100 text-purple-700 border-purple-400',
  5: 'bg-orange-100 text-orange-700 border-orange-400',
  6: 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border-yellow-400',
  7: 'bg-gradient-to-r from-yellow-200 to-red-200 text-yellow-900 border-yellow-500',
};

export const UserBadge = ({ level, rank, compact = false }: UserBadgeProps) => {
  const icon = LEVEL_ICONS[level] || LEVEL_ICONS[1];
  const color = LEVEL_COLORS[level] || LEVEL_COLORS[1];

  const badge = (
    <motion.span
      whileHover={{ scale: 1.1 }}
      className={`
        inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-xs font-medium
        ${color}
        ${compact ? '' : 'px-2'}
      `}
    >
      {icon}
      {!compact && <span>{level}</span>}
    </motion.span>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{rank}</p>
          <p className="text-xs text-muted-foreground">Level {level}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
