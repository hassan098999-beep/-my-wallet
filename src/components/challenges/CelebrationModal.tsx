import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Sparkles, Award, Star, X, CheckCircle2 } from 'lucide-react';
import { WeeklyChallenge } from '../../types';
import { formatCurrency, hapticFeedback } from '../../utils';
import { useAppContext } from '../../store/AppContext';

interface CelebrationModalProps {
  challenge: WeeklyChallenge | null;
  onClose: () => void;
}

export const CelebrationModal: React.FC<CelebrationModalProps> = ({ challenge, onClose }) => {
  const { currency } = useAppContext();

  useEffect(() => {
    if (challenge) {
      hapticFeedback('heavy');
    }
  }, [challenge]);

  if (!challenge) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-amber-500/30 text-center relative overflow-hidden"
          dir="rtl"
        >
          {/* Ambient Confetti Light Animation */}
          <div className="absolute -top-12 -left-12 w-36 h-36 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-36 h-36 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white bg-slate-100 dark:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>

          {/* Golden Trophy Animation */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
            className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 flex items-center justify-center text-white shadow-xl shadow-amber-500/30 mb-4 ring-8 ring-amber-400/10"
          >
            <Trophy size={48} className="text-white drop-shadow-md" />
          </motion.div>

          <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-black px-3 py-1 rounded-full mb-2">
            <Sparkles size={13} />
            إنجاز أسبوعي رائع ومستحق!
          </span>

          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">
            ألف مبروك! 🎉
          </h2>
          
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-6">
            لقد أكملت بنجاح <span className="text-emerald-600 dark:text-emerald-400">"{challenge.title}"</span> وحققت التزاماً استثنائياً هذا الأسبوع!
          </p>

          {/* Rewards Grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-amber-50 dark:bg-amber-950/30 p-3.5 rounded-2xl border border-amber-500/20 text-center">
              <span className="text-[11px] font-black text-amber-600 dark:text-amber-400 block mb-0.5">
                النقاط المكتسبة
              </span>
              <span className="text-xl font-black text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1">
                +{challenge.rewardPoints} 🌟
              </span>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3.5 rounded-2xl border border-emerald-500/20 text-center">
              <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 block mb-0.5">
                الوفر المحقق
              </span>
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                ~{formatCurrency(challenge.totalSavedSoFar, currency)}
              </span>
            </div>
          </div>

          {/* Badge Unlocked Notification */}
          <div className="bg-purple-50 dark:bg-purple-950/30 p-3.5 rounded-2xl border border-purple-500/20 flex items-center gap-3 text-right mb-6">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Award size={22} />
            </div>
            <div>
              <span className="text-[10px] font-black text-purple-500 block">
                تم فتح وسام جديد 🎖️
              </span>
              <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                {challenge.badgeName}
              </span>
            </div>
          </div>

          {/* Button */}
          <button
            onClick={onClose}
            className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-sm shadow-lg shadow-emerald-500/25 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <CheckCircle2 size={18} />
            رائع، استمر في التحديات!
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
