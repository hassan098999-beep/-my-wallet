import React from 'react';
import { motion } from 'motion/react';
import { PiggyBank, TrendingUp, Target, Plus, Zap, ArrowUpRight, Sparkles, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { formatCurrency, cn, hapticFeedback } from '../../utils';

interface SavingsHeaderProps {
  totalSaved: number;
  monthlySurplus: number;
  savingRate: number;
  totalGoalsCount: number;
  completedGoalsCount: number;
  currency: string;
  onOpenAddGoal: () => void;
  onOpenQuickAllocate: () => void;
  itemVariants?: any;
}

export const SavingsHeader: React.FC<SavingsHeaderProps> = ({
  totalSaved,
  monthlySurplus,
  savingRate,
  totalGoalsCount,
  completedGoalsCount,
  currency,
  onOpenAddGoal,
  onOpenQuickAllocate,
}) => {
  // Savings Health Grade
  const getHealthBadge = () => {
    if (savingRate >= 20) {
      return {
        label: 'ادخار ممتاز (>20%)',
        textColor: 'text-emerald-700 dark:text-emerald-300',
        bgColor: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50'
      };
    }
    if (savingRate >= 10) {
      return {
        label: 'ادخار متوازن (10-20%)',
        textColor: 'text-indigo-700 dark:text-indigo-300',
        bgColor: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/50'
      };
    }
    if (savingRate > 0) {
      return {
        label: 'بحاجة لتعزيز (<10%)',
        textColor: 'text-amber-700 dark:text-amber-300',
        bgColor: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/50'
      };
    }
    return {
      label: 'لا يوجد فائض هذا الشهر',
      textColor: 'text-rose-700 dark:text-rose-300',
      bgColor: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/50'
    };
  };

  const badge = getHealthBadge();

  return (
    <div className="space-y-3.5" dir="rtl">
      {/* Primary Hero Master Card - Highlighting the Most Motivating Metric */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white p-5 md:p-6 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -left-12 -top-12 w-48 h-48 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* Main Focal Metric */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <PiggyBank size={18} />
              </span>
              <span className="text-xs font-bold text-slate-300">
                إجمالي رصيد المدخرات المحققة
              </span>
              <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-lg border", badge.bgColor, badge.textColor)}>
                {badge.label}
              </span>
            </div>

            <div className="flex items-baseline gap-3 pt-1">
              <span className="text-3xl sm:text-4xl md:text-5xl font-black font-mono tracking-tight text-white">
                {formatCurrency(totalSaved, currency)}
              </span>
            </div>

            <p className="text-xs text-slate-400 font-medium pt-0.5">
              مجمّعة عبر <strong className="text-slate-200">{totalGoalsCount}</strong> مستهدفات وحصالات نشطة
              {completedGoalsCount > 0 && ` · تم إنجاز ${completedGoalsCount} أهداف 🏆`}
            </p>
          </div>

          {/* Integrated Action Buttons */}
          <div className="flex flex-row md:flex-col gap-2 shrink-0">
            <button
              onClick={() => {
                hapticFeedback('medium');
                onOpenAddGoal();
              }}
              className="flex-1 md:flex-initial px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-slate-950 rounded-2xl font-black text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus size={15} />
              <span>هدف ادخار جديد</span>
            </button>

            {monthlySurplus > 0 && (
              <button
                onClick={() => {
                  hapticFeedback('medium');
                  onOpenQuickAllocate();
                }}
                className="flex-1 md:flex-initial px-4 py-2.5 bg-indigo-600/80 hover:bg-indigo-600 active:scale-98 text-white rounded-2xl font-black text-xs transition-all border border-indigo-400/30 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Zap size={14} className="text-amber-300" />
                <span>توزيع الفائض ({formatCurrency(monthlySurplus, currency)})</span>
              </button>
            )}
          </div>
        </div>

        {/* Secondary KPIs Row within Master Container */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-4 mt-4 border-t border-slate-800/80">
          <div className="p-3 bg-slate-950/40 rounded-2xl border border-white/5">
            <span className="text-[10px] font-bold text-slate-400 block mb-0.5">الفائض الشهري المتاح</span>
            <div className="flex items-baseline gap-1">
              <span className={cn(
                "text-base md:text-lg font-black font-mono",
                monthlySurplus > 0 ? "text-emerald-400" : "text-slate-300"
              )}>
                {formatCurrency(monthlySurplus, currency)}
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-950/40 rounded-2xl border border-white/5">
            <span className="text-[10px] font-bold text-slate-400 block mb-0.5">معدل الادخار من الدخل</span>
            <div className="flex items-baseline gap-1">
              <span className="text-base md:text-lg font-black font-mono text-indigo-300">
                {Math.round(savingRate)}%
              </span>
              <span className="text-[10px] text-slate-400">شهرياً</span>
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 p-3 bg-slate-950/40 rounded-2xl border border-white/5">
            <span className="text-[10px] font-bold text-slate-400 block mb-0.5">معدل الإنجاز الكلي</span>
            <div className="flex items-baseline gap-1">
              <span className="text-base md:text-lg font-black font-mono text-amber-300">
                {completedGoalsCount}/{totalGoalsCount}
              </span>
              <span className="text-[10px] text-slate-400">أهداف مكتملة</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SavingsHeader;
