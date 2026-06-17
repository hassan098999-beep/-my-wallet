import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useAppContext } from '../store/AppContext';
import { cn, formatCurrency, hapticFeedback } from '../utils';
import { Skeleton, TransactionSkeleton } from '../components/Skeleton';
import { format, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Plus, Trash, Pencil, RefreshCcw, Calendar, CreditCard, Wallet, ArrowRightLeft, AlertCircle, Clock, X, BarChart3, Receipt, Activity } from 'lucide-react';
import { DynamicIcon } from '../components/DynamicIcon';
import { PaymentMethod, RecurringInterval, RecurringExpense } from '../types';
import { CategorySelect } from '../components/CategorySelect';
import { motion, AnimatePresence } from 'motion/react';

// Import unified design system components
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import Badge from '../components/ui/Badge';

const RecurringExpenses = () => {
  const { recurringExpenses, categories, accounts, currency, addRecurringExpense, updateRecurringExpense, deleteRecurringExpense } = useAppContext();
  
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
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
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
      className="space-y-4 md:space-y-8 max-w-5xl mx-auto pb-12"
    >
      <PageHeader
        title="المصاريف المتكررة"
        subtitle="أتمتة مصاريفك الدورية لتوفير الوقت والجهد وتجنب التناسي المزعج"
        action={
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
        }
      />

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
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">العبء المالي الشهري</p>
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
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">الالتزامات النشطة</p>
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
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">أقرب دفعة قادمة</p>
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
                  <h2 className="text-base md:text-lg font-black text-slate-900 dark:text-white tracking-tight uppercase">
                    {editingId ? 'تعديل المصروف الدوري' : 'إضافة مصروف دوري جديد'}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">قم بجدولة مدفوعاتك القادمة بدقة</p>
                </div>
              </div>

              <form onSubmit={handleAdd} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">المبلغ ({currency})</label>
                    <div className="relative group">
                      <input
                        type="number"
                        step="0.001"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.000"
                        className="w-full p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50 text-base outline-none focus:ring-8 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-mono font-black"
                        required
                      />
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs">{currency}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">الفئة</label>
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
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">التصنيف الفرعي</label>
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
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">دورة التكرار</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {(['daily', 'weekly', 'monthly', 'yearly'] as RecurringInterval[]).map((int) => (
                        <button
                          key={int}
                          type="button"
                          onClick={() => setInterval(int)}
                          className={cn(
                            "py-4 rounded-2xl border-2 border-dashed text-[10px] font-black uppercase tracking-widest transition-all",
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
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">يوم التكرار</label>
                        <div className="flex flex-wrap gap-2">
                          {daysOfWeek.map((day) => (
                            <button
                              key={day.id}
                              type="button"
                              onClick={() => setSelectedDayOfWeek(day.id)}
                              className={cn(
                                "px-4 py-3 rounded-xl border-2 border-dashed text-[10px] font-black transition-all uppercase tracking-widest",
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
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">يوم الشهر</label>
                        <div className="grid grid-cols-7 sm:grid-cols-10 gap-2">
                          {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                            <button
                              key={day}
                              type="button"
                              onClick={() => setSelectedDayOfMonth(day)}
                              className={cn(
                                "w-10 h-10 rounded-xl border-2 border-dashed text-[10px] font-black transition-all flex items-center justify-center",
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
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">الشهر</label>
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
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">اليوم</label>
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
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">الحساب</label>
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
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">تاريخ البدء</label>
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
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">ملاحظة (اختياري)</label>
                    <input
                      type="text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="w-full p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50 text-base outline-none focus:ring-8 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-black"
                      placeholder="مثال: اشتراك نتفليكس..."
                    />
                  </div>

                  <div className="md:col-span-3 space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">طريقة الدفع</label>
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
                          <span className="font-black text-[10px] uppercase tracking-widest">{method.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-4 text-base transition-all shadow-md shadow-primary-500/20 uppercase tracking-[0.2em]"
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
            <h3 className="text-xs md:text-sm font-black text-slate-900 dark:text-white tracking-tight uppercase">قائمة المصاريف المتكررة</h3>
            <p className="text-[7px] md:text-[8px] font-bold text-slate-400 uppercase tracking-widest">إدارة وجدولة مدفوعاتك الدورية</p>
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
                              <span className="text-[9px] font-black text-primary-500 uppercase tracking-widest bg-primary-500/10 px-2 py-0.5 rounded-lg">
                                {intervalLabels[expense.interval]}
                              </span>
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
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
                            <span className="text-[9px] font-bold uppercase tracking-widest">
                              القادم: {format(parseISO(expense.nextDate), 'dd MMM yyyy', { locale: ar })}
                            </span>
                          </div>
                          {isSoon && (
                            <div className="flex items-center gap-1.5 text-rose-500 animate-pulse">
                              <AlertCircle size={12} />
                              <span className="text-[9px] font-black uppercase tracking-widest">يستحق قريباً</span>
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
    </motion.div>
  );
};

export default RecurringExpenses;
