import React from 'react';
import { motion, Variants } from 'motion/react';
import { Clock, Plus, ShieldCheck, Sparkles, ArrowRight, TrendingUp, Calendar, Zap, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn, formatCurrency, hapticFeedback } from '../../utils';
import DailySafeSpendCard from '../DailySafeSpendCard';
import { Expense, Category, Account, Goal } from '../../types';

interface TodayOperationsPanelProps {
  dailyLimit: number;
  todaySpent: number;
  remainingToday: number;
  globalBudgetNum: number;
  currency: string;
  remainingDays: number;
  budgetDaysInMonth: number;
  rollingBudgetEnabled: boolean;
  totalSpent: number;
  categories: Category[];
  accounts: Account[];
  goals: Goal[];
  remainingDailyBudget: number;
  todaySpending: number;
  dailyBudget: number;
  rollingBudget: number;
  totalNetWorth: number;
  totalMonthlyExpense: number;
  dailyAverage: number;
  budgetStatus: 'red' | 'orange' | 'green';
  setIsAddModalOpen: (open: boolean) => void;
  itemVariants: Variants;
}

export const TodayOperationsPanel: React.FC<TodayOperationsPanelProps> = ({
  dailyLimit,
  todaySpent,
  remainingToday,
  globalBudgetNum,
  currency,
  remainingDays,
  budgetDaysInMonth,
  rollingBudgetEnabled,
  totalSpent,
  remainingDailyBudget,
  todaySpending,
  dailyBudget,
  rollingBudget,
  dailyAverage,
  budgetStatus,
  setIsAddModalOpen,
  itemVariants,
}) => {
  const isSafe = todaySpent <= dailyLimit;
  const spendPercent = dailyLimit > 0 ? Math.min(100, Math.round((todaySpent / dailyLimit) * 100)) : 0;

  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4 max-w-5xl mx-auto w-full text-right"
      dir="rtl"
    >
      {/* 1. Main Daily Safe-to-Spend Card */}
      <DailySafeSpendCard
        dailyLimit={dailyLimit}
        todaySpent={todaySpent}
        remainingToday={remainingToday}
        globalBudgetNum={globalBudgetNum}
        currency={currency}
        remainingDays={remainingDays}
        daysInMonth={budgetDaysInMonth}
        rollingBudgetEnabled={rollingBudgetEnabled}
        totalSpentMonth={totalSpent}
        onOpenAddExpense={() => setIsAddModalOpen(true)}
      />

      {/* 2. Smart Practical Daily Metrics Bento (3 Balanced Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Card 1: Daily Health Status */}
        <div className={cn(
          "p-4 rounded-2xl border transition-all flex flex-col justify-between",
          isSafe 
            ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/70 dark:border-emerald-800/50" 
            : "bg-rose-50/40 dark:bg-rose-950/20 border-rose-200/70 dark:border-rose-800/50"
        )}>
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Zap size={14} className={isSafe ? "text-emerald-500" : "text-rose-500"} />
              <span>مؤشر الانضباط اليومي</span>
            </span>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-black border",
              isSafe 
                ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700" 
                : "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700"
            )}>
              {isSafe ? 'ضمن المسموح 🎯' : 'تجاوز للحد ⚠️'}
            </span>
          </div>

          <p className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold leading-relaxed">
            {isSafe 
              ? `صرفت ${formatCurrency(todaySpent, currency)} من أصل ${formatCurrency(dailyLimit, currency)} المتاحة لليوم (${spendPercent}%).`
              : `تجاوزت الحد اليومي بمقدار ${formatCurrency(todaySpent - dailyLimit, currency)}. سيتم تعديل حد الغد تلقائياً.`}
          </p>

          <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[10px] font-bold text-slate-500">
            <span>المعدل اليومي العام:</span>
            <span className="font-mono font-black text-slate-800 dark:text-slate-200">{formatCurrency(dailyAverage, currency)} / يوم</span>
          </div>
        </div>

        {/* Card 2: Rolling Balance & Surplus */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <TrendingUp size={14} className="text-blue-500" />
              <span>الفائض المرحّل (Rolling)</span>
            </span>
            <span className="text-[10px] font-black text-slate-400 font-mono">
              {rollingBudgetEnabled ? 'مفعّل 🔄' : 'ميزانية ثابتة'}
            </span>
          </div>

          <p className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold leading-relaxed">
            {rollingBudget > 0 
              ? `لديك فائض تراكمي قدره ${formatCurrency(rollingBudget, currency)} يرفع من سقف أيامك القادمة.`
              : `تستهلك ميزانيتك اليومية بانتظام لضمان الاستقرار المالي طيلة الشهر.`}
          </p>

          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-bold text-slate-500">
            <span>الأيام المتبقية في الدورة:</span>
            <span className="font-mono font-black text-slate-800 dark:text-slate-200">{remainingDays} يوم</span>
          </div>
        </div>

        {/* Card 3: Direct Actions & Management */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white flex flex-col justify-between shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black flex items-center gap-1.5 text-emerald-400">
                <Sparkles size={14} />
                <span>إجراءات الحساب السريعة</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-medium leading-tight">
              سجل عملية جديدة أو تصفح كامل سجل الحركات المصنفة.
            </p>
          </div>

          <div className="mt-3 pt-2 flex items-center gap-2">
            <button
              onClick={() => {
                hapticFeedback('medium');
                setIsAddModalOpen(true);
              }}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1 shadow-xs cursor-pointer active:scale-95"
            >
              <Plus size={14} />
              <span>إضافة مصروف</span>
            </button>

            <Link
              to="/transactions"
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
              title="صفحة العمليات الكاملة"
            >
              <span>السجل</span>
              <ArrowRight size={12} className="rotate-180" />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
