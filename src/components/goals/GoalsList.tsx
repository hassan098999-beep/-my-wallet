import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Target, Trash, Calendar, Trophy, Shield, Sparkles, TrendingUp, 
  History, ArrowUpRight, ArrowDownRight 
} from 'lucide-react';
import toast from 'react-hot-toast';

import { Goal, Category, Expense, Income, Budget, Account } from '../../types';
import { formatCurrency, hapticFeedback, cn } from '../../utils';

import Card from '../ui/Card';
import EmptyState from '../ui/EmptyState';

interface GoalsListProps {
  standardGoals: Goal[];
  currency: string;
  expenses: Expense[];
  income: Income[];
  categories: Category[];
  budget: Budget | undefined;
  monthlyTotals: {
    totalExpense: number;
    totalIncome: number;
    categoryExpenses: Record<string, number>;
  };
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  addIncome: (income: Omit<Income, 'id' | 'createdAt'>) => void;
  accounts: Account[];
  setIsAddModalOpen: (isOpen: boolean) => void;
  setInitialGoalId: (id: string) => void;
}

const GoalsList: React.FC<GoalsListProps> = ({
  standardGoals,
  currency,
  expenses,
  income,
  categories,
  budget,
  monthlyTotals,
  updateGoal,
  deleteGoal,
  addIncome,
  accounts,
  setIsAddModalOpen,
  setInitialGoalId,
}) => {
  const [showQuickAdd, setShowQuickAdd] = useState<string | null>(null);
  const [quickAddAmount, setQuickAddAmount] = useState('');

  const calculateSurplus = (goal: Goal) => {
    if (goal.isLinkedToOverallBudget) {
      return Math.max(0, monthlyTotals.totalIncome - monthlyTotals.totalExpense);
    }
    if (goal.linkedCategoryId && budget?.categoryBudgets?.[goal.linkedCategoryId]) {
      const categoryExpense = monthlyTotals.categoryExpenses[goal.linkedCategoryId] || 0;
      const categoryBudget = budget.categoryBudgets[goal.linkedCategoryId];
      return Math.max(0, categoryBudget - categoryExpense);
    }
    return 0;
  };

  const handleContributeSurplus = (goal: Goal) => {
    const surplus = calculateSurplus(goal);
    if (surplus > 0) {
      hapticFeedback('medium');
      updateGoal(goal.id, {
        currentAmount: goal.currentAmount + surplus
      });
      toast.success(
        <div className="flex flex-col gap-1">
          <span className="font-bold text-sm">عمل رائع! 🚀</span>
          <span className="text-xs opacity-90">لقد ساهمت في هدفك المالي بمبلغ {formatCurrency(surplus, currency)}</span>
        </div>,
        { duration: 4000 }
      );
    }
  };

  const handleQuickAdd = (goalId: string) => {
    if (!quickAddAmount || isNaN(Number(quickAddAmount))) return;
    
    hapticFeedback('success');
    addIncome({
      source: `مساهمة في هدف: ${standardGoals.find(g => g.id === goalId)?.name}`,
      amount: Number(quickAddAmount),
      goalId,
      accountId: accounts[0]?.id,
      date: new Date().toISOString().split('T')[0],
    });
    
    toast.success(
      <div className="flex flex-col gap-1">
        <span className="font-bold text-sm">خطوة ممتازة نحو هدفك! 🌱</span>
        <span className="text-xs opacity-90">تمت إضافة {formatCurrency(Number(quickAddAmount), currency)} للاستثمار في مستقبلك</span>
      </div>,
      { duration: 4000 }
    );
    
    setQuickAddAmount('');
    setShowQuickAdd(null);
  };

  const handleDeleteGoal = (id: string) => {
    hapticFeedback('warning');
    deleteGoal(id);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {standardGoals.length > 0 ? (
        standardGoals.map(goal => {
          const percentage = goal.targetAmount > 0 ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100) : 0;
          const isCompleted = percentage >= 100;
          
          return (
            <motion.div 
              key={goal.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full"
            >
              <Card className="p-6 md:p-8 w-full group relative overflow-hidden h-full" interactive>
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-10">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-14 h-14 rounded-2xl flex items-center justify-center shadow-md transition-transform group-hover:rotate-6",
                          isCompleted ? "bg-emerald-500 text-white" : "bg-primary-500/10 text-primary-500"
                        )}>
                          {isCompleted ? <Trophy size={28} /> : <Target size={28} />}
                        </div>
                        <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight flex items-center gap-2 flex-wrap">
                          <span>{goal.name}</span>
                          {goal.isEmergencyFund && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-black uppercase tracking-wider bg-rose-500 text-white rounded-full transition-all shadow-xs shrink-0 select-none">
                              <Shield size={12} className="shrink-0" />
                              <span>صندوق طوارئ العائلة 🛡️</span>
                            </span>
                          )}
                        </h3>
                      </div>
                      <div className="flex items-center gap-3 text-slate-400">
                        <Calendar className="size-5" />
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          الموعد: {goal.deadline}
                          {new Date(goal.deadline) > new Date() && (
                            <span className="mr-3 text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                              {Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} يوم متبقي
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDeleteGoal(goal.id)} 
                      className="text-slate-300 hover:text-rose-500 p-4 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-2xl transition-all active:scale-90"
                    >
                      <Trash className="size-6" />
                    </button>
                  </div>

                  {/* Progress Section */}
                  <div className="space-y-8 mb-6 text-center flex flex-col items-center">
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-slate-500">التقدم الحالي</p>
                      <p className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
                        {formatCurrency(goal.currentAmount, currency)}
                        <span className="text-slate-200 dark:text-slate-700 mx-4">/</span>
                        <span className="text-slate-400 text-xl md:text-2xl">{formatCurrency(goal.targetAmount, currency)}</span>
                      </p>
                      {!isCompleted && (
                        <p className="text-xs font-bold text-slate-400">
                          متبقي <span className="text-primary-500">{formatCurrency(goal.targetAmount - goal.currentAmount, currency)}</span> للوصول للهدف
                        </p>
                      )}
                    </div>
                    <div className="text-center space-y-4">
                      <span className={cn(
                        "text-5xl md:text-7xl font-black tracking-tighter block",
                        isCompleted ? "text-emerald-500" : "text-primary-600"
                      )}>
                        {Math.round(percentage)}%
                      </span>
                      <p className={cn(
                        "text-sm font-semibold px-4 py-2 rounded-xl inline-block",
                        isCompleted 
                          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20" 
                          : percentage >= 75 
                            ? "bg-amber-50 text-amber-600 dark:bg-amber-900/20"
                            : percentage >= 50
                              ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20"
                              : percentage > 0
                                ? "bg-primary-50 text-primary-600 dark:bg-primary-900/20"
                                : "bg-slate-50 text-slate-500 dark:bg-slate-800"
                      )}>
                        {isCompleted 
                          ? "تهانينا! لقد حققت هدفك المالي 🎯" 
                          : percentage >= 75 
                            ? "أنت تقترب بشدة! واصل تفوقك 🔥"
                            : percentage >= 50
                              ? "لقد تجاوزت منتصف الطريق! أحسنت 🚀"
                              : percentage > 0
                                ? "بداية ممتازة، خطوة بخطوة ستصل للهدف 🌱"
                                : "ابدأ الآن، كل مبلغ صغير يصنع فرقاً 💡"
                        }
                      </p>
                    </div>
                  </div>
                    
                  <div className="relative mt-8 mb-12">
                    <div className="flex justify-between items-end mb-2 px-2">
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 block mb-0.5">المنجز</span>
                        <span className="text-sm font-black text-slate-700 dark:text-slate-300">{Math.round(percentage)}%</span>
                      </div>
                      <div className="text-left">
                        <span className="text-[10px] font-bold text-slate-400 block mb-0.5">المتبقي</span>
                        <span className="text-sm font-black text-primary-500">{Math.round(100 - percentage)}%</span>
                      </div>
                    </div>
                    
                    <div className="relative h-4 md:h-5 bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-visible shadow-inner">
                      {/* Target line markers */}
                      <div className="absolute top-0 bottom-0 left-1/4 w-px bg-slate-200/50 dark:bg-slate-700/50 z-0"></div>
                      <div className="absolute top-0 bottom-0 left-1/2 w-px bg-slate-200/50 dark:bg-slate-700/50 z-0"></div>
                      <div className="absolute top-0 bottom-0 left-3/4 w-px bg-slate-200/50 dark:bg-slate-700/50 z-0"></div>

                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                        className={cn(
                          "h-full rounded-full relative z-10",
                          isCompleted 
                            ? "bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400" 
                            : "bg-gradient-to-r from-indigo-500 via-primary-500 to-purple-500"
                        )}
                      >
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:16px_16px] animate-[shimmer_2s_linear_infinite]" />
                        
                        {/* Creative moving element at the tip */}
                        <div className="absolute top-1/2 -left-3 md:-left-4 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-white dark:bg-slate-800 rounded-full shadow-lg border-4 border-slate-50 dark:border-slate-900 flex items-center justify-center z-20">
                          {isCompleted ? (
                            <motion.div
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ repeat: Infinity, duration: 2 }}
                            >
                              <Trophy size={14} className="text-emerald-500 md:w-5 md:h-5" />
                            </motion.div>
                          ) : (
                            <motion.div
                              animate={{ rotate: [0, 10, -10, 0] }}
                              transition={{ repeat: Infinity, duration: 1.5 }}
                            >
                              <Sparkles size={14} className="text-primary-500 md:w-5 md:h-5" />
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    </div>
                  </div>

                  {/* Linked Info & Action */}
                  {(goal.isLinkedToOverallBudget || goal.linkedCategoryId) && (
                    <div className="p-6 md:p-8 rounded-2xl bg-white/50 dark:bg-slate-800/50 border-2 border-dashed border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-inner mb-6">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center text-primary-500 shadow-sm border border-slate-100 dark:border-slate-800">
                          <TrendingUp className="size-8" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-[11px] font-semibold text-slate-500">مربوط بـ</p>
                          <div className="flex flex-wrap items-center gap-3">
                            <p className="text-base md:text-xl font-bold text-slate-700 dark:text-slate-200 tracking-tight">
                              {goal.isLinkedToOverallBudget ? 'الميزانية العامة' : categories.find(c => c.id === goal.linkedCategoryId)?.name}
                            </p>
                            {calculateSurplus(goal) > 0 && (
                              <span className="bg-emerald-500/10 text-emerald-600 text-[11px] font-semibold px-3 py-1 rounded-lg border border-emerald-500/20">
                                +{formatCurrency(calculateSurplus(goal), currency)} فائض
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {calculateSurplus(goal) > 0 && (
                        <motion.button 
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleContributeSurplus(goal)}
                          className="w-full sm:w-auto btn-primary px-8 py-4 rounded-2xl transition-all shadow-md shadow-primary-500/20 flex items-center justify-center gap-2"
                        >
                          <Sparkles className="size-5" />
                          <span className="text-sm font-semibold">توفير الفائض</span>
                        </motion.button>
                      )}
                    </div>
                  )}

                  {/* Quick Add & History */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-slate-500 flex items-center gap-2">
                        <History size={12} /> سجل العمليات المرتبطة
                      </h4>
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => {
                            setInitialGoalId(goal.id);
                            setIsAddModalOpen(true);
                          }}
                          className="text-xs font-semibold text-emerald-600 hover:underline"
                        >
                          مساهمة مفصلة
                        </button>
                        <button 
                          onClick={() => setShowQuickAdd(showQuickAdd === goal.id ? null : goal.id)}
                          className="text-xs font-semibold text-primary-600 hover:underline"
                        >
                          {showQuickAdd === goal.id ? 'إلغاء' : 'إضافة سريعة'}
                        </button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {showQuickAdd === goal.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4"
                        >
                          <div className="flex gap-2">
                            <input
                              type="number"
                              value={quickAddAmount}
                              onChange={(e) => setQuickAddAmount(e.target.value)}
                              placeholder="المبلغ..."
                              className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-primary-500"
                            />
                            <button
                              onClick={() => handleQuickAdd(goal.id)}
                              disabled={!quickAddAmount}
                              className="btn-primary px-4 py-2 rounded-xl text-xs font-semibold disabled:opacity-50"
                            >
                              إضافة
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                      {[...expenses, ...income]
                        .filter(t => t.goalId === goal.id)
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .slice(0, 5)
                        .map(t => {
                          const isExpense = 'categoryId' in t;
                          return (
                            <div key={t.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100/50 dark:border-slate-800/50">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-8 h-8 rounded-lg flex items-center justify-center",
                                  isExpense ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-500"
                                )}>
                                  {isExpense ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
                                    {isExpense ? (categories.find(c => c.id === t.categoryId)?.name || 'مصروف') : t.source}
                                  </span>
                                  <span className="text-[8px] font-medium text-slate-400">{t.date}</span>
                                </div>
                              </div>
                              <span className={cn(
                                "text-xs font-black tracking-tight",
                                isExpense ? "text-rose-500" : "text-emerald-500"
                              )}>
                                {isExpense ? '-' : '+'}{formatCurrency(t.amount, currency)}
                              </span>
                            </div>
                          );
                        })}
                      {[...expenses, ...income].filter(t => t.goalId === goal.id).length === 0 && (
                        <p className="text-[10px] text-slate-400 text-center py-4 italic">لا توجد عمليات مرتبطة بهذا الهدف بعد</p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Background Decoration */}
                <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-primary-500/5 rounded-full blur-[100px] group-hover:bg-primary-500/10 transition-colors duration-700" />
              </Card>
            </motion.div>
          );
        })
      ) : (
        <div className="col-span-full">
          <EmptyState
            icon={Target}
            title="ابدأ رحلة الادخار"
            description="لم تقم بإضافة أي أهداف بعد. حدد ما تطمح إليه ماليًا وابدأ في توفير الفائض لتحقيقه."
            actionLabel="أضف أول هدف ادخار"
            onAction={() => {
              hapticFeedback('medium');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </div>
      )}
    </div>
  );
};

export default GoalsList;
