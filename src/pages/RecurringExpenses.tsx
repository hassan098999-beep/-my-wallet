import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useAppContext } from '../store/AppContext';
import { cn, formatCurrency, hapticFeedback, formatTunisianAmount } from '../utils';
import { Skeleton, TransactionSkeleton } from '../components/Skeleton';
import { format, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Plus, Trash, Pencil, RefreshCcw, Calendar, CreditCard, Wallet, ArrowRightLeft, AlertCircle, Clock, X, BarChart3, Receipt, Activity, Check, Users, Coins } from 'lucide-react';
import { DynamicIcon } from '../components/DynamicIcon';
import { PaymentMethod, RecurringInterval, RecurringExpense, Gamaeya } from '../types';
import { CategorySelect } from '../components/CategorySelect';
import { motion, AnimatePresence } from 'motion/react';

// Import unified design system components
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import Badge from '../components/ui/Badge';

const RecurringExpenses = () => {
  const { 
    recurringExpenses, 
    categories, 
    accounts, 
    currency, 
    addRecurringExpense, 
    updateRecurringExpense, 
    deleteRecurringExpense,
    gamaeyas,
    addGamaeya,
    updateGamaeya,
    deleteGamaeya,
    payGamaeyaMonth,
    receiveGamaeyaPayout
  } = useAppContext();
  
  const [activeTab, setActiveTab] = useState<'recurring' | 'gamaeya'>('recurring');
  
  // Gamaeya specific forms states
  const [isAddingGamaeya, setIsAddingGamaeya] = useState(false);
  const [gamaeyaName, setGamaeyaName] = useState('جمعية دخر الشهرية');
  const [gamaeyaAmount, setGamaeyaAmount] = useState('100'); // Since user wants to pay 100 TND monthly by default
  const [gamaeyaMembers, setGamaeyaMembers] = useState(10);
  const [gamaeyaPayoutMonth, setGamaeyaPayoutMonth] = useState(3);
  const [gamaeyaStartDate, setGamaeyaStartDate] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [gamaeyaAccountId, setGamaeyaAccountId] = useState(accounts[0]?.id || 'cash');

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [interval, setInterval] = useState<RecurringInterval>('monthly');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  // Interval-specific states
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState(1); // 1 = Monday
  const [selectedDayOfMonth, setSelectedDayOfMonth] = useState(1);
  const [selectedMonthOfYear, setSelectedMonthOfYear] = useState(0); // 0 = January
  const [selectedDayOfYear, setSelectedDayOfYear] = useState(1);

  const summaryStats = useMemo(() => {
    let totalMonthlyCommitted = 0;
    (recurringExpenses || []).forEach(exp => {
      if (exp.interval === 'daily') {
        totalMonthlyCommitted += exp.amount * 30;
      } else if (exp.interval === 'weekly') {
        totalMonthlyCommitted += exp.amount * 4.33;
      } else if (exp.interval === 'monthly') {
        totalMonthlyCommitted += exp.amount;
      } else if (exp.interval === 'yearly') {
        totalMonthlyCommitted += exp.amount / 12;
      }
    });

    let soonestExpense: RecurringExpense | null = null;
    if (recurringExpenses && recurringExpenses.length > 0) {
      const sortedByNextDate = [...recurringExpenses].sort(
        (a, b) => parseISO(a.nextDate).getTime() - parseISO(b.nextDate).getTime()
      );
      soonestExpense = sortedByNextDate[0];
    }

    return {
      activeCount: recurringExpenses ? recurringExpenses.length : 0,
      monthlyBurden: totalMonthlyCommitted,
      soonest: soonestExpense
    };
  }, [recurringExpenses]);

  const intervalLabels: Record<RecurringInterval, string> = {
    daily: 'يومياً',
    weekly: 'أسبوعياً',
    monthly: 'شهرياً',
    yearly: 'سنوياً'
  };

  const daysOfWeek = [
    { id: 1, label: 'الاثنين' },
    { id: 2, label: 'الثلاثاء' },
    { id: 3, label: 'الأربعاء' },
    { id: 4, label: 'الخميس' },
    { id: 5, label: 'الجمعة' },
    { id: 6, label: 'السبت' },
    { id: 0, label: 'الأحد' },
  ];

  const monthsOfYear = [
    'جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان',
    'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  const calculateNextOccurrence = (type: RecurringInterval, baseDate: Date): string => {
    let next = new Date(baseDate);

    if (type === 'daily') {
      return next.toISOString().split('T')[0];
    }

    if (type === 'weekly') {
      const currentDay = next.getDay();
      const diff = (selectedDayOfWeek + 7 - currentDay) % 7;
      next.setDate(next.getDate() + diff);
      return next.toISOString().split('T')[0];
    }

    if (type === 'monthly') {
      next.setDate(selectedDayOfMonth);
      if (next < baseDate) {
        next.setMonth(next.getMonth() + 1);
      }
      return next.toISOString().split('T')[0];
    }

    if (type === 'yearly') {
      next.setMonth(selectedMonthOfYear);
      next.setDate(selectedDayOfYear);
      if (next < baseDate) {
        next.setFullYear(next.getFullYear() + 1);
      }
      return next.toISOString().split('T')[0];
    }

    return next.toISOString().split('T')[0];
  };

  const handleEdit = (expense: RecurringExpense) => {
    setEditingId(expense.id);
    setAmount(expense.amount.toString());
    setCategoryId(expense.categoryId);
    setSubcategoryId(expense.subcategoryId || '');
    setAccountId(expense.accountId || accounts[0]?.id || '');
    setNote(expense.note);
    setPaymentMethod(expense.paymentMethod);
    setInterval(expense.interval);
    setStartDate(expense.startDate.split('T')[0]);
    
    // Try to infer specific interval states from start date
    const date = new Date(expense.startDate);
    setSelectedDayOfWeek(date.getDay());
    setSelectedDayOfMonth(date.getDate());
    setSelectedMonthOfYear(date.getMonth());
    setSelectedDayOfYear(date.getDate());
    
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingId(null);
    setAmount('');
    setNote('');
    setSubcategoryId('');
    setIsAdding(false);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      hapticFeedback('error');
      toast.error('الرجاء إدخال مبلغ صحيح');
      return;
    }

    hapticFeedback('success');
    const base = new Date(startDate);
    const finalStartDate = calculateNextOccurrence(interval, base);

    const expenseData = {
      amount: Number(amount),
      categoryId: categoryId || categories[0]?.id,
      subcategoryId: subcategoryId || undefined,
      accountId: accountId || undefined,
      note,
      paymentMethod,
      interval,
      startDate: finalStartDate,
      nextDate: finalStartDate,
    };

    if (editingId) {
      updateRecurringExpense(editingId, expenseData);
      toast.success('تم تحديث المصروف المتكرر بنجاح');
    } else {
      addRecurringExpense(expenseData);
      toast.success('تمت إضافة المصروف المتكرر بنجاح');
    }

    resetForm();
  };

  const handleAddGamaeya = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gamaeyaName.trim()) {
      toast.error('الرجاء إدخال اسم الجمعية');
      return;
    }
    const amt = Number(gamaeyaAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error('الرجاء إدخال مبلغ شهري صحيح');
      return;
    }
    addGamaeya({
      name: gamaeyaName,
      monthlyAmount: amt,
      memberCount: gamaeyaMembers,
      payoutMonth: gamaeyaPayoutMonth,
      startDate: gamaeyaStartDate,
      accountId: gamaeyaAccountId,
    });
    toast.success('تم إنشاء وتفعيل الجمعية بنجاح!');
    setIsAddingGamaeya(false);
    // Reset defaults
    setGamaeyaName('جمعية دخر الشهرية');
    setGamaeyaAmount('100');
    setGamaeyaMembers(10);
    setGamaeyaPayoutMonth(3);
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
      className="space-y-8 p-4 pb-32 w-full max-w-full"
    >
      <PageHeader
        title={activeTab === 'recurring' ? "المصاريف المتكررة" : "الجمعيات الادخارية"}
        subtitle={activeTab === 'recurring' ? "أتمتة مصاريفك الدورية لتوفير الوقت والجهد وتجنب التناسي المزعج" : "تنظيم مجموعات مساهمات الادخار الدورية والقبض الشهرية تلقائياً وبكل شفافية"}
        action={
          activeTab === 'recurring' ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (isAdding) {
                  resetForm();
                } else {
                  setIsAdding(true);
                }
              }}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 rounded-button font-black text-xs transition-all shadow-md cursor-pointer select-none",
                isAdding 
                  ? "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400" 
                  : "bg-primary-600 hover:bg-primary-700 text-white shadow-primary-500/20"
              )}
            >
              {isAdding ? <X size={14} /> : <Plus size={14} />}
              <span>{isAdding ? 'إلغاء' : 'إضافة مصروف متكرر'}</span>
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setIsAddingGamaeya(!isAddingGamaeya);
              }}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 rounded-button font-black text-xs transition-all shadow-md cursor-pointer select-none",
                isAddingGamaeya 
                  ? "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400" 
                  : "bg-primary-600 hover:bg-primary-700 text-white shadow-primary-500/20"
              )}
            >
              {isAddingGamaeya ? <X size={14} /> : <Plus size={14} />}
              <span>{isAddingGamaeya ? 'إلغاء' : 'إنشاء جمعية جديدة'}</span>
            </motion.button>
          )
        }
      />

      {/* Tab Switcher */}
      <motion.div 
        variants={itemVariants}
        className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl max-w-lg mx-auto relative z-10 shadow-sm border border-slate-200/50 dark:border-slate-700/50"
      >
        <button
          onClick={() => { hapticFeedback('light'); setActiveTab('recurring'); }}
          className={cn(
            "flex-1 py-3 text-xs md:text-sm font-semibold rounded-xl transition-all cursor-pointer select-none text-center",
            activeTab === 'recurring'
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-black"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          )}
        >
          المصاريف المتكررة والاشتراكات
        </button>
        <button
          onClick={() => { hapticFeedback('light'); setActiveTab('gamaeya'); }}
          className={cn(
            "flex-1 py-3 text-xs md:text-sm font-semibold rounded-xl transition-all cursor-pointer select-none text-center flex items-center justify-center gap-2",
            activeTab === 'gamaeya'
              ? "bg-primary-600 text-white shadow-md font-black"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
          )}
        >
          <Coins size={14} className={activeTab === 'gamaeya' ? "animate-bounce" : ""} />
          الجمعيات التكافلية (الجمعية)
        </button>
      </motion.div>

      {activeTab === 'recurring' && (
        <>
          {/* Commitment Metric Dashboard */}
          <motion.div 
        variants={itemVariants} 
        className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 px-2"
      >
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-3xl p-5 rounded-3xl border border-white/40 dark:border-slate-800/40 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors" />
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 flex items-center justify-center">
              <Receipt size={22} />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">العبء المالي الشهري</p>
              <h3 className="text-xl font-black text-slate-900 dark:text-white leading-none mt-1">
                {formatCurrency(summaryStats.monthlyBurden, currency)}
              </h3>
            </div>
          </div>
        </div>

        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-3xl p-5 rounded-3xl border border-white/40 dark:border-slate-800/40 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center">
              <BarChart3 size={22} />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">الالتزامات النشطة</p>
              <h3 className="text-xl font-black text-slate-900 dark:text-white leading-none mt-1">
                {summaryStats.activeCount} {summaryStats.activeCount === 1 ? 'التزام' : summaryStats.activeCount >= 3 && summaryStats.activeCount <= 10 ? 'التزامات' : 'التزاماً'}
              </h3>
            </div>
          </div>
        </div>

        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-3xl p-5 rounded-3xl border border-white/40 dark:border-slate-800/40 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors" />
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/40 text-amber-500 flex items-center justify-center">
              <Calendar size={22} />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">أقرب دفعة قادمة</p>
              <h3 className="text-sm md:text-base font-black text-slate-900 dark:text-white leading-none mt-2 truncate max-w-[180px]">
                {summaryStats.soonest ? (
                  format(parseISO(summaryStats.soonest.nextDate), 'dd MMMM yyyy', { locale: ar })
                ) : (
                  'لا توجد مدفوعات'
                )}
              </h3>
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            className="overflow-hidden px-2"
          >
            <Card className="p-6 md:p-8 mb-8 border border-white/40 dark:border-slate-800/40 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-primary-500/10 flex items-center justify-center text-primary-500 shadow-inner">
                  {editingId ? <Pencil size={24} /> : <Plus size={24} />}
                </div>
                <div>
                  <h2 className="text-base md:text-lg font-bold text-slate-900 dark:text-white">
                    {editingId ? 'تعديل المصروف الدوري' : 'إضافة مصروف دوري جديد'}
                  </h2>
                  <p className="text-xs font-semibold text-slate-500">قم بجدولة مدفوعاتك القادمة بدقة</p>
                </div>
              </div>

              <form onSubmit={handleAdd} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2">المبلغ ({currency})</label>
                    <div className="relative group">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={amount}
                        onChange={(e) => setAmount(formatTunisianAmount(e.target.value))}
                        onFocus={(e) => {
                          if (!amount || amount === '0' || amount === '0.000' || parseFloat(amount) === 0) {
                            setAmount('');
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
                          if (!amount || amount === '0' || amount === '0.000' || parseFloat(amount) === 0) {
                            setAmount('');
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
                        placeholder="0.000"
                        className="w-full p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50 text-base outline-none focus:ring-8 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-mono font-black"
                        required
                      />
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs">{currency}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2">الفئة</label>
                    <CategorySelect
                      categories={categories}
                      selectedId={categoryId}
                      onChange={(id) => {
                        setCategoryId(id);
                        setSubcategoryId('');
                      }}
                      className="!h-[56px] !rounded-2xl"
                    />
                  </div>

                  {categories.find(c => c.id === categoryId)?.subcategories && categories.find(c => c.id === categoryId)!.subcategories!.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2">التصنيف الفرعي</label>
                      <select
                        value={subcategoryId}
                        onChange={(e) => setSubcategoryId(e.target.value)}
                        className="w-full p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50 text-base outline-none focus:ring-8 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-black uppercase tracking-tight appearance-none cursor-pointer"
                      >
                        <option value="">اختر تصنيفاً فرعياً (اختياري)</option>
                        {categories.find(c => c.id === categoryId)?.subcategories?.map((sub, idx) => (
                          <option key={idx} value={sub}>{sub}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="space-y-2 lg:col-span-2">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2">دورة التكرار</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {(['daily', 'weekly', 'monthly', 'yearly'] as RecurringInterval[]).map((int) => (
                        <button
                          key={int}
                          type="button"
                          onClick={() => setInterval(int)}
                          className={cn(
                            "py-4 rounded-2xl border-2 border-dashed text-xs font-semibold transition-all",
                            interval === int
                              ? "border-primary-500 bg-primary-500/5 text-primary-600 shadow-lg shadow-primary-500/5"
                              : "border-slate-100 dark:border-slate-800 text-slate-400 hover:border-slate-200"
                          )}
                        >
                          {intervalLabels[int]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    {interval === 'weekly' && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-2 lg:col-span-3"
                      >
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2">يوم التكرار</label>
                        <div className="flex flex-wrap gap-2">
                          {daysOfWeek.map((day) => (
                            <button
                              key={day.id}
                              type="button"
                              onClick={() => setSelectedDayOfWeek(day.id)}
                              className={cn(
                                "px-4 py-3 rounded-xl border-2 border-dashed text-xs font-semibold transition-all",
                                selectedDayOfWeek === day.id
                                  ? "border-primary-500 bg-primary-500 text-white shadow-lg shadow-primary-500/20"
                                  : "border-slate-100 dark:border-slate-800 text-slate-400"
                              )}
                            >
                              {day.label}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {interval === 'monthly' && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-2 lg:col-span-3"
                      >
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2">يوم الشهر</label>
                        <div className="grid grid-cols-7 sm:grid-cols-10 gap-2">
                          {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                            <button
                              key={day}
                              type="button"
                              onClick={() => setSelectedDayOfMonth(day)}
                              className={cn(
                                "w-10 h-10 rounded-xl border-2 border-dashed text-xs font-semibold transition-all flex items-center justify-center",
                                selectedDayOfMonth === day
                                  ? "border-primary-500 bg-primary-500 text-white shadow-lg shadow-primary-500/20"
                                  : "border-slate-100 dark:border-slate-800 text-slate-400"
                              )}
                            >
                              {day}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {interval === 'yearly' && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:col-span-3"
                      >
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2">الشهر</label>
                          <select
                            value={selectedMonthOfYear}
                            onChange={(e) => setSelectedMonthOfYear(Number(e.target.value))}
                            className="w-full p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50 text-base outline-none focus:ring-8 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-black uppercase tracking-tight appearance-none cursor-pointer"
                          >
                            {monthsOfYear.map((month, idx) => (
                              <option key={idx} value={idx}>{month}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2">اليوم</label>
                          <input
                            type="number"
                            min="1"
                            max="31"
                            value={selectedDayOfMonth}
                            onChange={(e) => setSelectedDayOfMonth(Number(e.target.value))}
                            className="w-full p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50 text-base outline-none focus:ring-8 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-mono font-black"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2">الحساب</label>
                    <select
                      value={accountId}
                      onChange={(e) => setAccountId(e.target.value)}
                      className="w-full p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50 text-base outline-none focus:ring-8 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-black uppercase tracking-tight appearance-none cursor-pointer"
                    >
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2">تاريخ البدء</label>
                    <div className="relative">
                      <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 size-5" />
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full pr-12 pl-4 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50 text-base outline-none focus:ring-8 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-mono font-black"
                        required
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2 lg:col-span-1 space-y-2">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2">ملاحظة (اختياري)</label>
                    <input
                      type="text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="w-full p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50 text-base outline-none focus:ring-8 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-black"
                      placeholder="مثال: اشتراك نتفليكس..."
                    />
                  </div>

                  <div className="md:col-span-3 space-y-4">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2">طريقة الدفع</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { id: 'cash', label: 'نقدي', icon: Wallet },
                        { id: 'card', label: 'بطاقة', icon: CreditCard },
                        { id: 'transfer', label: 'تحويل', icon: ArrowRightLeft }
                      ].map(method => (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                          className={cn(
                            "flex items-center gap-4 p-4 rounded-2xl border-2 border-dashed transition-all group",
                            paymentMethod === method.id
                              ? "border-primary-500 bg-primary-500/5 text-primary-600 shadow-lg shadow-primary-500/5"
                              : "border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-200 dark:hover:border-slate-700"
                          )}
                        >
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm",
                            paymentMethod === method.id ? "bg-primary-500 text-white shadow-lg shadow-primary-500/20" : "bg-slate-100 dark:bg-slate-800"
                          )}>
                            <method.icon size={20} />
                          </div>
                          <span className="font-semibold text-xs leading-none">{method.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="btn-primary w-full h-14 rounded-2xl font-semibold flex items-center justify-center gap-2 text-base transition-all shadow-md shadow-primary-500/20"
                >
                  {editingId ? <Pencil size={20} /> : <RefreshCcw size={20} />}
                  {editingId ? 'حفظ التعديلات' : 'إضافة المصروف المتكرر'}
                </motion.button>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3 md:space-y-4 px-2">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-500">
            <Clock className="size-3.5 md:size-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">قائمة المصاريف المتكررة</h2>
            <p className="text-[11px] font-medium text-slate-500">إدارة وجدولة مدفوعاتك الدورية</p>
          </div>
        </div>
        
        {recurringExpenses && recurringExpenses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {recurringExpenses.map(expense => {
              const category = categories.find(c => c.id === expense.categoryId);
              const daysUntil = Math.ceil((parseISO(expense.nextDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
              const isSoon = daysUntil <= 3 && daysUntil >= 0;

              return (
                <motion.div 
                  key={expense.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full"
                >
                  <Card className="p-6 md:p-8 w-full group relative overflow-hidden" interactive>
                    <div className="relative z-10 flex flex-col gap-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:rotate-6 text-white",
                            category?.color || "bg-primary-500"
                          )} style={{ backgroundColor: category?.color }}>
                            {category?.icon ? (
                              <DynamicIcon name={category.icon} size={28} />
                            ) : (
                              <Clock size={28} />
                            )}
                          </div>
                          <div className="space-y-0.5">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                              {expense.note || (expense.subcategoryId ? `${category?.name} - ${expense.subcategoryId}` : category?.name)}
                            </h3>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-semibold text-primary-600 dark:text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded-md">
                                {intervalLabels[expense.interval]}
                              </span>
                              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                                {category?.name}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleEdit(expense)}
                            className="text-slate-300 hover:text-primary-500 p-2 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-all active:scale-90 cursor-pointer"
                          >
                            <Pencil className="size-5" />
                          </button>
                          <button 
                            onClick={() => {
                              deleteRecurringExpense(expense.id);
                              toast.success('تم حذف المصروف المتكرر');
                            }}
                            className="text-slate-300 hover:text-rose-500 p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all active:scale-90 cursor-pointer"
                          >
                            <Trash className="size-5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-end justify-between pt-4 border-t border-slate-100 dark:border-slate-800/50">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <Calendar size={12} />
                            <span className="text-[11px] font-medium">
                              القادم: {format(parseISO(expense.nextDate), 'dd MMM yyyy', { locale: ar })}
                            </span>
                          </div>
                          {isSoon && (
                            <div className="flex items-center gap-1.5 text-rose-500 animate-pulse">
                              <AlertCircle size={12} />
                              <span className="text-[11px] font-semibold">يستحق قريباً</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="text-right">
                          <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
                            {formatCurrency(expense.amount, currency)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Background Decoration */}
                    <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-primary-500/5 rounded-full blur-[60px] group-hover:bg-primary-500/10 transition-colors duration-700" />
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={RefreshCcw}
            title="لا توجد مصاريف متكررة"
            description="قم بإضافة مصاريفك الثابتة (مثل الإيجار أو الاشتراكات) ليتم تسجيلها وجدولتها تلقائياً عبر الأيام!"
            actionLabel="إضافة أول مصروف متكرر"
            onAction={() => {
              hapticFeedback('medium');
              setIsAdding(true);
            }}
          />
        )}
      </div>
      </>
      )}

      {activeTab === 'gamaeya' && (
        <>
          {/* Gamaeya Stats Dashboard */}
          <motion.div 
            variants={itemVariants} 
            className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 px-2"
          >
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-3xl p-5 rounded-3xl border border-white/40 dark:border-slate-800/40 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-primary-500/5 rounded-full blur-2xl group-hover:bg-primary-500/10 transition-colors" />
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary-100 dark:bg-primary-950/40 text-primary-600 flex items-center justify-center">
                  <Coins size={22} className="text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">إجمالي اشتراكاتك النشطة</p>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white leading-none mt-1">
                    {(gamaeyas || []).filter(g => g.status === 'active').length} جمعيات
                  </h3>
                </div>
              </div>
            </div>

            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-3xl p-5 rounded-3xl border border-white/40 dark:border-slate-800/40 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-colors" />
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center">
                  <Activity size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">تدفع كل شهر للجمعيات</p>
                  <h3 className="text-xl font-black text-rose-600 dark:text-rose-400 leading-none mt-1">
                    {formatCurrency((gamaeyas || []).filter(g => g.status === 'active').reduce((sum, g) => sum + g.monthlyAmount, 0), currency)}
                  </h3>
                </div>
              </div>
            </div>

            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-3xl p-5 rounded-3xl border border-white/40 dark:border-slate-800/40 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors" />
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/40 text-amber-500 flex items-center justify-center">
                  <Users size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">العوائد المستهدفة للقبض</p>
                  <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400 leading-none mt-1">
                    {formatCurrency((gamaeyas || []).filter(g => g.status === 'active').reduce((sum, g) => sum + (g.monthlyAmount * g.memberCount), 0), currency)}
                  </h3>
                </div>
              </div>
            </div>
          </motion.div>

          <AnimatePresence>
            {isAddingGamaeya && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -20 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -20 }}
                className="overflow-hidden px-2"
              >
                <Card className="p-6 md:p-8 mb-8 border border-white/40 dark:border-slate-800/40 shadow-sm bg-white/50 backdrop-blur-xl">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800/50">
                    <div className="flex items-center gap-2">
                      <Coins className="text-primary-500 size-5 animate-spin" style={{ animationDuration: '3s' }} />
                      <h3 className="text-lg font-black text-slate-900 dark:text-white">تخصيص جمعية جديدة</h3>
                    </div>
                    <button 
                      onClick={() => setIsAddingGamaeya(false)} 
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <form onSubmit={handleAddGamaeya} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2">اسم الجمعية</label>
                        <input
                          type="text"
                          value={gamaeyaName}
                          onChange={(e) => setGamaeyaName(e.target.value)}
                          className="w-full p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50 text-base outline-none focus:ring-8 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-black"
                          placeholder="مثال: جمعية الأصدقاء، جمعية العائلة..."
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2">مساهمتك الشهرية ({currency})</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={gamaeyaAmount}
                          onChange={(e) => setGamaeyaAmount(formatTunisianAmount(e.target.value))}
                          onFocus={(e) => {
                            if (!gamaeyaAmount || gamaeyaAmount === '0' || gamaeyaAmount === '0.000' || parseFloat(gamaeyaAmount) === 0) {
                              setGamaeyaAmount('');
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
                            if (!gamaeyaAmount || gamaeyaAmount === '0' || gamaeyaAmount === '0.000' || parseFloat(gamaeyaAmount) === 0) {
                              setGamaeyaAmount('');
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
                          className="w-full p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50 text-base outline-none focus:ring-8 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-mono font-black"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2">عدد المشتركين (مدة الجمعية بالأشهر)</label>
                        <select
                          value={gamaeyaMembers}
                          onChange={(e) => setGamaeyaMembers(Number(e.target.value))}
                          className="w-full p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50 text-base outline-none focus:ring-8 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-black cursor-pointer appearance-none"
                        >
                          {[2,3,4,5,6,7,8,9,10,12,15,18,20,24].map(n => (
                            <option key={n} value={n}>{n} أشهر ({n} أعضاء)</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2">ترتيب قبضك (الشهر الذي تستلم فيه المبلغ)</label>
                        <select
                          value={gamaeyaPayoutMonth}
                          onChange={(e) => setGamaeyaPayoutMonth(Number(e.target.value))}
                          className="w-full p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50 text-base outline-none focus:ring-8 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-black cursor-pointer appearance-none"
                        >
                          {Array.from({ length: gamaeyaMembers }, (_, i) => i + 1).map(m => (
                            <option key={m} value={m}>الشهر {m} {m === 1 ? '(الأول)' : m === gamaeyaMembers ? '(الأخير)' : ''}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2">تاريخ البداية (شهر/سنة)</label>
                        <input
                          type="month"
                          value={gamaeyaStartDate}
                          onChange={(e) => setGamaeyaStartDate(e.target.value)}
                          className="w-full p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50 text-base outline-none focus:ring-8 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-mono font-black"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2">الحساب المرتبط</label>
                        <select
                          value={gamaeyaAccountId}
                          onChange={(e) => setGamaeyaAccountId(e.target.value)}
                          className="w-full p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50 text-base outline-none focus:ring-8 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-black appearance-none cursor-pointer"
                        >
                          {accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="bg-primary-50/50 dark:bg-primary-950/20 p-4 rounded-2xl border border-primary-100/50 dark:border-primary-900/50 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="p-3 bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 rounded-xl">
                        <Activity size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">ملخص الحسابات الذكي للجمعية:</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                          سوف تقوم بدفع <span className="font-bold text-primary-600 dark:text-primary-400">{gamaeyaAmount} {currency}</span> شهرياً لمدة <span className="font-bold text-slate-800 dark:text-slate-200">{gamaeyaMembers} أشهر</span>. 
                          وستستلم العائد الإجمالي بقيمة <span className="font-bold text-emerald-600 dark:text-emerald-400">{Number(gamaeyaAmount) * gamaeyaMembers} {currency}</span> دفعة واحدة في <span className="font-bold text-primary-600">الشهر {gamaeyaPayoutMonth}</span>.
                        </p>
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.01, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      className="btn-primary w-full h-14 rounded-2xl font-semibold flex items-center justify-center gap-2 text-base transition-all shadow-md shadow-primary-500/20 cursor-pointer"
                    >
                      <Plus size={20} />
                      إنشاء وتفعيل الجمعية التكافلية
                    </motion.button>
                  </form>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Gamaeya list */}
          <div className="space-y-4 px-2">
            <h2 className="text-sm font-semibold text-slate-950 dark:text-white flex items-center gap-2">
              <Coins size={16} /> قائمة الجمعيات النشطة
            </h2>

            {(gamaeyas || []).length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                {(gamaeyas || []).map(g => {
                  const paidMonthsCount = (g.payments || []).filter(p => p.paid).length;
                  const totalMonths = g.memberCount;
                  const payoutTotalSum = g.monthlyAmount * g.memberCount;
                  const isPayoutCollected = (g.payments || []).some(p => p.monthIndex === g.payoutMonth && p.payoutReceived);

                  return (
                    <Card key={g.id} className="p-6 md:p-8 overflow-hidden relative group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full blur-[80px]" />
                      
                      <div className="flex flex-col gap-6 relative z-10">
                        {/* Card Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-950/50 text-primary-500 rounded-2xl flex items-center justify-center shadow-inner">
                              <Coins size={22} className="text-primary-600 dark:text-primary-400 animate-pulse" />
                            </div>
                            <div>
                              <h3 className="text-lg font-black text-slate-900 dark:text-white">{g.name}</h3>
                              <p className="text-xs text-slate-400">تاريخ البدء: {g.startDate}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            {g.status === 'completed' ? (
                              <Badge variant="success">مكتملة</Badge>
                            ) : (
                              <Badge variant="warning">نشطة</Badge>
                            )}
                            <button
                              onClick={() => {
                                if (confirm('هل أنت متأكد من حذف هذه الجمعية؟ لن يتم حذف المصاريف والمدخولات المسجلة سابقاً.')) {
                                  deleteGamaeya(g.id);
                                  toast.success('تم حذف الجمعية');
                                }
                              }}
                              className="text-slate-300 hover:text-rose-500 p-2 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all cursor-pointer"
                            >
                              <Trash size={18} />
                            </button>
                          </div>
                        </div>

                        {/* Card Info Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50/50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/50">
                          <div>
                            <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">مساهمتك الشهرية</span>
                            <p className="text-base font-black text-slate-900 dark:text-white mt-0.5">{g.monthlyAmount} {currency}</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">مبلغ القبض الإجمالي</span>
                            <p className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{payoutTotalSum} {currency}</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">دورك في قبض الجمعية</span>
                            <p className="text-base font-black text-amber-500 dark:text-amber-400 mt-0.5">الشهر {g.payoutMonth} من {totalMonths}</p>
                          </div>
                        </div>

                        {/* Payment Progress bar */}
                        <div>
                          <div className="flex justify-between text-xs font-semibold mb-2">
                            <span className="text-slate-500 dark:text-slate-400">تقدم المساهمات والمدفوعات</span>
                            <span className="text-primary-600 dark:text-primary-400">{paidMonthsCount} من إجمالي {totalMonths} أشهر دفعت {`(${Math.round(paidMonthsCount / totalMonths * 100)}%)`}</span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                            <div className="bg-primary-600 h-full transition-all" style={{ width: `${paidMonthsCount / totalMonths * 100}%` }} />
                          </div>
                        </div>

                        {/* Visual beads (أقساط الجمعية) */}
                        <div className="space-y-3">
                          <label className="text-xs font-bold text-slate-600 dark:text-slate-300">أقساط المساهمات والأشهر:</label>
                          <div className="flex flex-wrap gap-2.5">
                            {(g.payments || []).map(p => {
                              const isPayoutGoal = p.monthIndex === g.payoutMonth;
                              return (
                                <div
                                  key={p.monthIndex}
                                  className={cn(
                                    "flex flex-col items-center gap-1.5 p-2 rounded-xl text-center min-w-[70px] border relative transition-all",
                                    p.paid 
                                      ? "bg-emerald-500/5 border-emerald-500/30 text-emerald-600" 
                                      : isPayoutGoal && !isPayoutCollected
                                        ? "bg-amber-500/5 border-amber-500/30 text-amber-600"
                                        : "bg-slate-50 dark:bg-slate-900 border-slate-200/50 dark:border-slate-800/50 text-slate-500"
                                  )}
                                >
                                  <span className="text-[9px] font-semibold dark:text-slate-400">الشهر {p.monthIndex}</span>
                                  {p.paid ? (
                                    <div className="w-7 h-7 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs shadow-md">
                                      <Check size={14} />
                                    </div>
                                  ) : isPayoutGoal ? (
                                    <div className="w-7 h-7 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs animate-pulse shadow-md cursor-pointer select-none">
                                      🎁
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        hapticFeedback('medium');
                                        payGamaeyaMonth(g.id, p.monthIndex);
                                      }}
                                      className="w-7 h-7 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-200 border-2 border-slate-300 dark:border-slate-700 rounded-full flex items-center justify-center text-xs cursor-pointer select-none font-black"
                                    >
                                      {p.monthIndex}
                                    </button>
                                  )}

                                  <span className="text-[9px] font-bold">
                                    {isPayoutGoal ? 'شهر القبض' : p.paid ? 'تم الدفع' : 'دفع القسط'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Collect/Payout Actions */}
                        {!isPayoutCollected && (
                          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/50 flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="text-right">
                              <span className="text-xs font-semibold text-slate-400">العائد المتاح عند دورك</span>
                              <p className="text-xs text-slate-500 dark:text-slate-400">بمساهمتك المنتظمة وزملائك، ستستلم القيمة الكاملة {payoutTotalSum} {currency}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                hapticFeedback('success');
                                receiveGamaeyaPayout(g.id);
                              }}
                              className="w-full md:w-auto px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer select-none flex items-center justify-center gap-2"
                            >
                              🎁 استلام وقبض الجمعية الكلية ({payoutTotalSum} {currency})
                            </button>
                          </div>
                        )}
                        {isPayoutCollected && (
                          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/50 bg-emerald-500/5 p-4 rounded-xl border border-dashed border-emerald-500/20 flex items-center gap-2 justify-center text-emerald-600 font-bold text-xs">
                            🎉 مبروك! لقد قمت بقبض هذه الجمعية بنجاح وتم تحصين ميزانيتك.
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={Coins}
                title="لا توجد جمعيات نشطة حالياً"
                description="أضف مجموعات التوفير والادخار (الجمعية) ووزّع الأدوار بنظام ذكي لتتبع مساهماتك واستلام القبض تلقائياً!"
                actionLabel="تفعيل وإنشاء أول جمعية"
                onAction={() => {
                  hapticFeedback('medium');
                  setIsAddingGamaeya(true);
                }}
              />
            )}
          </div>
        </>
      )}
  </motion.div>
  );
};

export default RecurringExpenses;
