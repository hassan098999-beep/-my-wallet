import React from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  Flame, 
  TrendingUp, 
  Award, 
  Gift, 
  Plus, 
  Bot, 
  CheckCircle,
  Crown,
  Zap,
  Target
} from 'lucide-react';
import { ChallengeUserLevel } from '../../types';
import { formatCurrency } from '../../utils';
import { useAppContext } from '../../store/AppContext';

interface ChallengesStatsHeaderProps {
  points: number;
  currentLevel: ChallengeUserLevel;
  nextLevel: ChallengeUserLevel | null;
  levelProgressPercentage: number;
  maxStreakDays: number;
  totalEstimatedSaved: number;
  unlockedBadgesCount: number;
  totalBadgesCount: number;
  isDailyBoxAvailable: boolean;
  onOpenDailyBox: () => void;
  onOpenCreateCustom: () => void;
  onOpenAISmartModal: () => void;
}

export const ChallengesStatsHeader: React.FC<ChallengesStatsHeaderProps> = ({
  points,
  currentLevel,
  nextLevel,
  levelProgressPercentage,
  maxStreakDays,
  totalEstimatedSaved,
  unlockedBadgesCount,
  totalBadgesCount,
  isDailyBoxAvailable,
  onOpenDailyBox,
  onOpenCreateCustom,
  onOpenAISmartModal
}) => {
  const { currency } = useAppContext();

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-emerald-500/20 relative overflow-hidden">
      {/* Background ambient glow shapes */}
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar: Level & Mystery Box */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/10">
        {/* User Level Card */}
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 via-emerald-400 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 shrink-0">
            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-2xl">
              {currentLevel.title.split(' ').pop() || '🌱'}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs uppercase font-black tracking-wider text-emerald-400">
                المستوى {currentLevel.level}
              </span>
              <span className="bg-white/10 px-2 py-0.5 rounded-full text-[11px] font-black text-amber-300 flex items-center gap-1">
                <Crown size={12} className="text-amber-400" />
                {currentLevel.title}
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              {currentLevel.perk}
            </p>
          </div>
        </div>

        {/* Action Buttons: Mystery Box & Custom & AI */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Daily Mystery Box */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onOpenDailyBox}
            className={`px-3.5 py-2 rounded-2xl text-xs font-black flex items-center gap-2 shadow-md transition-all ${
              isDailyBoxAvailable
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-amber-500/25 animate-pulse'
                : 'bg-white/10 text-slate-300 hover:bg-white/15'
            }`}
          >
            <Gift size={16} className={isDailyBoxAvailable ? 'text-yellow-200 animate-bounce' : 'text-slate-400'} />
            <span>{isDailyBoxAvailable ? '🎁 صندوق الحظ اليومي (متاح!)' : '🎁 صندوق اليوم (تم الاستلام)'}</span>
          </motion.button>

          {/* AI Challenge Suggestion */}
          <button
            onClick={onOpenAISmartModal}
            className="px-3.5 py-2 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-black flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Bot size={15} />
            تحدي ذكي بـ AI
          </button>

          {/* Create Custom */}
          <button
            onClick={onOpenCreateCustom}
            className="px-3.5 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-black flex items-center gap-1.5 transition-all active:scale-95 border border-white/10"
          >
            <Plus size={15} />
            تحدي مخصص
          </button>
        </div>
      </div>

      {/* Level XP Progress Bar */}
      <div className="relative z-10 my-4 bg-white/5 p-3 rounded-2xl border border-white/10">
        <div className="flex justify-between items-center text-xs mb-1.5 font-bold">
          <span className="text-slate-300 flex items-center gap-1">
            <Zap size={13} className="text-amber-400" />
            نقاط الخبرة (XP): <strong className="text-white text-sm">{points}</strong> نقطة
          </span>
          {nextLevel ? (
            <span className="text-slate-400 text-[11px]">
              المستوى القادم ({nextLevel.title}): تبقى {Math.max(0, nextLevel.minPoints - points)} نقطة
            </span>
          ) : (
            <span className="text-amber-400 text-[11px] font-black">
              أعلى رتبة مكتملة! 👑
            </span>
          )}
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden p-0.5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${levelProgressPercentage}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-emerald-400 via-teal-400 to-amber-400 rounded-full"
          />
        </div>
      </div>

      {/* 4 Gamified Stats Cards */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Stat 1: Total Points */}
        <div className="bg-white/5 hover:bg-white/10 transition-colors p-3 rounded-2xl border border-white/10">
          <div className="flex items-center gap-2 text-amber-400 mb-1">
            <Sparkles size={16} />
            <span className="text-[11px] font-black text-slate-300">نقاط المكافأة</span>
          </div>
          <p className="text-xl font-black text-white">{points}</p>
          <span className="text-[10px] text-slate-400 font-medium">قابلة للتجميع والترقية</span>
        </div>

        {/* Stat 2: Max Streak */}
        <div className="bg-white/5 hover:bg-white/10 transition-colors p-3 rounded-2xl border border-white/10">
          <div className="flex items-center gap-2 text-orange-400 mb-1">
            <Flame size={16} />
            <span className="text-[11px] font-black text-slate-300">سلسلة الالتزام</span>
          </div>
          <p className="text-xl font-black text-white">{maxStreakDays} <span className="text-xs font-normal text-slate-400">أيام</span></p>
          <span className="text-[10px] text-slate-400 font-medium">أطول سلسلة هذا الأسبوع</span>
        </div>

        {/* Stat 3: Total Saved */}
        <div className="bg-white/5 hover:bg-white/10 transition-colors p-3 rounded-2xl border border-white/10">
          <div className="flex items-center gap-2 text-emerald-400 mb-1">
            <TrendingUp size={16} />
            <span className="text-[11px] font-black text-slate-300">الوفر المحقق</span>
          </div>
          <p className="text-lg sm:text-xl font-black text-emerald-300 truncate">
            {formatCurrency(totalEstimatedSaved, currency)}
          </p>
          <span className="text-[10px] text-slate-400 font-medium">وفر التحديات النشطة</span>
        </div>

        {/* Stat 4: Unlocked Badges */}
        <div className="bg-white/5 hover:bg-white/10 transition-colors p-3 rounded-2xl border border-white/10">
          <div className="flex items-center gap-2 text-purple-400 mb-1">
            <Award size={16} />
            <span className="text-[11px] font-black text-slate-300">الأوسمة</span>
          </div>
          <p className="text-xl font-black text-white">
            {unlockedBadgesCount} <span className="text-xs font-normal text-slate-400">/ {totalBadgesCount}</span>
          </p>
          <span className="text-[10px] text-slate-400 font-medium">أوسمة الإنجاز المفتوحة</span>
        </div>
      </div>
    </div>
  );
};
