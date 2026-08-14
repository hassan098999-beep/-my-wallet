import React, { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'motion/react';
import { 
  Target, 
  Calendar, 
  Trash2, 
  Edit3, 
  Plus, 
  CheckCircle2, 
  ShieldCheck, 
  Baby, 
  Link2, 
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Coins,
  DollarSign
} from 'lucide-react';
import { Goal, Category } from '../../types';
import { formatCurrency, hapticFeedback, cn } from '../../utils';
import { differenceInDays, differenceInMonths, parseISO, format } from 'date-fns';
import { ar } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface GoalsGridViewProps {
  goals: Goal[];
  categories: Category[];
  currency: string;
  onEditGoal: (goal: Goal) => void;
  onDeleteGoal: (goalId: string) => void;
  onContribute: (goalId: string, amount: number) => void;
  onOpenAddGoal: () => void;
  itemVariants?: any;
}

export const GoalsGridView: React.FC<GoalsGridViewProps> = ({
  goals,
  categories,
  currency,
  onEditGoal,
  onDeleteGoal,
  onContribute,
  onOpenAddGoal,
}) => {
  const [activeDepositGoalId, setActiveDepositGoalId] = useState<string | null>(null);
  const [customDepositAmount, setCustomDepositAmount] = useState<string>('');

  const handleFastDeposit = (goal: Goal, amount: number) => {
    hapticFeedback('success');
    onContribute(goal.id, amount);
    setActiveDepositGoalId(null);
    setCustomDepositAmount('');
  };

  const handleCustomDepositSubmit = (goal: Goal) => {
    const amt = parseFloat(customDepositAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error('الرجاء إدخال مبلغ صحيح');
      return;
    }
    handleFastDeposit(goal, amt);
  };

  if (goals.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800 text-center flex flex-col items-center justify-center py-12" dir="rtl">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3.5 shadow-xs">
          <Target size={28} />
        </div>
        <h4 className="text-base font-black text-slate-900 dark:text-white">لم تقم بإضافة أي أهداف ادخارية بعد</h4>
        <p className="text-xs text-slate-400 font-medium max-w-sm mt-1.5 leading-relaxed">
          حدد أهدافك المستقبلية (شراء سيارة، صندوق طوارئ، أجهزة، أو مصاريف مواسم) لتبدأ بالادخار المنظم ومتابعة نسبة الإنجاز بسهولة.
        </p>
        <button
          onClick={() => {
            hapticFeedback('light');
            onOpenAddGoal();
          }}
          className="mt-5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer"
        >
          <Plus size={16} />
          <span>إنشاء أول هدف ادخاري 🎯</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-right" dir="rtl">
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {goals.map((goal) => {
          const target = goal.targetAmount || 1;
          const current = goal.currentAmount || 0;
          const percent = Math.min(100, Math.round((current / target) * 100));
          const isCompleted = current >= target;
          const remaining = Math.max(0, target - current);

          // Deadline calculation
          let deadlineText = 'بدون موعد محدد';
          let isUrgent = false;
          if (goal.deadline) {
            try {
              const d = parseISO(goal.deadline);
              const daysLeft = differenceInDays(d, new Date());
              if (daysLeft < 0) {
                deadlineText = 'انتهى الموعد المحدد';
                isUrgent = true;
              } else if (daysLeft === 0) {
                deadlineText = 'الموعد المحدد اليوم!';
                isUrgent = true;
              } else if (daysLeft < 30) {
                deadlineText = `متبقي ${daysLeft} يوماً`;
                isUrgent = true;
              } else {
                const monthsLeft = differenceInMonths(d, new Date());
                deadlineText = `متبقي ${monthsLeft} أشهر (${format(d, 'MMM yyyy', { locale: ar })})`;
              }
            } catch {
              deadlineText = goal.deadline;
            }
          }

          const linkedCategory = goal.linkedCategoryId ? categories.find(c => c.id === goal.linkedCategoryId) : null;
          const isBaby = goal.name.includes('Baby') || goal.name.includes('الرضيع');

          return (
            <div
              key={goal.id}
              className={cn(
                "bg-white dark:bg-slate-900 rounded-3xl p-5 border shadow-xs flex flex-col justify-between transition-all relative overflow-hidden",
                isCompleted 
                  ? "border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/10 dark:bg-emerald-950/10" 
                  : goal.isEmergencyFund
                    ? "border-amber-200/80 dark:border-amber-900/40"
                    : isBaby
                      ? "border-cyan-200/80 dark:border-cyan-900/40"
                      : "border-slate-200/80 dark:border-slate-800"
              )}
            >
              <div>
                {/* Card Top: Icon, Tags, and Action Menu */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={cn(
                      "w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xs",
                      isCompleted ? "bg-emerald-500" :
                      goal.isEmergencyFund ? "bg-amber-500" :
                      isBaby ? "bg-cyan-500" : "bg-indigo-600"
                    )}>
                      {isCompleted ? <CheckCircle2 size={20} /> :
                       goal.isEmergencyFund ? <ShieldCheck size={20} /> :
                       isBaby ? <Baby size={20} /> : <Target size={20} />}
                    </div>

                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight line-clamp-1">
                        {goal.name}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {goal.isEmergencyFund && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/40">
                            صندوق طوارئ
                          </span>
                        )}
                        {linkedCategory && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center gap-1">
                            <Link2 size={9} />
                            <span>{linkedCategory.name}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions: Edit & Delete */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        hapticFeedback('light');
                        onEditGoal(goal);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-all cursor-pointer"
                      title="تعديل الهدف"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => {
                        hapticFeedback('warning');
                        if (confirm(`هل أنت متأكد من رغبتك في حذف الهدف: "${goal.name}"؟`)) {
                          onDeleteGoal(goal.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer"
                      title="حذف الهدف"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Progress Numbers */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700/50 space-y-2.5 my-3">
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block">الرصيد المجموع</span>
                      <span className="text-base md:text-lg font-black font-mono text-slate-900 dark:text-white">
                        {formatCurrency(current, currency)}
                      </span>
                    </div>

                    <div className="text-left">
                      <span className="text-[10px] font-bold text-slate-400 block">الهدف الكلي</span>
                      <span className="text-xs md:text-sm font-bold font-mono text-slate-500 dark:text-slate-400">
                        {formatCurrency(target, currency)}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percent}%` }}
                      transition={{ duration: 0.8 }}
                      className={cn(
                        "h-full rounded-full transition-all",
                        isCompleted ? "bg-emerald-500" :
                        goal.isEmergencyFund ? "bg-amber-500" :
                        isBaby ? "bg-cyan-500" : "bg-indigo-600"
                      )}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                    <span>نسبة الإنجاز: <strong className={isCompleted ? "text-emerald-500" : "text-slate-700 dark:text-slate-200"}>{percent}%</strong></span>
                    <span>المتبقي: {formatCurrency(remaining, currency)}</span>
                  </div>
                </div>

                {/* Deadline & Target Info */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-3 px-1">
                  <div className="flex items-center gap-1">
                    <Calendar size={12} className={isUrgent ? "text-amber-500" : "text-slate-400"} />
                    <span className={cn("font-medium", isUrgent && "text-amber-600 dark:text-amber-400 font-bold")}>
                      {deadlineText}
                    </span>
                  </div>
                  {goal.monthlySavingsTarget && goal.monthlySavingsTarget > 0 && (
                    <span className="font-bold text-slate-500 dark:text-slate-400">
                      قسط: {formatCurrency(goal.monthlySavingsTarget, currency)}/ش
                    </span>
                  )}
                </div>
              </div>

              {/* Card Footer: Fast Deposit Controls */}
              <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800">
                {activeDepositGoalId === goal.id ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="1"
                        step="any"
                        placeholder="المبلغ المراد إيداعه..."
                        value={customDepositAmount}
                        onChange={(e) => setCustomDepositAmount(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 text-left"
                        autoFocus
                      />
                      <button
                        onClick={() => handleCustomDepositSubmit(goal)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        إيداع
                      </button>
                      <button
                        onClick={() => setActiveDepositGoalId(null)}
                        className="px-2 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all cursor-pointer"
                      >
                        إلغاء
                      </button>
                    </div>

                    {/* Quick Quick Amount buttons */}
                    <div className="flex gap-1">
                      {[10, 20, 50, 100].map(amt => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => handleFastDeposit(goal, amt)}
                          className="flex-1 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 hover:text-indigo-600 rounded-lg text-[10px] font-bold font-mono transition-all border border-slate-200/40 dark:border-slate-700/40 cursor-pointer"
                        >
                          +{amt}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        hapticFeedback('light');
                        setActiveDepositGoalId(goal.id);
                      }}
                      className="flex-1 py-2 px-3 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-black flex items-center justify-center gap-1 transition-all cursor-pointer"
                    >
                      <Coins size={13} />
                      <span>+ إيداع في الهدف</span>
                    </button>

                    {/* 1-click preset deposit if monthly target is set */}
                    {goal.monthlySavingsTarget && goal.monthlySavingsTarget > 0 && (
                      <button
                        onClick={() => handleFastDeposit(goal, goal.monthlySavingsTarget!)}
                        className="py-2 px-2.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-black transition-all cursor-pointer"
                        title={`إيداع القسط الشهري المحدد: ${formatCurrency(goal.monthlySavingsTarget, currency)}`}
                      >
                        +{goal.monthlySavingsTarget}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GoalsGridView;
