import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  Coins, 
  Users, 
  User, 
  AlertCircle
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

  // 1. Automatically sort goals by priority:
  // Emergency/Essential first, then closest to completion (% descending), then completed last.
  const sortedGoals = useMemo(() => {
    return [...goals].sort((a, b) => {
      const aTarget = a.targetAmount || 1;
      const bTarget = b.targetAmount || 1;
      const aPercent = (a.currentAmount || 0) / aTarget;
      const bPercent = (b.currentAmount || 0) / bTarget;
      const aDone = aPercent >= 1;
      const bDone = bPercent >= 1;

      // Completed goals go to the end
      if (aDone !== bDone) return aDone ? 1 : -1;

      // Emergency fund / Essential priority comes first
      const aIsEssential = a.isEmergencyFund || a.goalPriority === 'essential';
      const bIsEssential = b.isEmergencyFund || b.goalPriority === 'essential';
      if (aIsEssential !== bIsEssential) return aIsEssential ? -1 : 1;

      // Family priority next
      const aIsFamily = a.goalPriority === 'family';
      const bIsFamily = b.goalPriority === 'family';
      if (aIsFamily !== bIsFamily) return aIsFamily ? -1 : 1;

      // Closest to completion (% descending)
      return bPercent - aPercent;
    });
  }, [goals]);

  // 2. Smart Insight Line calculated dynamically
  const smartInsight = useMemo(() => {
    if (goals.length === 0) return null;

    const incompleteGoals = goals.filter(g => (g.currentAmount || 0) < (g.targetAmount || 1));
    if (incompleteGoals.length === 0) {
      return {
        type: 'success',
        icon: '🏆',
        text: 'تهانينا! لقد حققت جميع أهدافك الادخارية الحالية بنجاح 100%. يمكنك إنشاء أهداف جديدة الآن!'
      };
    }

    // A. Check if emergency fund is incomplete
    const emergencyGoal = incompleteGoals.find(g => g.isEmergencyFund || g.goalPriority === 'essential');
    if (emergencyGoal) {
      const emergencyPct = Math.round(((emergencyGoal.currentAmount || 0) / (emergencyGoal.targetAmount || 1)) * 100);
      if (emergencyPct < 60) {
        return {
          type: 'warning',
          icon: '🛡️',
          text: `صندوق الأمان المالي "${emergencyGoal.name}" عند نسبة ${emergencyPct}% — يُستحسن توجيه الفائض إليه أولاً لبناء شبكة طوارئ قوية.`
        };
      }
    }

    // B. Check for goal closest to completion (>= 65% or remaining <= 150)
    const closestGoal = [...incompleteGoals].sort((a, b) => {
      const aPct = (a.currentAmount || 0) / (a.targetAmount || 1);
      const bPct = (b.currentAmount || 0) / (b.targetAmount || 1);
      return bPct - aPct;
    })[0];

    if (closestGoal) {
      const target = closestGoal.targetAmount || 1;
      const current = closestGoal.currentAmount || 0;
      const remaining = Math.max(0, target - current);
      const pct = Math.round((current / target) * 100);

      if (pct >= 65 || remaining <= 150) {
        return {
          type: 'highlight',
          icon: '🎯',
          text: `أنت على بُعد ${formatCurrency(remaining, currency)} فقط (${pct}%) من تحقيق هدفك "${closestGoal.name}" بالكامل!`
        };
      }
    }

    // C. Check for goal with monthly savings target
    const goalWithMonthly = incompleteGoals.find(g => g.monthlySavingsTarget && g.monthlySavingsTarget > 0);
    if (goalWithMonthly) {
      return {
        type: 'info',
        icon: '💡',
        text: `الالتزام بقسط ${formatCurrency(goalWithMonthly.monthlySavingsTarget!, currency)}/شهر لهدف "${goalWithMonthly.name}" يضمن تحقيقه في الموعد المحدد.`
      };
    }

    return {
      type: 'info',
      icon: '✨',
      text: 'الادخار التراكمي المنتظم عبر تخصيص جزء من كل دخل يحقق أهدافك بأسرع مما تتوقع.'
    };
  }, [goals, currency]);

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
      
      {/* Smart Insight Line */}
      {smartInsight && (
        <div className={cn(
          "px-4 py-3 rounded-2xl border flex items-center gap-2.5 text-xs font-bold transition-all",
          smartInsight.type === 'highlight'
            ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
            : smartInsight.type === 'warning'
              ? "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200"
              : smartInsight.type === 'success'
                ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200"
                : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
        )}>
          <span className="text-base shrink-0 leading-none">{smartInsight.icon}</span>
          <span className="leading-relaxed flex-1">{smartInsight.text}</span>
        </div>
      )}

      {/* Grid of Goals (Sorted by priority) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedGoals.map((goal) => {
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
          const isEssential = goal.isEmergencyFund || goal.goalPriority === 'essential';
          const isFamily = goal.goalPriority === 'family' || isBaby;

          return (
            <div
              key={goal.id}
              className={cn(
                "bg-white dark:bg-slate-900 rounded-3xl p-5 border shadow-xs flex flex-col justify-between transition-all relative overflow-hidden",
                isCompleted 
                  ? "border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/10 dark:bg-emerald-950/10" 
                  : isEssential
                    ? "border-rose-200/90 dark:border-rose-900/40 bg-rose-50/5"
                    : isFamily
                      ? "border-indigo-200/80 dark:border-indigo-900/40"
                      : "border-slate-200/80 dark:border-slate-800"
              )}
            >
              <div>
                {/* Card Top: Icon, Priority Tag, and Action Menu */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={cn(
                      "w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xs",
                      isCompleted ? "bg-emerald-500" :
                      isEssential ? "bg-rose-500" :
                      isFamily ? "bg-indigo-600" : "bg-slate-700 dark:bg-slate-800 text-slate-200"
                    )}>
                      {isCompleted ? <CheckCircle2 size={20} /> :
                       isEssential ? <ShieldCheck size={20} /> :
                       isFamily ? <Users size={20} /> : <Target size={20} />}
                    </div>

                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight line-clamp-1">
                        {goal.name}
                      </h4>
                      <div className="flex flex-wrap items-center gap-1 mt-1">
                        {isEssential && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/40">
                            🚨 ضروري / طارئ
                          </span>
                        )}
                        {!isEssential && isFamily && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-900/40">
                            👨‍👩‍👧 عائلي
                          </span>
                        )}
                        {!isEssential && !isFamily && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">
                            🎯 شخصي
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
                        isEssential ? "bg-rose-500" :
                        isFamily ? "bg-indigo-600" : "bg-teal-500"
                      )}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                    <span>نسبة الإنجاز: <strong className={isCompleted ? "text-emerald-500 font-black" : "text-slate-700 dark:text-slate-200"}>{percent}%</strong></span>
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

                    {/* Fast Quick Amount buttons */}
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
