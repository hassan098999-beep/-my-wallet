import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Zap, PiggyBank, Check, Target, TrendingUp, Sparkles } from 'lucide-react';
import { useAppContext } from '../../store/AppContext';
import { Goal } from '../../types';
import { formatCurrency, hapticFeedback, cn } from '../../utils';
import toast from 'react-hot-toast';

interface QuickAllocateModalProps {
  isOpen: boolean;
  onClose: () => void;
  monthlySurplus: number;
}

export const QuickAllocateModal: React.FC<QuickAllocateModalProps> = ({
  isOpen,
  onClose,
  monthlySurplus,
}) => {
  const { goals, updateGoal, currency } = useAppContext();
  const [allocationPercent, setAllocationPercent] = useState<number>(100);
  const [mode, setMode] = useState<'equal' | 'priority'>('equal');

  const standardGoals = useMemo(() => (goals || []).filter(g => !g.isPhysicalPiggyBank), [goals]);
  const amountToDistribute = useMemo(() => (monthlySurplus * allocationPercent) / 100, [monthlySurplus, allocationPercent]);

  const allocations = useMemo(() => {
    if (standardGoals.length === 0 || amountToDistribute <= 0) return {};
    
    const result: Record<string, number> = {};

    if (mode === 'priority') {
      // Prioritize emergency funds first, then baby fund, then others
      let emergencyGoals = standardGoals.filter(g => g.isEmergencyFund || g.name.includes('طوارئ') || g.name.includes('Baby'));
      if (emergencyGoals.length === 0) emergencyGoals = standardGoals;

      const priorityPortion = amountToDistribute * 0.7;
      const remainingPortion = amountToDistribute * 0.3;

      const otherGoals = standardGoals.filter(g => !emergencyGoals.includes(g));

      emergencyGoals.forEach(g => {
        result[g.id] = priorityPortion / emergencyGoals.length;
      });

      if (otherGoals.length > 0) {
        otherGoals.forEach(g => {
          result[g.id] = remainingPortion / otherGoals.length;
        });
      } else {
        emergencyGoals.forEach(g => {
          result[g.id] = amountToDistribute / emergencyGoals.length;
        });
      }
    } else {
      // Equal distribution across all goals
      const perGoal = amountToDistribute / standardGoals.length;
      standardGoals.forEach(g => {
        result[g.id] = perGoal;
      });
    }

    return result;
  }, [standardGoals, amountToDistribute, mode]);

  const handleApplyAllocation = async () => {
    if (standardGoals.length === 0 || amountToDistribute <= 0) {
      toast.error('لا توجد أهداف لتوزيع الفائض عليها');
      return;
    }

    hapticFeedback('success');

    let count = 0;
    for (const goal of standardGoals) {
      const added = allocations[goal.id] || 0;
      if (added > 0) {
        await updateGoal(goal.id, {
          currentAmount: goal.currentAmount + added
        });
        count++;
      }
    }

    toast.success(`تم توزيع ${formatCurrency(amountToDistribute, currency)} بنجاح على ${count} أهداف! 🎉`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs" dir="rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white dark:bg-slate-900 rounded-3xl p-5 md:p-6 w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar text-right"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                <Zap size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  التوزيع الذكي للفائض الشهري
                </h3>
                <p className="text-[11px] font-semibold text-slate-400">
                  ضخ جزء من الفائض المتاح مباشرة في أهدافك الادخارية
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                hapticFeedback('light');
                onClose();
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <div className="space-y-4">
            
            {/* Surplus Total Callout */}
            <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200/60 dark:border-emerald-900/40 flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 block">الفائض المالي المتاح هذا الشهر</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">بناءً على دخل ومصروفات الشهر الحالي</span>
              </div>
              <span className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                {formatCurrency(monthlySurplus, currency)}
              </span>
            </div>

            {/* Allocation percentage slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-black">
                <span className="text-slate-700 dark:text-slate-300">نسبة الفائض المخصصة للادخار:</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-mono text-sm">{allocationPercent}% ({formatCurrency(amountToDistribute, currency)})</span>
              </div>

              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={allocationPercent}
                onChange={(e) => setAllocationPercent(Number(e.target.value))}
                className="w-full h-2 accent-indigo-600 cursor-pointer"
              />

              <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                <span>10% (ادخار خفيف)</span>
                <span>50% (متوسط)</span>
                <span>100% (كامل الفائض)</span>
              </div>
            </div>

            {/* Distribution Strategy Mode */}
            <div>
              <label className="text-xs font-black text-slate-700 dark:text-slate-300 mb-2 block">
                استراتيجية توزيع المبلغ:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { hapticFeedback('light'); setMode('equal'); }}
                  className={cn(
                    "p-3 rounded-2xl border text-right transition-all cursor-pointer",
                    mode === 'equal'
                      ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 text-indigo-900 dark:text-white font-black"
                      : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                  )}
                >
                  <span className="text-xs font-black block">توزيع متساوٍ ⚖️</span>
                  <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">تقسيم المبلغ بالتساوي على جميع الأهداف</span>
                </button>

                <button
                  type="button"
                  onClick={() => { hapticFeedback('light'); setMode('priority'); }}
                  className={cn(
                    "p-3 rounded-2xl border text-right transition-all cursor-pointer",
                    mode === 'priority'
                      ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 text-indigo-900 dark:text-white font-black"
                      : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                  )}
                >
                  <span className="text-xs font-black block">أولوية الطوارئ 🛡️</span>
                  <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">70% لصناديق الطوارئ والرضيع، 30% للبقية</span>
                </button>
              </div>
            </div>

            {/* Target Breakdown preview */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-black text-slate-400 block">معاينة الحصة لكل هدف:</span>
              
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                {standardGoals.map(g => {
                  const amt = allocations[g.id] || 0;
                  return (
                    <div key={g.id} className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between border border-slate-100 dark:border-slate-700/60">
                      <div className="flex items-center gap-2">
                        <Target size={14} className="text-indigo-500 shrink-0" />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{g.name}</span>
                      </div>
                      <span className="text-xs font-black font-mono text-emerald-600 dark:text-emerald-400">
                        +{formatCurrency(amt, currency)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 flex gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-xl text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 font-bold text-xs transition-all cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleApplyAllocation}
                className="flex-1 py-2.5 px-4 rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 font-black text-xs transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check size={15} />
                <span>تأكيد التحويل للأهداف ({formatCurrency(amountToDistribute, currency)})</span>
              </button>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default QuickAllocateModal;
