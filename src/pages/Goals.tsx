import React, { useState, useMemo } from 'react';
import { useAppContext } from '../store/AppContext';
import { Goal } from '../types';
import { formatCurrency, hapticFeedback, getBudgetRange, getBudgetMonth, cn } from '../utils';
import { parseISO } from 'date-fns';
import { motion } from 'motion/react';
import { Target, Plus, Trash, Calendar, TrendingUp, Sparkles, Trophy, ArrowUpRight, ArrowDownRight, History } from 'lucide-react';
import NumericKeypad from '../components/NumericKeypad';
import { AnimatePresence } from 'motion/react';

const GoalsPage = () => {
  const { goals, addGoal, deleteGoal, updateGoal, currency, expenses, income, categories, budget, firstDayOfMonth, addIncome, addExpense, accounts, setIsAddModalOpen, setInitialGoalId } = useAppContext();
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [deadline, setDeadline] = useState(new Date().toISOString().split('T')[0]);
  const [linkedCategoryId, setLinkedCategoryId] = useState<string>('');
  const [isLinkedToOverallBudget, setIsLinkedToOverallBudget] = useState(false);
  const [activeInput, setActiveInput] = useState<'target' | 'current' | null>(null);
  const [showQuickAdd, setShowQuickAdd] = useState<string | null>(null);
  const [quickAddAmount, setQuickAddAmount] = useState('');

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
      setActiveInput(null);
    }
  };

  const handleKeyPress = (val: string) => {
    if (!activeInput) return;
    const setVal = activeInput === 'target' ? setTargetAmount : setCurrentAmount;
    const currentVal = activeInput === 'target' ? targetAmount : currentAmount;

    if (val === '.') {
      if (!currentVal.includes('.')) {
        setVal(prev => prev === '' ? '0.' : prev + '.');
      }
    } else if (val.startsWith('+')) {
      const addVal = Number(val.replace('+', ''));
      setVal(prev => (Number(prev || 0) + addVal).toString());
    } else {
      setVal(prev => prev + val);
    }
  };

  const handleDelete = () => {
    if (!activeInput) return;
    const setVal = activeInput === 'target' ? setTargetAmount : setCurrentAmount;
    setVal(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (!activeInput) return;
    const setVal = activeInput === 'target' ? setTargetAmount : setCurrentAmount;
    setVal('');
  };

  const currentMonth = useMemo(() => getBudgetMonth(new Date(), firstDayOfMonth), [firstDayOfMonth]);
  const { start: monthStart, end: monthEnd } = useMemo(() => getBudgetRange(currentMonth, firstDayOfMonth), [currentMonth, firstDayOfMonth]);

  const monthlyTotals = useMemo(() => {
    const totalExpense = expenses
      .filter(e => {
        if (e.isTransfer) return false;
        const d = parseISO(e.date);
        return d >= monthStart && d <= monthEnd;
      })
      .reduce((sum, e) => sum + e.amount, 0);
    const totalIncome = income
      .filter(i => {
        if (i.isTransfer) return false;
        const d = parseISO(i.date);
        return d >= monthStart && d <= monthEnd;
      })
      .reduce((sum, i) => sum + i.amount, 0);
    
    const categoryExpenses = expenses
      .filter(e => {
        if (e.isTransfer) return false;
        const d = parseISO(e.date);
        return d >= monthStart && d <= monthEnd;
      })
      .reduce((acc, e) => {
        acc[e.categoryId] = (acc[e.categoryId] || 0) + e.amount;
        return acc;
      }, {} as Record<string, number>);

    return { totalExpense, totalIncome, categoryExpenses };
  }, [expenses, income, monthStart, monthEnd]);

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
    }
  };

  const handleQuickAdd = async (goalId: string) => {
    if (!quickAddAmount || isNaN(Number(quickAddAmount))) return;
    
    hapticFeedback('success');
    // We record this as a "Goal Contribution" income linked to the goal
    await addIncome({
      source: `مساهمة في هدف: ${goals.find(g => g.id === goalId)?.name}`,
      amount: Number(quickAddAmount),
      goalId,
      accountId: accounts[0]?.id, // Default to first account
      date: new Date().toISOString().split('T')[0],
    });
    
    setQuickAddAmount('');
    setShowQuickAdd(null);
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
      className="space-y-8 md:space-y-12 pb-32 max-w-5xl mx-auto px-4 md:px-6 relative"
    >
      {/* Atmospheric Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <motion.div 
          animate={{ 
            x: [0, 30, 0],
            y: [0, 50, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="absolute top-[10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-emerald-500/5 blur-[100px]"
        />
        <motion.div 
          animate={{ 
            x: [0, -50, 0],
            y: [0, -30, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px]"
        />
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
            أهداف <span className="text-emerald-500">الادخار</span>
          </h1>
          <p className="text-base text-slate-500 dark:text-slate-400 font-medium">حدد أهدافك المالية وتابع تقدمك نحو تحقيقها</p>
        </div>
      </div>

      {/* Goals Summary Stats */}
      {goals.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm text-center group hover:shadow-md transition-all">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">إجمالي المستهدف</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter group-hover:scale-110 transition-transform">
              {formatCurrency(goals.reduce((sum, g) => sum + g.targetAmount, 0), currency)}
            </p>
          </motion.div>
          <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm text-center group hover:shadow-md transition-all">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">إجمالي المدخرات</p>
            <p className="text-3xl font-black text-emerald-500 tracking-tighter group-hover:scale-110 transition-transform">
              {formatCurrency(goals.reduce((sum, g) => sum + g.currentAmount, 0), currency)}
            </p>
          </motion.div>
          <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm text-center group hover:shadow-md transition-all">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">نسبة الإنجاز الكلية</p>
            <p className="text-3xl font-black text-primary-500 tracking-tighter group-hover:scale-110 transition-transform">
              {goals.reduce((sum, g) => sum + g.targetAmount, 0) > 0 
                ? Math.round((goals.reduce((sum, g) => sum + g.currentAmount, 0) / goals.reduce((sum, g) => sum + g.targetAmount, 0)) * 100) 
                : 0}%
            </p>
          </motion.div>
        </div>
      )}

      {/* Add Goal Form */}
      <motion.div 
        variants={itemVariants}
        className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl p-6 md:p-8 rounded-3xl border-2 border-dashed border-primary-500/20 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500">
            <Plus size={20} />
          </div>
          <h2 className="text-sm font-black text-slate-900 dark:text-white tracking-tight uppercase">إضافة هدف ادخار جديد</h2>
        </div>

        <form onSubmit={handleAddGoal} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">اسم الهدف</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: تجهيزات المولود"
                className="w-full p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50 text-base outline-none focus:ring-8 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-black"
                required
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">المبلغ المستهدف</label>
              <div className="relative group">
                <div className={cn(
                  "absolute -inset-1 bg-gradient-to-r from-primary-500 to-indigo-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200",
                  activeInput === 'target' ? "opacity-40" : "opacity-0"
                )}></div>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="none"
                    readOnly
                    value={targetAmount}
                    onFocus={() => setActiveInput('target')}
                    placeholder="0.00"
                    className={cn(
                      "w-full p-5 rounded-2xl border-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl text-xl outline-none transition-all font-mono font-black cursor-pointer shadow-lg",
                      activeInput === 'target' ? "border-primary-500 text-primary-600" : "border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white"
                    )}
                    required
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs">{currency}</span>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">المبلغ المتوفر</label>
              <div className="relative group">
                <div className={cn(
                  "absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200",
                  activeInput === 'current' ? "opacity-40" : "opacity-0"
                )}></div>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="none"
                    readOnly
                    value={currentAmount}
                    onFocus={() => setActiveInput('current')}
                    placeholder="0.00"
                    className={cn(
                      "w-full p-5 rounded-2xl border-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl text-xl outline-none transition-all font-mono font-black cursor-pointer shadow-lg",
                      activeInput === 'current' ? "border-emerald-500 text-emerald-600" : "border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white"
                    )}
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs">{currency}</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">الموعد النهائي</label>
              <div className="relative">
                <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 size-5" />
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full pr-12 pl-4 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50 text-base outline-none focus:ring-8 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-mono font-black"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div 
              onClick={() => {
                setIsLinkedToOverallBudget(!isLinkedToOverallBudget);
                if (!isLinkedToOverallBudget) setLinkedCategoryId('');
              }}
              className={cn(
                "flex items-center gap-4 p-5 rounded-2xl border-2 border-dashed transition-all cursor-pointer group",
                isLinkedToOverallBudget 
                  ? "border-primary-500 bg-primary-500/5 shadow-lg shadow-primary-500/5" 
                  : "border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800"
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                isLinkedToOverallBudget ? "bg-primary-500 border-primary-500 text-white" : "border-slate-300 dark:border-slate-600"
              )}>
                {isLinkedToOverallBudget && <TrendingUp size={14} />}
              </div>
              <span className={cn(
                "text-sm font-black uppercase tracking-tight transition-colors",
                isLinkedToOverallBudget ? "text-primary-600" : "text-slate-500"
              )}>
                ربط بالميزانية العامة (توفير الفائض الكلي)
              </span>
            </div>

            <div className="space-y-2">
              <select
                value={linkedCategoryId}
                onChange={(e) => {
                  setLinkedCategoryId(e.target.value);
                  if (e.target.value) setIsLinkedToOverallBudget(false);
                }}
                disabled={isLinkedToOverallBudget}
                className="w-full p-5 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50 disabled:opacity-50 text-base outline-none focus:ring-8 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-black uppercase tracking-tight appearance-none cursor-pointer"
              >
                <option value="">ربط بفئة محددة (اختياري)</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          <AnimatePresence>
            {activeInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-3xl border border-slate-100 dark:border-slate-800"
              >
                <div className="flex justify-between items-center mb-4 px-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    إدخال {activeInput === 'target' ? 'المبلغ المستهدف' : 'المبلغ المتوفر'}
                  </span>
                  <button 
                    type="button"
                    onClick={() => setActiveInput(null)}
                    className="text-[10px] font-black text-primary-500 uppercase tracking-widest"
                  >
                    إغلاق
                  </button>
                </div>
                <NumericKeypad 
                  onPress={handleKeyPress}
                  onDelete={handleDelete}
                  onClear={handleClear}
                  type="income"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button 
            whileHover={{ scale: 1.01, y: -2 }}
            whileTap={{ scale: 0.98 }}
            type="submit" 
            className="w-full bg-primary-600 hover:bg-primary-700 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-4 text-lg transition-all shadow-md shadow-primary-500/20 uppercase tracking-[0.2em]"
          >
            <Plus className="size-7" /> إضافة هدف جديد
          </motion.button>
        </form>
      </motion.div>

      {/* Goals List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {goals.length > 0 ? (
          goals.map(goal => {
            const percentage = goal.targetAmount > 0 ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100) : 0;
            const isCompleted = percentage >= 100;
            
            return (
              <motion.div 
                key={goal.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-white/40 dark:border-slate-800/40 shadow-sm hover:shadow-md transition-all relative overflow-hidden group"
              >
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
                        <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                          {goal.name}
                        </h3>
                      </div>
                      <div className="flex items-center gap-3 text-slate-400">
                        <Calendar className="size-5" />
                        <p className="text-[10px] font-black uppercase tracking-widest">
                          الموعد: {goal.deadline}
                          {new Date(goal.deadline) > new Date() && (
                            <span className="mr-3 text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20 lowercase">
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
                  <div className="space-y-8 mb-10 text-center flex flex-col items-center">
                    <div className="space-y-3">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">التقدم الحالي</p>
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
                    <div className="text-center">
                      <span className={cn(
                        "text-5xl md:text-7xl font-black tracking-tighter",
                        isCompleted ? "text-emerald-500" : "text-primary-600"
                      )}>
                        {Math.round(percentage)}%
                      </span>
                    </div>
                  </div>
                    
                    <div className="relative h-6 md:h-8 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner p-1.5 mb-10">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1.5, ease: "circOut" }}
                        className={cn(
                          "h-full rounded-full relative",
                          isCompleted 
                            ? "bg-gradient-to-r from-emerald-500 to-teal-400" 
                            : "bg-gradient-to-r from-primary-600 to-primary-400"
                        )}
                      >
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:24px_24px] animate-[shimmer_2s_linear_infinite]" />
                      </motion.div>
                    </div>

                    {/* Linked Info & Action */}
                  {(goal.isLinkedToOverallBudget || goal.linkedCategoryId) && (
                    <div className="p-6 md:p-8 rounded-2xl bg-white/50 dark:bg-slate-800/50 border-2 border-dashed border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-inner mb-6">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center text-primary-500 shadow-sm border border-slate-100 dark:border-slate-800">
                          <TrendingUp className="size-8" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">مربوط بـ</p>
                          <div className="flex flex-wrap items-center gap-3">
                            <p className="text-base md:text-xl font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">
                              {goal.isLinkedToOverallBudget ? 'الميزانية العامة' : categories.find(c => c.id === goal.linkedCategoryId)?.name}
                            </p>
                            {calculateSurplus(goal) > 0 && (
                              <span className="bg-emerald-500/10 text-emerald-600 text-[11px] font-black px-3 py-1 rounded-lg border border-emerald-500/20">
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
                          className="w-full sm:w-auto bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-2xl transition-all shadow-md shadow-primary-500/20 flex items-center justify-center gap-3"
                        >
                          <Sparkles className="size-6 font-black" />
                          <span className="text-sm font-black uppercase tracking-widest">توفير الفائض</span>
                        </motion.button>
                      )}
                    </div>
                  )}

                  {/* Quick Add & History */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <History size={12} /> سجل العمليات المرتبطة
                      </h4>
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => {
                            setInitialGoalId(goal.id);
                            setIsAddModalOpen(true);
                          }}
                          className="text-[10px] font-black text-emerald-500 uppercase tracking-widest hover:underline"
                        >
                          مساهمة مفصلة
                        </button>
                        <button 
                          onClick={() => setShowQuickAdd(showQuickAdd === goal.id ? null : goal.id)}
                          className="text-[10px] font-black text-primary-500 uppercase tracking-widest hover:underline"
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
                              className="bg-primary-500 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-50"
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
              </motion.div>
            );
          })
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="col-span-full py-24 md:py-40 flex flex-col items-center text-center"
          >
            <div className="relative mb-12">
              <motion.div 
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ duration: 4, repeat: Infinity }}
                className="w-32 h-32 md:w-48 md:h-48 bg-primary-50 dark:bg-primary-900/20 rounded-full flex items-center justify-center text-primary-200 dark:text-primary-800"
              >
                <Target size={80} className="md:size-120 opacity-20 absolute" />
                <Sparkles size={60} className="md:size-80 text-primary-400 dark:text-primary-600" />
              </motion.div>
            </div>
            <h3 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-tight">ابدأ رحلة الادخار</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium max-w-lg mx-auto text-base md:text-2xl leading-relaxed">
              لم تقم بإضافة أي أهداف بعد. حدد ما تطمح إليه ماليًا وابدأ في توفير الفائض لتحقيقه.
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>

  );
};

export default GoalsPage;
