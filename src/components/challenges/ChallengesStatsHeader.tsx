import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Flame, Trophy, PiggyBank, Target, Calendar, Plus, RefreshCw } from 'lucide-react';
import { formatCurrency } from '../../utils';
import { useAppContext } from '../../store/AppContext';

interface ChallengesStatsHeaderProps {
  points: number;
  maxStreak: number;
  totalSaved: number;
  completedCount: number;
  activeCount: number;
  weekRangeStr: string;
  onOpenCustomModal: () => void;
  onResetToDefault: () => void;
}

export const ChallengesStatsHeader: React.FC<ChallengesStatsHeaderProps> = ({
  points,
  maxStreak,
  totalSaved,
  completedCount,
  activeCount,
  weekRangeStr,
  onOpenCustomModal,
  onResetToDefault
}) => {
  const { currency } = useAppContext();

  return (
    <div className="space-y-4">
      {/* Top Banner / Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 p-5 md:p-6 rounded-3xl text-white shadow-xl shadow-emerald-900/10 relative overflow-hidden">
        {/* Ambient background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-2xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-400/20 rounded-full blur-xl -ml-16 -mb-16 pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3.5">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30 shadow-inner">
            <Target size={28} className="text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl md:text-2xl font-black tracking-tight">
                التحديات المالية الأسبوعية
              </h1>
              <span className="bg-white/20 backdrop-blur-sm text-white text-[10px] font-black px-2.5 py-0.5 rounded-full border border-white/30 flex items-center gap-1">
                <Calendar size={11} />
                {weekRangeStr}
              </span>
            </div>
            <p className="text-xs md:text-sm text-white/80 font-medium mt-1">
              حوّل توفير المال إلى لعبة حماسية مع تتبع يومي بصري دقيق 🎯
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="relative z-10 flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={onOpenCustomModal}
            className="px-4 py-2.5 rounded-2xl bg-white text-emerald-800 hover:bg-emerald-50 font-black text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5"
          >
            <Plus size={16} />
            إنشاء تحدي مخصص
          </button>
          
          <button
            onClick={onResetToDefault}
            className="p-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white transition-all backdrop-blur-sm border border-white/20"
            title="إعادة ضبط التحديات الافتراضية"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Gamified 4-Metric Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Metric 1: Total Points */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5"
        >
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
            <Sparkles size={22} />
          </div>
          <div>
            <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 block">
              رصيد النقاط 🌟
            </span>
            <span className="text-lg md:text-xl font-black text-slate-900 dark:text-white">
              {points} <span className="text-xs font-bold text-amber-500">نقطة</span>
            </span>
          </div>
        </motion.div>

        {/* Metric 2: Active Streak */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5"
        >
          <div className="w-11 h-11 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center shrink-0">
            <Flame size={22} />
          </div>
          <div>
            <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 block">
              أطول سلسلة التزام 🔥
            </span>
            <span className="text-lg md:text-xl font-black text-slate-900 dark:text-white">
              {maxStreak} <span className="text-xs font-bold text-slate-400">أيام متتالية</span>
            </span>
          </div>
        </motion.div>

        {/* Metric 3: Estimated Savings */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5"
        >
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
            <PiggyBank size={22} />
          </div>
          <div>
            <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 block">
              وفر التحديات التقديري 💰
            </span>
            <span className="text-lg md:text-xl font-black text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalSaved, currency)}
            </span>
          </div>
        </motion.div>

        {/* Metric 4: Completed Challenges */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5"
        >
          <div className="w-11 h-11 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-500 flex items-center justify-center shrink-0">
            <Trophy size={22} />
          </div>
          <div>
            <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 block">
              التحديات المنجزة 🏆
            </span>
            <span className="text-lg md:text-xl font-black text-slate-900 dark:text-white">
              {completedCount} <span className="text-xs font-bold text-slate-400">({activeCount} نشط)</span>
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
