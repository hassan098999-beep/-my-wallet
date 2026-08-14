import React from 'react';
import { motion, Variants } from 'motion/react';
import { PiggyBank, TrendingUp, Target, Plus, Zap, ArrowUpRight, Sparkles, ShieldCheck } from 'lucide-react';
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
    <div className="space-y-4" dir="rtl">
      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        
        {/* 1. Total Saved Balance */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black text-slate-400">إجمالي المدخرات المحققة</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <PiggyBank size={18} />
            </div>
          </div>
          <div>
            <span className="text-2xl md:text-3xl font-black font-mono text-slate-900 dark:text-white">
              {formatCurrency(totalSaved, currency)}
            </span>
            <p className="text-[11px] font-bold text-slate-400 mt-1">
              موزعة عبر {totalGoalsCount} أهداف وحصالات نشطة
            </p>
          </div>
        </div>

        {/* 2. Monthly Free Cashflow / Surplus */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black text-slate-400">الفائض الشهري المتاح</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <TrendingUp size={18} />
            </div>
          </div>
          <div>
            <span className={cn(
              "text-2xl md:text-3xl font-black font-mono",
              monthlySurplus > 0 ? "text-indigo-600 dark:text-indigo-400" : "text-slate-700 dark:text-slate-300"
            )}>
              {formatCurrency(monthlySurplus, currency)}
            </span>
            <p className="text-[11px] font-bold text-slate-400 mt-1">
              الفرق المباشر بين الدخل والمصروفات
            </p>
          </div>
        </div>

        {/* 3. Savings Rate & Health Badge */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black text-slate-400">معدل الادخار الفعلي</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Target size={18} />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl md:text-3xl font-black font-mono text-slate-900 dark:text-white">
                {Math.round(savingRate)}%
              </span>
              <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-lg border", badge.bgColor, badge.textColor)}>
                {badge.label}
              </span>
            </div>
            <p className="text-[11px] font-bold text-slate-400 mt-1">
              {completedGoalsCount > 0 ? `تم إنجاز ${completedGoalsCount} أهداف بالكامل 🏆` : 'قيد التقدم نحو تحقيق الأهداف'}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 bg-slate-100 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
          <Sparkles size={16} className="text-amber-500 shrink-0" />
          <span>لديك فائض شهري؟ يمكنك توزيعه مباشرة أو إنشاء أهداف مالية جديدة</span>
        </div>

        <div className="flex items-center gap-2">
          {monthlySurplus > 0 && (
            <button
              onClick={() => {
                hapticFeedback('medium');
                onOpenQuickAllocate();
              }}
              className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Zap size={14} />
              <span>توزيع الفائض الذكي ({formatCurrency(monthlySurplus, currency)})</span>
            </button>
          )}

          <button
            onClick={() => {
              hapticFeedback('light');
              onOpenAddGoal();
            }}
            className="flex-1 sm:flex-none px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Plus size={15} />
            <span>إضافة هدف ادخاري</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SavingsHeader;
