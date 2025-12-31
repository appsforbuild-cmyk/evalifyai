import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { ArrowUp, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LEVEL_THRESHOLDS } from '@/hooks/useGamification';

interface LevelUpToastProps {
  newLevel: number | null;
  onClose: () => void;
}

export const LevelUpToast = ({ newLevel, onClose }: LevelUpToastProps) => {
  const levelInfo = LEVEL_THRESHOLDS.find(t => t.level === newLevel);

  useEffect(() => {
    if (newLevel) {
      // Fire golden confetti
      const duration = 4000;
      const colors = ['#ffd700', '#ffcc00', '#ff9900', '#ffffff'];
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors,
      });

      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors,
        });
      }, 250);

      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors,
        });
      }, 400);
    }
  }, [newLevel]);

  return (
    <AnimatePresence>
      {newLevel && levelInfo && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.5, y: 100 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.5, y: 100 }}
            transition={{ type: 'spring', damping: 15 }}
            className="relative p-10 rounded-3xl bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 shadow-2xl max-w-md mx-4"
            onClick={e => e.stopPropagation()}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 rounded-3xl border-4 border-yellow-300/50"
            />

            <div className="relative flex flex-col items-center text-center text-white">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="mb-4"
              >
                <ArrowUp className="w-16 h-16" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h2 className="text-3xl font-bold mb-2 flex items-center gap-2">
                  <Sparkles className="w-8 h-8" />
                  LEVEL UP!
                  <Sparkles className="w-8 h-8" />
                </h2>
              </motion.div>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: 'spring' }}
                className="my-6"
              >
                <div className="text-8xl font-black">{newLevel}</div>
                <div className="text-2xl font-semibold mt-2">{levelInfo.rank}</div>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="text-white/90 mb-6"
              >
                Keep up the great work! You're making a difference.
              </motion.p>

              <Button
                onClick={onClose}
                className="bg-white text-orange-600 hover:bg-white/90"
              >
                Continue
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
