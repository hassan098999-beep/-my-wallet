import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { parseISO, format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { motion } from 'motion/react';
import { Plus, X, Receipt, BarChart3, Calendar, Coins } from 'lucide-react';

import { useAppContext } from '../store/AppContext';
import { cn, formatCurrency, hapticFeedback } from '../utils';
import { PaymentMethod, RecurringInterval, RecurringExpense } from '../types';

import PageHeader from '../components/ui/PageHeader';
import { RecurringNotificationManager } from '../components/RecurringNotificationManager';

// Sub-components extracted for modularity
import RecurringExpenseForm from '../components/recurring/RecurringExpenseForm';
import RecurringExpensesList from '../components/recurring/RecurringExpensesList';
import GamaeyaForm from '../components/recurring/GamaeyaForm';
import GamaeyaTracker from '../components/recurring/GamaeyaTracker';

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
    deleteGamaeya,
    payGamaeyaMonth,
    receiveGamaeyaPayout
  } = useAppContext();
  
  const [activeTab, setActiveTab] = useState<'recurring' | 'gamaeya'>('recurring');
  
  // Gamaeya specific forms states
  const [isAddingGamaeya, setIsAddingGamaeya] = useState(false);
  const [gamaeyaName, setGamaeyaName] = useState('جمعية دخر الشهرية');
  const [gamaeyaAmount, setGamaeyaAmount] = useState('100');
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
    if (type === 'daily') {
      return format(baseDate, 'yyyy-MM-dd');
    }

    if (type === 'weekly') {
      const currentDay = baseDate.getDay();
      const diff = (selectedDayOfWeek + 7 - currentDay) % 7;
      const next = new Date(baseDate);
      next.setDate(next.getDate() + diff);
      return format(next, 'yyyy-MM-dd');
    }

    if (type === 'monthly') {
      const year = baseDate.getFullYear();
      let month = baseDate.getMonth();
      const lastDayOfThisMonth = new Date(year, month + 1, 0).getDate();
      let targetDay = Math.min(selectedDayOfMonth, lastDayOfThisMonth);
      let candidate = new Date(year, month, targetDay);

      if (candidate < baseDate) {
        month += 1;
        const lastDayOfNextMonth = new Date(year, month + 1, 0).getDate();
        targetDay = Math.min(selectedDayOfMonth, lastDayOfNextMonth);
        candidate = new Date(year, month, targetDay);
      }
      return format(candidate, 'yyyy-MM-dd');
    }

    if (type === 'yearly') {
      let year = baseDate.getFullYear();
      const month = selectedMonthOfYear;
      const maxDay = new Date(year, month + 1, 0).getDate();
      const targetDay = Math.min(selectedDayOfYear, maxDay);
      let candidate = new Date(year, month, targetDay);

      if (candidate < baseDate) {
        year += 1;
        const maxDayNext = new Date(year, month + 1, 0).getDate();
        candidate = new Date(year, month, Math.min(selectedDayOfYear, maxDayNext));
      }
      return format(candidate, 'yyyy-MM-dd');
    }

    return format(baseDate, 'yyyy-MM-dd');
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
          {/* Local Notification System for Recurring Expenses */}
          <motion.div variants={itemVariants} className="px-2">
            <RecurringNotificationManager />
          </motion.div>

          {/* Commitment Metric Dashboard */}
          <motion.div 
            variants={itemVariants} 
            className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 px-2"
          >
            <div className="bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-850/80 shadow-sm md:shadow-md rounded-3xl p-6 relative overflow-hidden group transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer">
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors" />
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 flex items-center justify-center">
                  <Receipt size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">العبء المالي الشهري</p>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white leading-none mt-1 font-mono">
                    {formatCurrency(summaryStats.monthlyBurden, currency)}
                  </h3>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-850/80 shadow-sm md:shadow-md rounded-3xl p-6 relative overflow-hidden group transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer">
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

            <div className="bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-850/80 shadow-sm md:shadow-md rounded-3xl p-6 relative overflow-hidden group transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer">
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

          {/* Form */}
          <RecurringExpenseForm
            isAdding={isAdding}
            editingId={editingId}
            amount={amount}
            setAmount={setAmount}
            categoryId={categoryId}
            setCategoryId={setCategoryId}
            subcategoryId={subcategoryId}
            setSubcategoryId={setSubcategoryId}
            accountId={accountId}
            setAccountId={setAccountId}
            note={note}
            setNote={setNote}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            interval={interval}
            setInterval={setInterval}
            startDate={startDate}
            setStartDate={setStartDate}
            selectedDayOfWeek={selectedDayOfWeek}
            setSelectedDayOfWeek={setSelectedDayOfWeek}
            selectedDayOfMonth={selectedDayOfMonth}
            setSelectedDayOfMonth={setSelectedDayOfMonth}
            selectedMonthOfYear={selectedMonthOfYear}
            setSelectedMonthOfYear={setSelectedMonthOfYear}
            handleAdd={handleAdd}
            categories={categories}
            accounts={accounts}
            currency={currency}
            intervalLabels={intervalLabels}
            daysOfWeek={daysOfWeek}
            monthsOfYear={monthsOfYear}
          />

          {/* List */}
          <RecurringExpensesList
            recurringExpenses={recurringExpenses}
            categories={categories}
            currency={currency}
            handleEdit={handleEdit}
            deleteRecurringExpense={deleteRecurringExpense}
            intervalLabels={intervalLabels}
            setIsAdding={setIsAdding}
          />
        </>
      )}

      {activeTab === 'gamaeya' && (
        <>
          {/* Gamaeya Form */}
          <GamaeyaForm
            isAddingGamaeya={isAddingGamaeya}
            setIsAddingGamaeya={setIsAddingGamaeya}
            gamaeyaName={gamaeyaName}
            setGamaeyaName={setGamaeyaName}
            gamaeyaAmount={gamaeyaAmount}
            setGamaeyaAmount={setGamaeyaAmount}
            gamaeyaMembers={gamaeyaMembers}
            setGamaeyaMembers={setGamaeyaMembers}
            gamaeyaPayoutMonth={gamaeyaPayoutMonth}
            setGamaeyaPayoutMonth={setGamaeyaPayoutMonth}
            gamaeyaStartDate={gamaeyaStartDate}
            setGamaeyaStartDate={setGamaeyaStartDate}
            gamaeyaAccountId={gamaeyaAccountId}
            setGamaeyaAccountId={setGamaeyaAccountId}
            handleAddGamaeya={handleAddGamaeya}
            accounts={accounts}
            currency={currency}
          />

          {/* Gamaeya Tracker & List */}
          <GamaeyaTracker
            gamaeyas={gamaeyas || []}
            currency={currency}
            deleteGamaeya={deleteGamaeya}
            payGamaeyaMonth={payGamaeyaMonth}
            receiveGamaeyaPayout={receiveGamaeyaPayout}
            setIsAddingGamaeya={setIsAddingGamaeya}
            itemVariants={itemVariants}
          />
        </>
      )}
    </motion.div>
  );
};

export default RecurringExpenses;
