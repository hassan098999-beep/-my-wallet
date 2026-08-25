import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ShieldAlert, Target, Plus, Heart, Sparkles, 
  Check, ArrowUpRight, PiggyBank, Coins 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppContext } from '../../store/AppContext';
import { formatCurrency, hapticFeedback, cn } from '../../utils';
import { Goal } from '../../types';

interface FamilyGoalsTrackerProps {
  currency: string;
}

export const FamilyGoalsTracker: React.FC<FamilyGoalsTrackerProps> = ({ currency }) => {
  const { goals, updateGoal, addGoal } = useAppContext();
  const [contributeGoalId, setContributeGoalId] = useState<string | null>(null);
  const [contributeAmount, setContributeAmount] = useState<number>(50);

  // Filter family goals or provide default ones
  const familyGoals = (goals || []).filter(g => 
    g.goalPriority === 'family' || 
    g.goalPriority === 'essential' || 
    g.name.includes('طوارئ') || 
    g.name.includes('رضيع') || 
    g.name.includes('عائلة') ||
    g.name.includes('عائلي') ||
    g.name.includes('أعياد') ||
    g.name.includes('منزل')
  );

  const handleQuickContribute = async (goal: Goal, amount: number) => {
    hapticFeedback('success');
    await updateGoal(goal.id, {
      currentAmount: goal.currentAmount + amount,
    });

    toast.success(`تمت إضافة ${formatCurrency(amount, currency)} إلى ${goal.name}! 🎯`);
    setContributeGoalId(null);
  };

  return (
    <div className="space-y-4 text-right" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <PiggyBank size={18} className="text-emerald-500" />
            <span>صناديق الحماية والأهداف العائلية</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            حصالات الأمان المشترك ومخصصات المستقبل لرعاية الأبناء ومواجهة الطوارئ
          </p>
        </div>
      </div>

      {/* Grid of Goals */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {familyGoals.length > 0 ? (
          familyGoals.map((goal) => {
            const percentage = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
            const isCompleted = goal.currentAmount >= goal.targetAmount;

            return (
              <div
                key={goal.id}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs font-bold text-sm bg-emerald-600"
                      >
                        🎯
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900 dark:text-white line-clamp-1">{goal.name}</h4>
                        <span className="text-[10px] text-slate-400 font-medium block">
                          هدف: {formatCurrency(goal.targetAmount, currency)}
                        </span>
                      </div>
                    </div>

                    <span className={cn(
                      "text-[10px] font-black font-mono px-2 py-0.5 rounded-full",
                      isCompleted ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    )}>
                      {Math.round(percentage)}%
                    </span>
                  </div>

                  {/* Balance Display */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold block">المدخر الحالي:</span>
                      <span className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(goal.currentAmount, currency)}
                      </span>
                    </div>
                    <div className="text-left">
                      <span className="text-[9px] text-slate-400 font-bold block">المتبقي للإتمام:</span>
                      <span className="text-xs font-black font-mono text-slate-700 dark:text-slate-300">
                        {formatCurrency(Math.max(0, goal.targetAmount - goal.currentAmount), currency)}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, percentage)}%` }}
                      className="h-full rounded-full bg-emerald-500"
                    />
                  </div>
                </div>

                {/* Contribution Action */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    {[20, 50, 100].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => handleQuickContribute(goal, amt)}
                        className="px-2 py-1 bg-slate-100 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-emerald-950/30 hover:text-emerald-600 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer active:scale-95"
                      >
                        +{amt}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      hapticFeedback('light');
                      handleQuickContribute(goal, 50);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black transition-all cursor-pointer active:scale-95 shadow-2xs"
                  >
                    <Plus size={11} />
                    <span>تغذية الحصالة</span>
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full p-6 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <p className="text-xs text-slate-500 font-bold">لا توجد أهداف عائلية مسجلة حالياً.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FamilyGoalsTracker;
