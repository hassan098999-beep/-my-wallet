import React from 'react';
import { motion } from 'motion/react';
import { PiggyBank, Target, Sparkles, Link as LinkIcon } from 'lucide-react';
import EmptyState from '../ui/EmptyState';
import { formatCurrency } from '../../utils';
import { Goal, Category } from '../../types';

interface SavingsGoalAllocationsProps {
  standardGoals: Goal[];
  customAllocations: Record<string, number | string>;
  savingsPercentage: number;
  currency: string;
  categories: Category[];
  getSuggestedAllocation: (goal: Goal) => number;
  getEffectiveAllocation: (goal: Goal) => number;
  calculateSurplus: (goal: Goal) => number;
  handleCustomAllocationChange: (goalId: string, value: string) => void;
  handleAllocateAll: () => void;
  handleAllocateSingle: (goal: Goal) => void;
}

export const SavingsGoalAllocations: React.FC<SavingsGoalAllocationsProps> = ({
  standardGoals,
  customAllocations,
  savingsPercentage,
  currency,
  categories,
  getSuggestedAllocation,
  getEffectiveAllocation,
  calculateSurplus,
  handleCustomAllocationChange,
  handleAllocateAll,
  handleAllocateSingle,
}) => {
  const totalEffectiveAllocation = standardGoals.reduce((sum, g) => sum + getEffectiveAllocation(g), 0);

  return (
    <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-slate-100 dark:border-slate-800">
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-4 md:p-6 rounded-2xl md:rounded-3xl text-white shadow-md shadow-emerald-500/20 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
        <div className="space-y-1 md:space-y-2 text-center">
          <p className="text-emerald-100 font-bold text-[8px] md:text-[10px] uppercase tracking-widest">إجمالي التخصيص المقترح</p>
          <p className="text-2xl md:text-4xl font-black tracking-tighter">
            {formatCurrency(totalEffectiveAllocation, currency)}
          </p>
        </div>
        
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleAllocateAll}
          disabled={standardGoals.length === 0 || totalEffectiveAllocation === 0}
          className="w-full md:w-auto bg-white text-emerald-600 px-6 py-3 md:px-8 md:py-4 rounded-xl md:rounded-2xl font-black text-xs md:text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg cursor-pointer"
        >
          <PiggyBank size={18} /> 
          <span>توزيع على كل الأهداف ({standardGoals.length})</span>
        </motion.button>
      </div>
      
      {standardGoals.length === 0 && (
        <div className="mt-8">
          <EmptyState
            icon={Target}
            title="لا توجد أهداف ادخارية مسجلة حالياً"
            description="أضف أهدافك الادخارية المحددة لتقوم بربط حركة ميزانيتك المباشرة واستخراج الفائض المالي!"
            actionLabel="إنشاء وتحديد هدف ادخاري الآن"
            onAction={() => window.location.hash = '#/goals'}
          />
        </div>
      )}

      {standardGoals.length > 0 && (
        <div className="mt-8 space-y-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">التخصيص المقترح لكل هدف</p>
          <div className="grid grid-cols-1 gap-4">
            {standardGoals.map(goal => {
              const percentage = goal.targetAmount > 0 ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100) : 0;
              const suggestedAllocation = getSuggestedAllocation(goal);
              const effectiveAllocation = getEffectiveAllocation(goal);
              const surplus = calculateSurplus(goal);
              const isLinked = goal.isLinkedToOverallBudget || goal.linkedCategoryId;
              
              return (
                <div key={goal.id} className="p-4 md:p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-700 dark:text-slate-200">{goal.name}</span>
                        {isLinked && (
                          <span className="flex items-center gap-1 bg-primary-500/10 text-primary-600 text-[9px] font-bold px-2 py-0.5 rounded-md">
                            <LinkIcon size={10} />
                            {goal.isLinkedToOverallBudget ? 'الميزانية العامة' : categories.find(c => c.id === goal.linkedCategoryId)?.name}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-black text-emerald-600">{Math.round(percentage)}%</span>
                    </div>
                    
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        className="h-full bg-emerald-500"
                      />
                    </div>
                    
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                      <span>الحالي: {formatCurrency(goal.currentAmount, currency)}</span>
                      <span>الهدف: {formatCurrency(goal.targetAmount, currency)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center md:justify-center gap-4 md:w-1/2 md:pl-4 md:border-l border-slate-200 dark:border-slate-700 text-center">
                    <div className="space-y-1 text-center flex-1 flex flex-col items-center">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">المقترح ({savingsPercentage}%)</p>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-slate-400 text-xs font-bold">+</span>
                        <input
                          type="number"
                          value={customAllocations[goal.id] !== undefined ? customAllocations[goal.id] : suggestedAllocation}
                          onChange={(e) => handleCustomAllocationChange(goal.id, e.target.value)}
                          onFocus={(e) => {
                            const currentVal = customAllocations[goal.id] !== undefined ? customAllocations[goal.id] : suggestedAllocation;
                            if (!currentVal || currentVal === 0 || currentVal === '0') {
                              handleCustomAllocationChange(goal.id, '');
                            } else {
                              const target = e.target;
                              setTimeout(() => {
                                try {
                                  target.setSelectionRange(0, target.value.length);
                                } catch (err) {
                                  target.select();
                                }
                              }, 50);
                            }
                          }}
                          onClick={(e) => {
                            const currentVal = customAllocations[goal.id] !== undefined ? customAllocations[goal.id] : suggestedAllocation;
                            if (!currentVal || currentVal === 0 || currentVal === '0') {
                              handleCustomAllocationChange(goal.id, '');
                            } else {
                              const target = e.target as HTMLInputElement;
                              setTimeout(() => {
                                try {
                                  target.setSelectionRange(0, target.value.length);
                                } catch (err) {
                                  target.select();
                                }
                              }, 50);
                            }
                          }}
                          className="w-24 p-1 text-lg font-black text-emerald-600 dark:text-emerald-400 bg-transparent border-b-2 border-slate-200 dark:border-slate-700 focus:border-emerald-500 outline-none text-center"
                          dir="ltr"
                        />
                      </div>
                      {isLinked && (
                        <p className="text-[8px] text-slate-400">من فائض {formatCurrency(surplus, currency)}</p>
                      )}
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleAllocateSingle(goal)}
                      disabled={effectiveAllocation <= 0}
                      className="w-10 h-10 shrink-0 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors cursor-pointer"
                      title="تخصيص هذا المبلغ"
                    >
                      <Sparkles size={18} />
                    </motion.button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SavingsGoalAllocations;
