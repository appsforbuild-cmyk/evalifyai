import { motion, AnimatePresence } from 'framer-motion';
import { Star, Coins } from 'lucide-react';

interface PointsEarnedToastProps {
  points: number | null;
  action?: string;
  onClose: () => void;
}

export const PointsEarnedToast = ({ points, action, onClose }: PointsEarnedToastProps) => {
  if (!points) return null;

  return (
    <AnimatePresence>
      {points && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          onAnimationComplete={() => {
            setTimeout(onClose, 2000);
          }}
          className="fixed bottom-24 right-6 z-50"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full shadow-lg"
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 0.5 }}
            >
              <Coins className="w-6 h-6" />
            </motion.div>
            <div>
              <p className="font-bold text-lg">+{points} points!</p>
              {action && <p className="text-xs text-white/80">{action}</p>}
            </div>
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 0.5, repeat: 2 }}
            >
              <Star className="w-5 h-5 fill-current" />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
