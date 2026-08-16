import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  CheckCircle, 
  XCircle, 
  Zap, 
  Calendar, 
  Coffee, 
  ShieldCheck, 
  UtensilsCrossed, 
  ShoppingBag, 
  Flame, 
  PiggyBank, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Clock, 
  Trash2,
  Check,
  TrendingUp,
  Footprints,
  FileCheck,
  Soup,
  Award,
  Sandwich,
  Target
} from 'lucide-react';
import { WeeklyChallenge } from '../../types';
import { cn, formatCurrency } from '../../utils';
import { useAppContext } from '../../store/AppContext';

interface WeeklyChallengeCardProps {
  challenge: WeeklyChallenge;
  onStart: (id: string) => void;
  onAbandon: (id: string) => void;
  onToggleCheck: (challengeId: string, date: string) => void;
  onClaim: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const WeeklyChallengeCard: React.FC<WeeklyChallengeCardProps> = ({
  challenge,
  onStart,
  onAbandon,
  onToggleCheck,
  onClaim,
  onDelete
}) => {
  const { currency } = useAppContext();
  const [isExpanded, setIsExpanded] = useState(false);

  // Dynamic icon rendering
  const renderIcon = (name: string) => {
    const iconProps = { className: "w-5 h-5" };
    switch (name) {
      case 'Coffee': return <Coffee {...iconProps} className="w-5 h-5 text-amber-500" />;
      case 'ShieldCheck': return <ShieldCheck {...iconProps} className="w-5 h-5 text-emerald-500" />;
      case 'UtensilsCrossed': return <UtensilsCrossed {...iconProps} className="w-5 h-5 text-rose-500" />;
      case 'Sandwich': return <Sandwich {...iconProps} className="w-5 h-5 text-amber-600" />;
      case 'ShoppingBag': return <ShoppingBag {...iconProps} className="w-5 h-5 text-orange-500" />;
      case 'Flame': return <Flame {...iconProps} className="w-5 h-5 text-indigo-500" />;
      case 'PiggyBank': return <PiggyBank {...iconProps} className="w-5 h-5 text-yellow-500" />;
      case 'TrendingUp': return <TrendingUp {...iconProps} className="w-5 h-5 text-blue-500" />;
      case 'Footprints': return <Footprints {...iconProps} className="w-5 h-5 text-teal-500" />;
      case 'FileCheck': return <FileCheck {...iconProps} className="w-5 h-5 text-indigo-500" />;
      case 'Zap': return <Zap {...iconProps} className="w-5 h-5 text-yellow-500" />;
      case 'Soup': return <Soup {...iconProps} className="w-5 h-5 text-emerald-600" />;
      case 'Sparkles': return <Sparkles {...iconProps} className="w-5 h-5 text-purple-500" />;
      default: return <Target {...iconProps} className="w-5 h-5 text-emerald-500" />;
    }
  };

  const isCompleted = challenge.status === 'completed';
  const isActive = challenge.status === 'active';
  const isAvailable = challenge.status === 'available';
  const canClaim = isActive && challenge.progressPercentage >= 100;

  const todayStatus = challenge.days?.find(d => d.isToday);

  // Difficulty tag
  const difficultyTag = () => {
    switch (challenge.difficulty) {
      case 'easy':
        return <span className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-black px-2 py-0.5 rounded-full">سهل ⭐</span>;
      case 'hard':
        return <span className="bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[10px] font-black px-2 py-0.5 rounded-full">حماسي ⭐⭐⭐</span>;
      case 'medium':
      default:
        return <span className="bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-black px-2 py-0.5 rounded-full">متوسط ⭐⭐</span>;
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "rounded-3xl border-2 transition-all overflow-hidden relative shadow-xs",
        isActive 
          ? "border-emerald-500/50 bg-white dark:bg-slate-900 shadow-emerald-500/5 ring-2 ring-emerald-500/20" 
          : isCompleted 
            ? "border-purple-500/30 bg-purple-50/15 dark:bg-purple-950/10" 
            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 hover:border-slate-300 dark:hover:border-slate-700"
      )}
    >
      {/* Decorative top ribbon */}
      {isActive && (
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500" />
      )}
      {isCompleted && (
        <div className="h-1.5 w-full bg-gradient-to-r from-purple-500 via-amber-400 to-emerald-500" />
      )}

      <div className="p-4 sm:p-5">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex items-start gap-3">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border mt-0.5",
              isActive 
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/30" 
                : isCompleted 
                  ? "bg-purple-50 dark:bg-purple-950/40 border-purple-500/30" 
                  : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
            )}>
              {renderIcon(challenge.icon)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {challenge.title}
                </h3>
                {difficultyTag()}
                {isActive && (
                  <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] px-2.5 py-0.5 rounded-full font-black flex items-center gap-1 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    نشط هذا الأسبوع
                  </span>
                )}
                {isCompleted && (
                  <span className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 text-[10px] px-2.5 py-0.5 rounded-full font-black flex items-center gap-1">
                    <Trophy size={11} className="text-amber-500" />
                    مكتمل 🏆
                  </span>
                )}
              </div>

              {challenge.subtitle && (
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  ✨ {challenge.subtitle}
                </p>
              )}

              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 leading-relaxed">
                {challenge.description}
              </p>
            </div>
          </div>

          {/* Reward Points Badge */}
          <div className="shrink-0 text-left">
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-black">
              <Sparkles size={12} className="text-amber-500" />
              <span>+{challenge.rewardPoints} نقطة</span>
            </div>
          </div>
        </div>

        {/* 7-Day Visual Tracker Matrix (Active or Completed) */}
        {(isActive || isCompleted) && (
          <div className="my-3.5 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar size={13} className="text-emerald-500" />
                تتبع أيام الأسبوع الـ 7:
              </span>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                {challenge.type === 'no_spend' 
                  ? `${challenge.successfulDaysCount} من ${challenge.targetDays || 2} أيام مستهدفة`
                  : `${challenge.successfulDaysCount} من 7 أيام ناجحة`}
              </span>
            </div>

            {/* 7-Day Interactive Tiles */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {challenge.days?.map((day) => {
                return (
                  <div
                    key={day.date}
                    onClick={() => {
                      if (isActive && (day.isToday || day.isPast)) {
                        onToggleCheck(challenge.id, day.date);
                      }
                    }}
                    className={cn(
                      "flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-xl transition-all relative select-none",
                      day.isToday && "ring-2 ring-emerald-500 ring-offset-1 dark:ring-offset-slate-900 font-black",
                      (day.isToday || day.isPast) && isActive && "cursor-pointer hover:scale-105 active:scale-95 shadow-xs",
                      day.isSuccess && (day.isPast || day.isToday)
                        ? "bg-emerald-500/15 dark:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                        : !day.isSuccess && (day.isPast || day.isToday)
                          ? "bg-rose-500/15 dark:bg-rose-500/25 text-rose-700 dark:text-rose-300 border border-rose-500/30"
                          : "bg-slate-200/60 dark:bg-slate-700/50 text-slate-400 border border-transparent"
                    )}
                    title={day.note || day.dayLabel}
                  >
                    <span className="text-[10px] font-black">{day.dayShort}</span>
                    
                    <div className="my-1">
                      {day.isSuccess && (day.isPast || day.isToday) ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                          <Check size={11} strokeWidth={3} />
                        </div>
                      ) : !day.isSuccess && (day.isPast || day.isToday) ? (
                        <div className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-xs">
                          <XCircle size={11} strokeWidth={2.5} />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center">
                          <Clock size={10} className="text-slate-400 dark:text-slate-500" />
                        </div>
                      )}
                    </div>

                    <span className="text-[9px] font-bold text-center truncate max-w-full">
                      {day.isToday 
                        ? 'اليوم' 
                        : day.spentAmount > 0 
                          ? `${day.spentAmount.toFixed(1)}` 
                          : day.isSuccess && (day.isPast || day.isToday) 
                            ? '0 د.ت' 
                            : 'قادم'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Hint & Savings */}
            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500">
              <span>💡 انقر على أي يوم لتأكيد الالتزام بنقرة واحدة</span>
              {challenge.totalSavedSoFar > 0 && (
                <span className="text-emerald-600 dark:text-emerald-400 font-black">
                  الوفر التقديري: {formatCurrency(challenge.totalSavedSoFar, currency)} 💰
                </span>
              )}
            </div>
          </div>
        )}

        {/* Progress Bar & Rate */}
        {(isActive || isCompleted) && (
          <div className="space-y-1 my-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-black text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Zap size={13} className="text-amber-500" />
                نسبة الإنجاز: {challenge.progressPercentage}%
              </span>
              <span className="font-bold text-slate-500 dark:text-slate-400 text-[11px]">
                {challenge.badgeName}
              </span>
            </div>
            <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/60 dark:border-slate-800">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, challenge.progressPercentage)}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className={cn(
                  "h-full rounded-full transition-all",
                  challenge.progressPercentage >= 100 
                    ? "bg-gradient-to-r from-emerald-500 to-teal-400" 
                    : challenge.progressPercentage >= 50 
                      ? "bg-gradient-to-r from-emerald-500 to-amber-500" 
                      : "bg-emerald-500"
                )}
              />
            </div>
          </div>
        )}

        {/* Expandable Tips */}
        {challenge.tips && challenge.tips.length > 0 && (
          <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors py-0.5"
            >
              <span className="flex items-center gap-1.5">
                <Sparkles size={12} className="text-amber-500" />
                نصائح واستراتيجية التفوق ({challenge.tips.length})
              </span>
              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-1.5 pt-2 text-xs text-slate-600 dark:text-slate-300 overflow-hidden"
                >
                  {challenge.tips.map((tip, idx) => (
                    <div key={idx} className="flex items-start gap-2 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-xl">
                      <span className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 font-black text-[9px]">
                        {idx + 1}
                      </span>
                      <p className="text-[11px] leading-relaxed font-medium">{tip}</p>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Action Controls */}
        <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
          {/* Estimated saving note for available challenge */}
          {isAvailable && (
            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <span>وفر متوقع: ~{formatCurrency(challenge.estimatedSavingTND, currency)} 💰</span>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center gap-2 mr-auto">
            {challenge.isCustom && onDelete && (
              <button
                onClick={() => onDelete(challenge.id)}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                title="حذف التحدي"
              >
                <Trash2 size={16} />
              </button>
            )}

            {isAvailable && (
              <button
                onClick={() => onStart(challenge.id)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
              >
                <Zap size={14} />
                بدء التحدي الآن
              </button>
            )}

            {isActive && (
              <>
                {todayStatus && (
                  <button
                    onClick={() => onToggleCheck(challenge.id, todayStatus.date)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 active:scale-95 border",
                      todayStatus.manualChecked
                        ? "bg-emerald-500 text-white border-emerald-500 shadow-xs"
                        : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                    )}
                  >
                    <CheckCircle size={13} />
                    {todayStatus.manualChecked ? 'تم تأكيد اليوم ✅' : 'تأكيد اليوم 🎯'}
                  </button>
                )}

                {canClaim ? (
                  <button
                    onClick={() => onClaim(challenge.id)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-600 hover:to-emerald-600 text-white font-black text-xs shadow-md shadow-amber-500/25 flex items-center gap-1.5 animate-bounce transition-all active:scale-95"
                  >
                    <Trophy size={14} className="text-yellow-200" />
                    استلام المكافأة (+{challenge.rewardPoints}) 🎉
                  </button>
                ) : (
                  <button
                    onClick={() => onAbandon(challenge.id)}
                    className="px-3 py-1.5 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs transition-colors"
                  >
                    إلغاء
                  </button>
                )}
              </>
            )}

            {isCompleted && (
              <div className="flex items-center gap-1.5 text-xs font-black text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30 px-3 py-1.5 rounded-xl border border-purple-500/20">
                <CheckCircle size={14} />
                <span>تم إنجاز التحدي 🏆</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
