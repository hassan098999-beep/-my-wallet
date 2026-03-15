import React, { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { Goal } from '../types';
import { formatCurrency, hapticFeedback } from '../utils';
import { motion, AnimatePresence } from 'motion/react';
import { Target, Plus, Trash2, Calendar, TrendingUp, Sparkles, Trophy } from 'lucide-react';
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
      hapticFeedback('success');
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
      hapticFeedback('medium');
      updateGoal(goal.id, {
        currentAmount: goal.currentAmount + surplus
      });
    }
  };

  const handleDeleteGoal = (id: string) => {
    hapticFeedback('warning');
    deleteGoal(id);
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
      className="space-y-6 md:space-y-12 pb-20 max-w-5xl mx-auto"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-8">
        <div className="space-y-1.5">
          <h1 className="text-2xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            أهداف <span className="text-emerald-600">الادخار</span>
          </h1>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 font-medium">حدد أهدافك المالية وتابع تقدمك نحو تحقيقها</p>
        </div>
      </div>

      {/* Add Goal Form */}
      <motion.form 
        variants={itemVariants}
        onSubmit={handleAddGoal} 
        className="glass-card p-5 md:p-8 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">اسم الهدف</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: تجهيزات المولود"
              className="w-full p-3 md:p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 text-sm md:text-base outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-black uppercase tracking-tight"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">المبلغ المستهدف</label>
            <input
              type="number"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              placeholder="0.00"
              className="w-full p-3 md:p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 text-sm md:text-base outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-mono font-black"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">المبلغ المتوفر</label>
            <input
              type="number"
              value={currentAmount}
              onChange={(e) => setCurrentAmount(e.target.value)}
              placeholder="0.00"
              className="w-full p-3 md:p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 text-sm md:text-base outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-mono font-black"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">الموعد النهائي</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full p-3 md:p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 text-sm md:text-base outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-mono font-black"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-6">
          <div className="flex items-center gap-4 p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 shadow-sm transition-all hover:bg-white dark:hover:bg-slate-800 group">
            <div className="relative flex items-center">
              <input
                type="checkbox"
                id="overallBudget"
                checked={isLinkedToOverallBudget}
                onChange={(e) => {
                  setIsLinkedToOverallBudget(e.target.checked);
                  if (e.target.checked) setLinkedCategoryId('');
                }}
                className="w-6 h-6 rounded-lg text-emerald-600 focus:ring-emerald-500 transition-all border-2 border-dashed border-slate-300 dark:border-slate-600 bg-transparent cursor-pointer"
              />
            </div>
            <label htmlFor="overallBudget" className="text-sm md:text-base font-black text-slate-700 dark:text-slate-300 cursor-pointer select-none uppercase tracking-tight">
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
              className="w-full p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 disabled:opacity-50 text-sm md:text-base outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-black uppercase tracking-tight appearance-none"
            >
              <option value="">ربط بفئة محددة (اختياري)</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        <motion.button 
          whileHover={{ scale: 1.01, y: -2 }}
          whileTap={{ scale: 0.98 }}
          type="submit" 
          className="mt-8 w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 md:py-5 rounded-[1.5rem] font-black flex items-center justify-center gap-3 text-sm md:text-lg transition-all shadow-xl shadow-emerald-500/20 uppercase tracking-widest"
        >
          <Plus className="size-6" /> إضافة هدف جديد
        </motion.button>
      </motion.form>

      {/* Goals List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {goals.length > 0 ? (
          goals.map(goal => {
            const percentage = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
            const isCompleted = percentage >= 100;
            
            return (
              <motion.div 
                key={goal.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6 md:p-8 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group"
              >
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-8 md:mb-10">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shadow-lg",
                          isCompleted ? "bg-emerald-500 text-white" : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600"
                        )}>
                          {isCompleted ? <Trophy size={20} /> : <Target size={20} />}
                        </div>
                        <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                          {goal.name}
                        </h3>
                      </div>
                      <div className="flex items-center gap-3 text-slate-400">
                        <Calendar className="size-4" />
                        <p className="text-[10px] md:text-xs font-black uppercase tracking-widest">الموعد: {goal.deadline}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDeleteGoal(goal.id)} 
                      className="text-slate-300 hover:text-rose-500 p-3 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-2xl transition-all shadow-sm hover:shadow-md active:scale-90"
                    >
                      <Trash2 className="size-5 md:size-6" />
                    </button>
                  </div>

                  {/* Progress Section */}
                  <div className="space-y-5 md:space-y-6 mb-8 md:mb-10">
                    <div className="flex justify-between items-end">
                      <div className="space-y-2">
                        <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">التقدم الحالي</p>
                        <p className="text-xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                          {formatCurrency(goal.currentAmount, currency)}
                          <span className="text-slate-300 dark:text-slate-600 mx-3">/</span>
                          <span className="text-slate-400 text-sm md:text-lg">{formatCurrency(goal.targetAmount, currency)}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={cn(
                          "text-3xl md:text-5xl font-black tracking-tighter",
                          isCompleted ? "text-emerald-500" : "text-emerald-600"
                        )}>
                          {Math.round(percentage)}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="relative h-4 md:h-6 bg-slate-100 dark:bg-slate-700/50 rounded-full overflow-hidden shadow-inner p-1">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1.5, ease: "circOut" }}
                        className={cn(
                          "h-full rounded-full relative",
                          isCompleted 
                            ? "bg-gradient-to-r from-emerald-500 to-teal-400" 
                            : "bg-gradient-to-r from-emerald-600 to-emerald-400"
                        )}
                      >
                        {/* Shine effect */}
                        <div className="absolute inset-0 bg-white/20 skew-x-12 -translate-x-full animate-[shimmer_2s_infinite]" />
                      </motion.div>
                    </div>
                  </div>

                  {/* Linked Info & Action */}
                  {(goal.isLinkedToOverallBudget || goal.linkedCategoryId) && (
                    <div className="p-5 md:p-6 rounded-[1.5rem] bg-slate-50/50 dark:bg-slate-900/40 border-2 border-dashed border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-inner">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-emerald-500 shadow-sm border border-slate-100 dark:border-slate-700">
                          <TrendingUp className="size-6 md:size-7" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">مربوط بـ</p>
                          <p className="text-sm md:text-lg font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">
                            {goal.isLinkedToOverallBudget ? 'الميزانية العامة' : categories.find(c => c.id === goal.linkedCategoryId)?.name}
                          </p>
                        </div>
                      </div>
                      
                      {calculateSurplus(goal) > 0 && (
                        <motion.button 
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleContributeSurplus(goal)}
                          className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 md:px-8 md:py-4 rounded-2xl transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3"
                        >
                          <Sparkles className="size-5 font-black" />
                          <span className="text-xs md:text-sm font-black uppercase tracking-widest">توفير الفائض</span>
                        </motion.button>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Background Decoration */}
                <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-colors duration-700" />
              </motion.div>
            );
          })
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="col-span-full py-20 md:py-32 flex flex-col items-center text-center"
          >
            <div className="relative mb-8 md:mb-12">
              <motion.div 
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ duration: 4, repeat: Infinity }}
                className="w-32 h-32 md:w-48 md:h-48 bg-emerald-50 dark:bg-emerald-900/20 rounded-[3rem] md:rounded-[4rem] flex items-center justify-center text-emerald-200 dark:text-emerald-800"
              >
                <Target size={64} className="md:size-96 opacity-20 absolute" />
                <Sparkles size={48} className="md:size-64 text-emerald-400 dark:text-emerald-600" />
              </motion.div>
            </div>
            <h3 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white mb-4 uppercase tracking-tight">ابدأ رحلة الادخار</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium max-w-md mx-auto text-sm md:text-xl leading-relaxed">
              لم تقم بإضافة أي أهداف بعد. حدد ما تطمح إليه ماليًا وابدأ في توفير الفائض لتحقيقه.
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default GoalsPage;
