import React, { useState, useMemo } from 'react';
import { useAppContext } from '../store/AppContext';
import { Goal } from '../types';
import { formatCurrency, hapticFeedback, getBudgetRange, getBudgetMonth, cn } from '../utils';
import { parseISO } from 'date-fns';
import { motion } from 'motion/react';
import { 
  Target, Plus, Trash, Calendar, TrendingUp, Sparkles, Trophy, 
  ArrowUpRight, ArrowDownRight, History, Activity, Coins, Clock, Zap, 
  Info, HelpCircle, Hourglass, ChevronLeft, ChevronRight, Gauge, Shield 
} from 'lucide-react';
import NumericKeypad from '../components/NumericKeypad';
import { AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

// Import unified design system components
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import Badge from '../components/ui/Badge';

const GoalsPage = () => {
  const { goals, addGoal, deleteGoal, updateGoal, currency, expenses, income, categories, budget, firstDayOfMonth, addIncome, addExpense, accounts, setIsAddModalOpen, setInitialGoalId } = useAppContext();
  const standardGoals = useMemo(() => (goals || []).filter(g => !g.isPhysicalPiggyBank), [goals]);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [deadline, setDeadline] = useState(new Date().toISOString().split('T')[0]);
  const [linkedCategoryId, setLinkedCategoryId] = useState<string>('');
  const [isLinkedToOverallBudget, setIsLinkedToOverallBudget] = useState(false);
  const [isEmergencyFund, setIsEmergencyFund] = useState(false);
  const [activeInput, setActiveInput] = useState<'target' | 'current' | null>(null);
  const [showQuickAdd, setShowQuickAdd] = useState<string | null>(null);
  const [quickAddAmount, setQuickAddAmount] = useState('');

  // Simulator State
  const [simGoalId, setSimGoalId] = useState<string>('custom');
  const [simGoalAmount, setSimGoalAmount] = useState<number>(3000);
  const [simSavedAmount, setSimSavedAmount] = useState<number>(500);
  const [simMonthlySavings, setSimMonthlySavings] = useState<number>(250);

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
        isEmergencyFund: isEmergencyFund,
      });
      
      toast.success(
        <div className="flex flex-col gap-1">
          <span className="font-bold text-sm">تم تحديد الهدف بنجاح! 🎯</span>
          <span className="text-xs opacity-90">رحلة الألف ميل تبدأ بخطوة. نتمنى لك التوفيق!</span>
        </div>,
        { duration: 4000 }
      );
      
      setName('');
      setTargetAmount('');
      setCurrentAmount('');
      setLinkedCategoryId('');
      setIsLinkedToOverallBudget(false);
      setIsEmergencyFund(false);
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

  // Simulator Handler to link a goal
  const handleSimGoalChange = (value: string) => {
    setSimGoalId(value);
    if (value !== 'custom') {
      const selected = standardGoals.find(g => g.id === value);
      if (selected) {
        setSimGoalAmount(selected.targetAmount);
        setSimSavedAmount(selected.currentAmount);
      }
    }
  };

  // Calculations for Simulator
  const simRemaining = Math.max(0, simGoalAmount - simSavedAmount);
  
  const simMonthsRequired = useMemo(() => {
    if (simMonthlySavings <= 0) return Infinity;
    return Math.ceil(simRemaining / simMonthlySavings);
  }, [simRemaining, simMonthlySavings]);

  const simResultDateStr = useMemo(() => {
    if (simMonthsRequired === Infinity || simMonthsRequired <= 0) return 'خطة غير نشطة';
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + simMonthsRequired);
    return targetDate.toLocaleDateString('ar-TN', { month: 'long', year: 'numeric' });
  }, [simMonthsRequired]);

  // Accelerators
  const savings15Extra = simMonthlySavings * 1.15;
  const savings30Extra = simMonthlySavings * 1.30;

  const simMonths15 = useMemo(() => {
    if (savings15Extra <= 0) return Infinity;
    return Math.ceil(simRemaining / savings15Extra);
  }, [simRemaining, savings15Extra]);

  const simMonths30 = useMemo(() => {
    if (savings30Extra <= 0) return Infinity;
    return Math.ceil(simRemaining / savings30Extra);
  }, [simRemaining, savings30Extra]);

  const date15Str = useMemo(() => {
    if (simMonths15 === Infinity || simMonths15 <= 0) return 'غير مستمر';
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + simMonths15);
    return targetDate.toLocaleDateString('ar-TN', { month: 'long', year: 'numeric' });
  }, [simMonths15]);

  const date30Str = useMemo(() => {
    if (simMonths30 === Infinity || simMonths30 <= 0) return 'غير مستمر';
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + simMonths30);
    return targetDate.toLocaleDateString('ar-TN', { month: 'long', year: 'numeric' });
  }, [simMonths30]);

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
      toast.success(
        <div className="flex flex-col gap-1">
          <span className="font-bold text-sm">عمل رائع! 🚀</span>
          <span className="text-xs opacity-90">لقد ساهمت في هدفك المالي بمبلغ {formatCurrency(surplus, currency)}</span>
        </div>,
        { duration: 4000 }
      );
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
      className="space-y-8 w-full max-w-full p-4 pb-32 relative"
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

      <PageHeader
        title="أهداف الادخار"
        subtitle="حدد أهدافك المالية وداوم بذكاء لتتبع تقدمك نحو تحقيقها بسلاسة"
      />

      {/* Goals Summary Stats */}
      {standardGoals.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <motion.div 
            variants={itemVariants} 
            className="bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-850/80 shadow-sm md:shadow-md rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg text-center group cursor-pointer"
          >
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">إجمالي المستهدف</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter group-hover:scale-105 transition-transform font-mono">
              {formatCurrency(standardGoals.reduce((sum, g) => sum + g.targetAmount, 0), currency)}
            </p>
          </motion.div>
          <motion.div 
            variants={itemVariants} 
            className="bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-850/80 shadow-sm md:shadow-md rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg text-center group cursor-pointer"
          >
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">إجمالي المدخرات</p>
            <p className="text-3xl font-black text-emerald-500 tracking-tighter group-hover:scale-105 transition-transform font-mono">
              {formatCurrency(standardGoals.reduce((sum, g) => sum + g.currentAmount, 0), currency)}
            </p>
          </motion.div>
          <motion.div 
            variants={itemVariants} 
            className="bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-850/80 shadow-sm md:shadow-md rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg text-center group cursor-pointer"
          >
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">نسبة الإنجاز الكلية</p>
            <p className="text-3xl font-black text-emerald-500 tracking-tighter group-hover:scale-105 transition-transform font-mono">
              {standardGoals.reduce((sum, g) => sum + g.targetAmount, 0) > 0 
                ? Math.round((standardGoals.reduce((sum, g) => sum + g.currentAmount, 0) / standardGoals.reduce((sum, g) => sum + g.targetAmount, 0)) * 100) 
                : 0}%
            </p>
          </motion.div>
        </div>
      )}

      {/* Intelligent Interactive Savings Simulator Card */}
      <motion.div variants={itemVariants}>
        <Card className="p-6 md:p-8 bg-gradient-to-br from-indigo-50/20 via-white to-white dark:from-slate-900/40 dark:via-slate-900 dark:to-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl relative overflow-hidden">
          {/* Subtle design gradient lights */}
          <div className="absolute left-0 top-0 -ml-20 -mt-20 w-80 h-80 bg-primary-500/5 dark:bg-primary-400/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute right-0 bottom-0 -mr-20 -mb-20 w-80 h-80 bg-emerald-500/5 dark:bg-emerald-400/5 rounded-full blur-[100px] pointer-events-none" />

          {/* Widget Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-100 dark:border-slate-800/60 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-500 shrink-0">
                <Hourglass size={24} className="animate-spin-slow text-indigo-500" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>مُحاكي الإدخار والوقت الذكي</span>
                  <Badge variant="success" className="text-[10px] py-0.5">جديد ⚡</Badge>
                </h3>
                <p className="text-[10px] text-slate-400 font-bold">احسب بدقة متناهية المدة اللازمة لتحقيق أهدافك المالية ومستويات تسريعها</p>
              </div>
            </div>

            {/* Quick selector of active goal */}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950/20 border border-slate-200/50 dark:border-slate-800 rounded-xl px-3 py-1.5 shadow-5xs">
              <span className="text-[10px] font-black text-slate-400 shrink-0">ربط بهدف قائم:</span>
              <select
                value={simGoalId}
                onChange={(e) => {
                  hapticFeedback('light');
                  handleSimGoalChange(e.target.value);
                }}
                className="bg-transparent text-xs font-black text-slate-800 dark:text-white outline-none cursor-pointer"
              >
                <option value="custom">✍️ هَدَف مخصص (حرّ)</option>
                {standardGoals.map(g => (
                  <option key={g.id} value={g.id}>🎯 {g.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Interactive Calculator Interface */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
            
            {/* Left Portion: Controls (Sliders & Direct text entry) */}
            <div className="lg:col-span-6 space-y-6">
              
              {/* Target budget input & slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                  <span className="font-black text-slate-400">مبلغ الهدف المالي</span>
                  <span className="font-mono text-slate-800 dark:text-white font-black">{formatCurrency(simGoalAmount, currency)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="100"
                    max="50000"
                    step="100"
                    value={simGoalAmount}
                    onChange={(e) => {
                      hapticFeedback('light');
                      setSimGoalAmount(Number(e.target.value));
                      if (simGoalId !== 'custom') setSimGoalId('custom');
                    }}
                    className="flex-1 accent-indigo-500 h-1 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                  <input
                    type="number"
                    value={simGoalAmount || ''}
                    onChange={(e) => {
                      setSimGoalAmount(Number(e.target.value));
                      if (simGoalId !== 'custom') setSimGoalId('custom');
                    }}
                    onFocus={(e) => {
                      if (!simGoalAmount || simGoalAmount === 0) {
                        setSimGoalAmount(0);
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
                      if (!simGoalAmount || simGoalAmount === 0) {
                        setSimGoalAmount(0);
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
                    className="w-20 text-center bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-lg py-1 px-2 text-xs font-black font-mono text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Already saved money input & slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                  <span className="font-black text-slate-400">المبلغ المتوفر حالياً (الأرضية)</span>
                  <span className="font-mono text-slate-800 dark:text-white font-black">{formatCurrency(simSavedAmount, currency)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max={Math.max(simGoalAmount, 5000)}
                    step="50"
                    value={simSavedAmount}
                    onChange={(e) => {
                      hapticFeedback('light');
                      setSimSavedAmount(Number(e.target.value));
                      if (simGoalId !== 'custom') setSimGoalId('custom');
                    }}
                    className="flex-1 accent-emerald-500 h-1 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                  <input
                    type="number"
                    value={simSavedAmount || ''}
                    onChange={(e) => {
                      setSimSavedAmount(Number(e.target.value));
                      if (simGoalId !== 'custom') setSimGoalId('custom');
                    }}
                    onFocus={(e) => {
                      if (!simSavedAmount || simSavedAmount === 0) {
                        setSimSavedAmount(0);
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
                      if (!simSavedAmount || simSavedAmount === 0) {
                        setSimSavedAmount(0);
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
                    className="w-20 text-center bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-lg py-1 px-2 text-xs font-black font-mono text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Monthly Savings committed */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                  <span className="font-black text-slate-400">معدل الادخار الشهري الملتزم به</span>
                  <span className="font-mono text-slate-800 dark:text-white font-black">{formatCurrency(simMonthlySavings, currency)} / شهر</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="10"
                    max="5000"
                    step="10"
                    value={simMonthlySavings}
                    onChange={(e) => {
                      hapticFeedback('light');
                      setSimMonthlySavings(Number(e.target.value));
                    }}
                    className="flex-1 accent-cyan-500 h-1 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                  <input
                    type="number"
                    value={simMonthlySavings || ''}
                    onChange={(e) => {
                      setSimMonthlySavings(Number(e.target.value));
                    }}
                    onFocus={(e) => {
                      if (!simMonthlySavings || simMonthlySavings === 0) {
                        setSimMonthlySavings(0);
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
                      if (!simMonthlySavings || simMonthlySavings === 0) {
                        setSimMonthlySavings(0);
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
                    className="w-20 text-center bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-lg py-1 px-2 text-xs font-black font-mono text-slate-800 dark:text-white"
                  />
                </div>
              </div>

            </div>

            {/* Right Portion: Mathematical Output, Milestones, Acceleration */}
            <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
              
              {/* Output Result panel */}
              {simMonthlySavings <= 0 ? (
                <div className="bg-slate-50 dark:bg-slate-950/30 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center space-y-2 h-full">
                  <Coins className="text-slate-400 size-8 animate-pulse mb-1" />
                  <p className="text-xs font-black text-slate-600 dark:text-slate-300">الادخار الشهري يساوي صفر!</p>
                  <p className="text-[10px] text-slate-400 leading-relaxed font-medium">الرجاء زيادة معدل الادخار الشهري من لوحة التحكم على اليمين لتصميم جدول الوصول وبلوغ قمتك المالية بنجاح.</p>
                </div>
              ) : simRemaining <= 0 ? (
                <div className="bg-emerald-500/10 rounded-2xl p-6 border border-emerald-500/20 flex flex-col items-center justify-center text-center space-y-2 h-full">
                  <Trophy className="text-amber-500 size-9 animate-[bounce_2s_infinite] mb-1" />
                  <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">لقد حققت الهدف المالي بالفعل! 🎉</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">مبلغ المدخرات المتوفر يغطي أو يتعدى قيمة هدفك المطلوب. أحسنت صنعاً، أنت جاهز لاستثماره أو الاستمتاع بثماره.</p>
                </div>
              ) : (
                <div className="space-y-4 flex-1">
                  
                  {/* Highlight core math */}
                  <div className="p-5 bg-indigo-50/30 dark:bg-slate-950/40 border border-indigo-100/10 rounded-2xl relative overflow-hidden flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1 text-right">
                        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">تقديرات الوقت الذاتية ⏳</span>
                        <h4 className="text-2xl font-black text-slate-800 dark:text-white">
                          {simMonthsRequired >= 12 ? (
                            <>
                              {Math.floor(simMonthsRequired / 12)} <span className="text-xs font-bold text-slate-400">عام</span> {simMonthsRequired % 12 > 0 && (
                                <>
                                  و {simMonthsRequired % 12} <span className="text-xs font-bold text-slate-400">أشهر</span>
                                </>
                              )}
                            </>
                          ) : (
                            <>
                              {simMonthsRequired} <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">أشهر</span>
                            </>
                          )}
                        </h4>
                      </div>

                      {/* Speed badge */}
                      <span className={cn(
                        "text-[9px] font-black px-2.5 py-1 rounded-lg shrink-0",
                        simMonthsRequired <= 6 ? "bg-emerald-500/10 text-emerald-600" :
                        simMonthsRequired <= 18 ? "bg-cyan-500/10 text-cyan-600" :
                        "bg-amber-500/10 text-amber-600"
                      )}>
                        {simMonthsRequired <= 6 ? 'سرعة قصوى ⚡' :
                         simMonthsRequired <= 18 ? 'إيقاع توازني ⚖️' :
                         'مدى استراتيجي طويل 🏔️'}
                      </span>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/40 flex justify-between items-center text-[10px]">
                      <span className="text-slate-400 font-bold">تاريخ الإنجاز التقريبي:</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-black">{simResultDateStr}</span>
                    </div>
                  </div>

                  {/* Acceleration Scenarios */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block pb-1">عجّل وتيرة إنجاز الهدف 🚀</span>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* Extra 15% */}
                      <div className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-xl space-y-1 text-right">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-bold text-emerald-500">+15% سرعة</span>
                          <span className="text-[9px] text-slate-400 font-mono">({formatCurrency(savings15Extra, currency)}/ش)</span>
                        </div>
                        <p className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                          خلال <span className="text-indigo-500 font-mono font-bold">{simMonths15}</span> شهر فقط
                        </p>
                        <p className="text-[8px] text-slate-400 font-medium font-tajawal">
                          توفير ({simMonthsRequired - simMonths15}) أشهر • بحلول {date15Str}
                        </p>
                      </div>

                      {/* Extra 30% */}
                      <div className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-xl space-y-1 text-right">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-bold text-cyan-500">+30% سرعة</span>
                          <span className="text-[9px] text-slate-400 font-mono">({formatCurrency(savings30Extra, currency)}/ش)</span>
                        </div>
                        <p className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                          خلال <span className="text-indigo-500 font-mono font-bold">{simMonths30}</span> شهر فقط
                        </p>
                        <p className="text-[8px] text-slate-400 font-medium font-tajawal">
                          توفير ({simMonthsRequired - simMonths30}) أشهر • بحلول {date30Str}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Milestone Trackers */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-950/20 rounded-xl border border-slate-100 dark:border-slate-850/50 space-y-2">
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block">لوحة محطات التقدم المعيارية</span>
                    
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="space-y-1">
                        <span className="text-[8px] font-bold text-slate-400 block">%25 إنجاز</span>
                        <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-400 w-full" />
                        </div>
                        <span className="text-[8px] font-black font-mono text-slate-600 dark:text-slate-400">
                          {Math.ceil(simMonthsRequired * 0.25)} ش
                        </span>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[8px] font-bold text-slate-400 block">%50 نصف الرحلة</span>
                        <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 w-full" />
                        </div>
                        <span className="text-[8px] font-black font-mono text-slate-600 dark:text-slate-400">
                          {Math.ceil(simMonthsRequired * 0.5)} ش
                        </span>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[8px] font-bold text-slate-400 block">%75 الأمان المالي</span>
                        <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-400 w-full" />
                        </div>
                        <span className="text-[8px] font-black font-mono text-slate-600 dark:text-slate-400">
                          {Math.ceil(simMonthsRequired * 0.75)} ش
                        </span>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[8px] font-bold text-slate-400 block">%100 بلوغ القمة</span>
                        <div className="h-1.5 bg-primary-500 rounded-full" />
                        <span className="text-[8px] font-black font-mono text-primary-500">
                          {simMonthsRequired} ش
                        </span>
                      </div>
                    </div>
                  </div>

                </div>
              )}

            </div>

          </div>

        </Card>
      </motion.div>

      {/* Add Goal Form */}
      <motion.div variants={itemVariants}>
        <Card className="p-6 md:p-8 border-2 border-dashed border-primary-500/20">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500">
              <Plus size={20} />
            </div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">إضافة هدف ادخار جديد</h2>
          </div>

          <form onSubmit={handleAddGoal} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2">اسم الهدف</label>
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
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2">المبلغ المستهدف</label>
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
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2">المبلغ المتوفر</label>
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
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2">الموعد النهائي</label>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div 
              onClick={() => {
                setIsLinkedToOverallBudget(!isLinkedToOverallBudget);
                if (!isLinkedToOverallBudget) setLinkedCategoryId('');
              }}
              className={cn(
                "flex items-center gap-4 p-5 rounded-2xl border-2 border-dashed transition-all cursor-pointer group",
                isLinkedToOverallBudget 
                  ? "border-emerald-500 bg-emerald-500/5 shadow-lg shadow-emerald-500/5" 
                  : "border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800"
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                isLinkedToOverallBudget ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 dark:border-slate-600"
              )}>
                {isLinkedToOverallBudget && <TrendingUp size={14} />}
              </div>
              <span className={cn(
                "text-sm font-black uppercase tracking-tight transition-colors",
                isLinkedToOverallBudget ? "text-emerald-600" : "text-slate-500"
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
                className="w-full p-5 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50 disabled:opacity-50 text-base outline-none focus:ring-8 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-black uppercase tracking-tight appearance-none cursor-pointer"
              >
                <option value="">ربط بفئة محددة (اختياري)</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div 
              onClick={() => setIsEmergencyFund(!isEmergencyFund)}
              className={cn(
                "flex items-center gap-4 p-5 rounded-2xl border-2 border-dashed transition-all cursor-pointer group",
                isEmergencyFund 
                  ? "border-emerald-500 bg-emerald-500/5 shadow-lg shadow-emerald-500/5" 
                  : "border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800"
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                isEmergencyFund ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 dark:border-slate-600"
              )}>
                {isEmergencyFund && <Shield size={14} />}
              </div>
              <span className={cn(
                "text-sm font-black uppercase tracking-tight transition-colors",
                isEmergencyFund ? "text-emerald-600" : "text-slate-500"
              )}>
                صندوق طوارئ عائلي (تأمين العيلة) 🛡️
              </span>
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
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    إدخال {activeInput === 'target' ? 'المبلغ المستهدف' : 'المبلغ المتوفر'}
                  </span>
                  <button 
                    type="button"
                    onClick={() => setActiveInput(null)}
                    className="text-xs font-semibold text-primary-600 dark:text-primary-400"
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
            className="btn-primary w-full h-14 rounded-2xl font-semibold flex items-center justify-center gap-2 text-lg transition-all shadow-md shadow-primary-500/20"
          >
            <Plus className="size-5" /> إضافة هدف جديد
          </motion.button>
        </form>
      </Card>
    </motion.div>

      {/* Goals List */}
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
    </motion.div>

  );
};

export default GoalsPage;
