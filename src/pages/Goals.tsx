import React, { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { Goal } from '../types';
import { formatCurrency } from '../utils';
import { motion, AnimatePresence } from 'motion/react';
import { Target, Plus, Trash2, Calendar } from 'lucide-react';
import { cn } from '../utils';

const GoalsPage = () => {
  const { goals, addGoal, deleteGoal, updateGoal, currency, expenses, income, categories, budget } = useAppContext();
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [deadline, setDeadline] = useState(new Date().toISOString().split('T')[0]);
  const [linkedCategoryId, setLinkedCategoryId] = useState<string>('');
  const [isLinkedToOverallBudget, setIsLinkedToOverallBudget] = useState(false);

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && Number(targetAmount) > 0) {
      addGoal({
        name,
        targetAmount: Number(targetAmount),
        currentAmount: Number(currentAmount) || 0,
        deadline,
        linkedCategoryId: linkedCategoryId || undefined,
        isLinkedToOverallBudget: isLinkedToOverallBudget,
      });
      setName('');
      setTargetAmount('');
      setCurrentAmount('');
      setLinkedCategoryId('');
      setIsLinkedToOverallBudget(false);
    }
  };

  const calculateSurplus = (goal: Goal) => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    if (goal.isLinkedToOverallBudget) {
      const totalExpense = expenses.filter(e => e.date.startsWith(currentMonth)).reduce((sum, e) => sum + e.amount, 0);
      const totalIncome = income.filter(i => i.date.startsWith(currentMonth)).reduce((sum, i) => sum + i.amount, 0);
      return Math.max(0, totalIncome - totalExpense);
    }
    if (goal.linkedCategoryId && budget?.categoryBudgets?.[goal.linkedCategoryId]) {
      const categoryExpense = expenses
        .filter(e => e.date.startsWith(currentMonth) && e.categoryId === goal.linkedCategoryId)
        .reduce((sum, e) => sum + e.amount, 0);
      const categoryBudget = budget.categoryBudgets[goal.linkedCategoryId];
      return Math.max(0, categoryBudget - categoryExpense);
    }
    return 0;
  };

  const handleContributeSurplus = (goal: Goal) => {
    const surplus = calculateSurplus(goal);
    if (surplus > 0) {
      updateGoal(goal.id, {
        currentAmount: goal.currentAmount + surplus
      });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 md:space-y-8 pb-20 max-w-5xl mx-auto"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 md:gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            أهداف <span className="text-primary-600">الادخار</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">حدد أهدافك المالية وتابع تقدمك نحو تحقيقها</p>
        </div>
      </div>

      {/* Add Goal Form */}
      <motion.form 
        variants={itemVariants}
        onSubmit={handleAddGoal} 
        className="glass-card p-5 md:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          <div className="space-y-2">
            <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest pl-1">اسم الهدف</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: تجهيزات المولود"
              className="w-full p-3 md:p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 text-sm md:text-base outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all shadow-sm"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest pl-1">المبلغ المستهدف</label>
            <input
              type="number"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              placeholder="0.00"
              className="w-full p-3 md:p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 text-sm md:text-base outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all shadow-sm font-mono"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest pl-1">المبلغ المتوفر</label>
            <input
              type="number"
              value={currentAmount}
              onChange={(e) => setCurrentAmount(e.target.value)}
              placeholder="0.00"
              className="w-full p-3 md:p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 text-sm md:text-base outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all shadow-sm font-mono"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest pl-1">الموعد النهائي</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full p-3 md:p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 text-sm md:text-base outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all shadow-sm"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 mt-5 md:mt-6">
          <div className="flex items-center gap-3 p-3.5 md:p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 shadow-sm transition-all hover:bg-white dark:hover:bg-slate-800">
            <input
              type="checkbox"
              id="overallBudget"
              checked={isLinkedToOverallBudget}
              onChange={(e) => {
                setIsLinkedToOverallBudget(e.target.checked);
                if (e.target.checked) setLinkedCategoryId('');
              }}
              className="w-5 h-5 md:w-6 md:h-6 rounded-md text-primary-600 focus:ring-primary-500 transition-all"
            />
            <label htmlFor="overallBudget" className="text-sm md:text-base font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
              ربط بالميزانية العامة (توفير الفائض الكلي)
            </label>
          </div>

          <div className="space-y-2">
            <select
              value={linkedCategoryId}
              onChange={(e) => {
                setLinkedCategoryId(e.target.value);
                if (e.target.value) setIsLinkedToOverallBudget(false);
              }}
              disabled={isLinkedToOverallBudget}
              className="w-full p-3.5 md:p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 disabled:opacity-50 text-sm md:text-base outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all shadow-sm appearance-none"
            >
              <option value="">ربط بفئة محددة (اختياري)</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        <motion.button 
          whileHover={{ scale: 1.01, y: -1 }}
          whileTap={{ scale: 0.99 }}
          type="submit" 
          className="mt-6 md:mt-8 w-full bg-primary-600 hover:bg-primary-700 text-white py-3.5 md:py-4 rounded-2xl font-black flex items-center justify-center gap-2 text-sm md:text-base transition-all shadow-lg shadow-primary-500/20"
        >
          <Plus size={20} md:size={24} /> إضافة هدف جديد
        </motion.button>
      </motion.form>

      {/* Goals List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
        {goals.map(goal => {
          const percentage = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
          const isCompleted = percentage >= 100;
          
          return (
            <motion.div 
              key={goal.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-5 md:p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all relative overflow-hidden group"
            >
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6 md:mb-8">
                  <div className="space-y-2">
                    <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight group-hover:text-primary-600 transition-colors leading-tight mb-1 md:mb-2">
                      {goal.name}
                    </h3>
                    <div className="flex items-center gap-2 md:gap-3 text-slate-400">
                      <Calendar size={14} md:size={16} />
                      <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest">الموعد: {goal.deadline}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => deleteGoal(goal.id)} 
                    className="text-slate-300 hover:text-rose-500 p-2.5 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all shadow-sm hover:shadow-md"
                  >
                    <Trash2 size={18} md:size={20} />
                  </button>
                </div>

                {/* Progress Section */}
                <div className="space-y-4 md:space-y-5 mb-6 md:mb-8">
                  <div className="flex justify-between items-end">
                    <div className="space-y-1.5 md:space-y-2">
                      <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">التقدم الحالي</p>
                      <p className="text-base md:text-xl font-black text-slate-900 dark:text-white">
                        {formatCurrency(goal.currentAmount, currency)}
                        <span className="text-slate-300 dark:text-slate-600 mx-2">/</span>
                        <span className="text-slate-400 text-xs md:text-sm">{formatCurrency(goal.targetAmount, currency)}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={cn(
                        "text-2xl md:text-3xl font-black tracking-tighter",
                        isCompleted ? "text-emerald-500" : "text-primary-500"
                      )}>
                        {Math.round(percentage)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="relative h-3 md:h-4 bg-slate-100 dark:bg-slate-700/50 rounded-full overflow-hidden shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 1.5, ease: "circOut" }}
                      className={cn(
                        "h-full rounded-full relative",
                        isCompleted 
                          ? "bg-gradient-to-r from-emerald-500 to-teal-400" 
                          : "bg-gradient-to-r from-primary-600 to-indigo-500"
                      )}
                    >
                      {/* Shine effect */}
                      <div className="absolute inset-0 bg-white/20 skew-x-12 -translate-x-full animate-[shimmer_2s_infinite]" />
                    </motion.div>
                  </div>
                </div>

                {/* Linked Info & Action */}
                {(goal.isLinkedToOverallBudget || goal.linkedCategoryId) && (
                  <div className="p-4 md:p-5 rounded-2xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-inner">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-primary-500 shadow-sm">
                        <Target size={20} md:size={24} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">مربوط بـ</p>
                        <p className="text-sm md:text-base font-black text-slate-700 dark:text-slate-200">
                          {goal.isLinkedToOverallBudget ? 'الميزانية العامة' : categories.find(c => c.id === goal.linkedCategoryId)?.name}
                        </p>
                      </div>
                    </div>
                    
                    {calculateSurplus(goal) > 0 && (
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleContributeSurplus(goal)}
                        className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 md:px-5 md:py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                      >
                        <Plus size={16} md:size={18} className="font-black" />
                        <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">توفير الفائض</span>
                      </motion.button>
                    )}
                  </div>
                )}
              </div>
              
              {/* Background Decoration */}
              <div className="absolute -right-5 -bottom-5 w-32 h-32 bg-primary-500/5 rounded-full blur-2xl group-hover:bg-primary-500/10 transition-colors" />
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default GoalsPage;
