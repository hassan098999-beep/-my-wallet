import React, { useState, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';
import { useAppContext } from '../store/AppContext';
import { cn, formatCurrency, hapticFeedback } from '../utils';
import { Skeleton, TransactionSkeleton, CardSkeleton } from '../components/Skeleton';
import { format, parseISO, isBefore, isSameDay } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Search, Filter, Trash, DownloadCloud, ArrowDownUp, ArrowUp, ArrowDown, Calendar, FileText, ChartPie, CreditCard, Banknote, Building2, Pencil, X, CircleAlert, Wallet, Copy, RefreshCcw } from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { DynamicIcon } from '../components/DynamicIcon';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { CategorySelect } from '../components/CategorySelect';
import { PaymentMethod } from '../types';

import { useWindowSize } from '../hooks/useWindowSize';
import { useDebounce } from '../hooks/useDebounce';
import { TransactionItem } from '../components/TransactionItem';

const Transactions = () => {
  const { width } = useWindowSize();
  const [displayLimit, setDisplayLimit] = useState(20);

  const handleRefresh = async () => {
    hapticFeedback('medium');
    // Simulate data refresh
    await new Promise(resolve => setTimeout(resolve, 500));
  };
  
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [transactionType, setTransactionType] = useState<'all' | 'expense' | 'income'>('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const { 
    expenses, 
    income, 
    categories, 
    accounts, 
    currency, 
    updateExpense, 
    deleteExpense, 
    updateIncome, 
    deleteIncome,
    addExpense,
    addIncome
  } = useAppContext()!;

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ id: string, type: 'expense' | 'income' } | null>(null);
  const transactionToDelete = useMemo(() => {
    if (!showDeleteConfirm) return null;
    return showDeleteConfirm.type === 'expense' 
      ? expenses.find(e => e.id === showDeleteConfirm.id)
      : income.find(i => i.id === showDeleteConfirm.id);
  }, [showDeleteConfirm, expenses, income]);

  const [editingTransaction, setEditingTransaction] = useState<any | null>(null);

  const [editAmount, setEditAmount] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editAccountId, setEditAccountId] = useState('');
  const [editSubcategoryId, setEditSubcategoryId] = useState('');
  const [editSource, setEditSource] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editPaymentMethod, setEditPaymentMethod] = useState<PaymentMethod>('cash');
  const [editNote, setEditNote] = useState('');

  const filteredTransactions = useMemo(() => {
    const all = [
      ...expenses.map(e => ({ ...e, type: 'expense' as const })),
      ...income.map(i => ({ ...i, type: 'income' as const }))
    ];

    const parsedStartDate = startDate ? parseISO(startDate) : null;
    const parsedEndDate = endDate ? parseISO(endDate) : null;
    const lowerSearchTerm = debouncedSearchTerm.toLowerCase();

    return all
      .filter(t => {
        const isExpense = t.type === 'expense';
        const matchesSearch = isExpense 
          ? ((t as any).note || '').toLowerCase().includes(lowerSearchTerm) ||
            (categories.find(c => c.id === (t as any).categoryId)?.name || '').toLowerCase().includes(lowerSearchTerm)
          : (t as any).source.toLowerCase().includes(lowerSearchTerm);
        
        const matchesType = transactionType === 'all' || t.type === transactionType;
        const matchesCategory = !categoryFilter || (isExpense && (t as any).categoryId === categoryFilter);
        const matchesTypeFilter = !typeFilter || (isExpense && categories.find(c => c.id === (t as any).categoryId)?.type === typeFilter);
        
        const tDate = t.parsedDate || parseISO(t.date);
        const matchesStartDate = !parsedStartDate || isBefore(parsedStartDate, tDate) || isSameDay(parsedStartDate, tDate);
        const matchesEndDate = !parsedEndDate || isBefore(tDate, parsedEndDate) || isSameDay(tDate, parsedEndDate);
        
        const matchesMinAmount = !minAmount || t.amount >= parseFloat(minAmount);
        const matchesMaxAmount = !maxAmount || t.amount <= parseFloat(maxAmount);

        return matchesSearch && matchesType && matchesCategory && matchesTypeFilter && matchesStartDate && matchesEndDate && matchesMinAmount && matchesMaxAmount;
      })
      .sort((a, b) => {
        const dateA = (a.parsedDate || parseISO(a.date)).getTime();
        const dateB = (b.parsedDate || parseISO(b.date)).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      });
  }, [expenses, income, debouncedSearchTerm, transactionType, categoryFilter, typeFilter, startDate, endDate, minAmount, maxAmount, sortOrder, categories]);

  const totalIncome = useMemo(() => 
    filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0),
  [filteredTransactions]);

  const totalExpenses = useMemo(() => 
    filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0),
  [filteredTransactions]);

  const categoryData = useMemo(() => {
    const data: { name: string, value: number, color: string }[] = [];
    const relevantTransactions = filteredTransactions.filter(t => t.type === (transactionType === 'income' ? 'income' : 'expense'));
    
    if (transactionType === 'income') {
      const sources: { [key: string]: number } = {};
      relevantTransactions.forEach(t => {
        const source = (t as any).source || 'أخرى';
        sources[source] = (sources[source] || 0) + t.amount;
      });
      Object.entries(sources).forEach(([name, value]) => {
        data.push({ name, value, color: '#10b981' });
      });
    } else {
      const cats: { [key: string]: { value: number, color: string, name: string } } = {};
      relevantTransactions.forEach(t => {
        const cat = categories.find(c => c.id === (t as any).categoryId);
        if (cat) {
          if (!cats[cat.id]) {
            cats[cat.id] = { value: 0, color: cat.color, name: cat.name };
          }
          cats[cat.id].value += t.amount;
        }
      });
      Object.values(cats).forEach(c => data.push(c));
    }
    
    return data.sort((a, b) => b.value - a.value);
  }, [filteredTransactions, transactionType, categories]);

  const visibleTransactions = useMemo(() => 
    filteredTransactions.slice(0, displayLimit),
  [filteredTransactions, displayLimit]);

  const hasMore = filteredTransactions.length > displayLimit;

  const loadMore = () => {
    setDisplayLimit(prev => prev + 20);
  };

  const getPaymentLabel = (method: PaymentMethod) => {
    switch (method) {
      case 'cash': return 'كاش';
      case 'card': return 'بطاقة';
      case 'transfer': return 'تحويل';
      default: return method;
    }
  };

  const getPaymentIcon = (method: PaymentMethod) => {
    switch (method) {
      case 'cash': return <Banknote size={14} />;
      case 'card': return <CreditCard size={14} />;
      case 'transfer': return <ArrowDownUp size={14} />;
      default: return <CreditCard size={14} />;
    }
  };

  const exportToCSV = () => {
    if (filteredTransactions.length === 0) {
      toast.error('لا توجد بيانات لتصديرها');
      return;
    }

    const headers = ['التاريخ', 'النوع', 'الفئة', 'المصدر/الملاحظة', 'المبلغ', 'الحساب', 'طريقة الدفع'];
    const rows = filteredTransactions.map(t => {
      const isExpense = t.type === 'expense';
      const category = isExpense ? categories.find(c => c.id === (t as any).categoryId)?.name : 'دخل';
      const detail = isExpense ? (t as any).note || category : (t as any).source;
      const account = accounts.find(a => a.id === t.accountId)?.name || 'بدون حساب';
      const payment = isExpense ? getPaymentLabel((t as any).paymentMethod) : '-';
      
      return [
        format(parseISO(t.date), 'yyyy-MM-dd'),
        isExpense ? 'مصروف' : 'دخل',
        category,
        detail,
        t.amount,
        account,
        payment
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('تم تصدير البيانات بنجاح');
  };

  const handleDelete = async (id: string, type: 'expense' | 'income') => {
    try {
      if (type === 'expense') {
        await deleteExpense(id);
      } else {
        await deleteIncome(id);
      }
      toast.success('تم حذف العملية بنجاح');
      setShowDeleteConfirm(null);
      hapticFeedback('success');
    } catch (error) {
      toast.error('فشل حذف العملية');
    }
  };

  const handleEditClick = (transaction: any) => {
    setEditingTransaction(transaction);
    setEditAmount(transaction.amount.toString());
    setEditDate(transaction.date);
    setEditAccountId(transaction.accountId || '');
    
    if (transaction.type === 'expense') {
      setEditCategoryId(transaction.categoryId);
      setEditSubcategoryId(transaction.subcategoryId || '');
      setEditPaymentMethod(transaction.paymentMethod);
      setEditNote(transaction.note || '');
    } else {
      setEditSource(transaction.source);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;

    try {
      const updates = {
        amount: parseFloat(editAmount),
        date: editDate,
        accountId: editAccountId || undefined,
      };

      if (editingTransaction.type === 'expense') {
        await updateExpense(editingTransaction.id, {
          ...updates,
          categoryId: editCategoryId,
          subcategoryId: editSubcategoryId || undefined,
          paymentMethod: editPaymentMethod,
          note: editNote,
        });
      } else {
        await updateIncome(editingTransaction.id, {
          ...updates,
          source: editSource,
        });
      }

      toast.success('تم تحديث العملية بنجاح');
      setEditingTransaction(null);
      hapticFeedback('success');
    } catch (error) {
      toast.error('فشل تحديث العملية');
    }
  };

  const handleDuplicate = async (transaction: any) => {
    try {
      const { id, createdAt, ...rest } = transaction;
      if (transaction.type === 'expense') {
        await addExpense({ ...rest, date: new Date().toISOString().split('T')[0] });
      } else {
        await addIncome({ ...rest, date: new Date().toISOString().split('T')[0] });
      }
      toast.success('تم تكرار العملية بنجاح');
      hapticFeedback('success');
    } catch (error) {
      toast.error('فشل تكرار العملية');
    }
  };

  return (
    <div className="space-y-4 md:space-y-8 pb-12 relative">
      <motion.div
        className="space-y-4 md:space-y-8"
      >
        {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 md:gap-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-2"
        >
          <h1 className="text-3xl md:text-6xl font-black tracking-tight text-slate-900 dark:text-white">
            سجل <span className="text-emerald-600">العمليات</span>
          </h1>
          <p className="text-sm md:text-lg text-slate-500 dark:text-slate-400 font-medium">
            تتبع وإدارة جميع مصاريفك في مكان واحد
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3 w-full md:w-auto"
        >
          <button
            onClick={exportToCSV}
            className="btn-secondary flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-2xl md:rounded-3xl"
          >
            <DownloadCloud size={18} className="group-hover:translate-y-0.5 transition-transform" />
            <span className="font-bold text-sm">تصدير البيانات</span>
          </button>
        </motion.div>
      </div>

      {/* Summary Stats & Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
        {/* Total Summary Cards */}
        <div className="lg:col-span-1 flex flex-col gap-4 md:gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="premium-card bg-emerald-600 rounded-3xl p-6 md:p-8 text-white shadow-md shadow-emerald-500/20 relative overflow-hidden group flex-1 flex flex-col justify-between"
          >
            <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
                  <ArrowUp className="size-6 text-white" />
                </div>
                <span className="text-xs font-black uppercase tracking-[0.2em] opacity-70">إجمالي الدخل</span>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-black tracking-tighter leading-none">
                  {formatCurrency(totalIncome, currency)}
                </div>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between opacity-60">
              <span className="text-[10px] font-black uppercase tracking-widest">معدل النمو</span>
              <span className="text-xs font-black">+12.5%</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="premium-card bg-rose-600 rounded-3xl p-6 md:p-8 text-white shadow-md shadow-rose-500/20 relative overflow-hidden group flex-1 flex flex-col justify-between"
          >
            <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
                  <ArrowDown className="size-6 text-white" />
                </div>
                <span className="text-xs font-black uppercase tracking-[0.2em] opacity-70">إجمالي المصاريف</span>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-black tracking-tighter leading-none">
                  {formatCurrency(totalExpenses, currency)}
                </div>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between opacity-60">
              <span className="text-[10px] font-black uppercase tracking-widest">معدل الإنفاق</span>
              <span className="text-xs font-black">مرتفع</span>
            </div>
          </motion.div>
        </div>

        {/* Filters Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-3 premium-card p-6 md:p-8 rounded-3xl flex flex-col bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-100 dark:border-slate-800"
        >
          <div className="flex flex-col gap-8 flex-1">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="relative group flex-1">
                <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors size-6" />
                <input
                  type="text"
                  placeholder="بحث في العمليات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field w-full pr-14 pl-6 py-4 rounded-2xl text-base md:text-lg font-black uppercase tracking-tight bg-slate-50 dark:bg-slate-800/50 border-transparent focus:bg-white dark:focus:bg-slate-800"
                />
              </div>
              
              <div className="flex gap-4">
                <select
                  value={transactionType}
                  onChange={(e) => setTransactionType(e.target.value as any)}
                  className="input-field px-6 py-4 rounded-2xl text-sm font-black uppercase tracking-widest appearance-none min-w-[140px] bg-slate-50 dark:bg-slate-800/50 border-transparent"
                >
                  <option value="all">الكل</option>
                  <option value="expense">المصاريف</option>
                  <option value="income">الدخل</option>
                </select>

                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn(
                    "flex items-center gap-4 px-6 py-4 rounded-2xl border-2 transition-all shadow-sm active:scale-95 text-sm font-black uppercase tracking-widest",
                    showFilters 
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" 
                      : "border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                  )}
                >
                  <Filter className="size-6" />
                  <span className="hidden sm:inline">فلاتر متقدمة</span>
                </button>

                <button
                  onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                  className="flex items-center justify-between gap-4 px-6 py-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-95 text-sm font-black uppercase tracking-widest"
                >
                  <div className="flex items-center gap-3">
                    <ArrowDownUp className="size-6 text-emerald-500" />
                    <span className="hidden sm:inline">{sortOrder === 'desc' ? 'الأحدث' : 'الأقدم'}</span>
                  </div>
                </button>
              </div>
            </div>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 pt-6 md:pt-8 border-t border-slate-100 dark:border-slate-800">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">الفئة</label>
                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="input-field w-full px-4 py-3 rounded-xl text-xs font-black uppercase tracking-tight appearance-none"
                      >
                        <option value="">كل الفئات</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">النوع (50/30/20)</label>
                      <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="input-field w-full px-4 py-3 rounded-xl text-xs font-black uppercase tracking-tight appearance-none"
                      >
                        <option value="">الكل</option>
                        <option value="need">احتياجات (50%)</option>
                        <option value="want">رغبات (30%)</option>
                        <option value="saving">ادخار (20%)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">من تاريخ</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="input-field w-full px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest font-mono"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">إلى تاريخ</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="input-field w-full px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest font-mono"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">الحد الأدنى للمبلغ</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={minAmount}
                        onChange={(e) => setMinAmount(e.target.value)}
                        className="input-field w-full px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest font-mono"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">الحد الأقصى للمبلغ</label>
                      <input
                        type="number"
                        placeholder="10000"
                        value={maxAmount}
                        onChange={(e) => setMaxAmount(e.target.value)}
                        className="input-field w-full px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest font-mono"
                      />
                    </div>

                    <div className="lg:col-span-3 flex items-end pt-2">
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setTransactionType('all');
                          setCategoryFilter('');
                          setTypeFilter('');
                          setStartDate('');
                          setEndDate('');
                          setMinAmount('');
                          setMaxAmount('');
                        }}
                        className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl border-2 border-dashed border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-900/20 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all shadow-sm active:scale-95 text-xs font-black uppercase tracking-widest"
                      >
                        <X className="size-4" />
                        <span>إعادة تعيين الفلاتر</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Spending Summary Chart */}
      {categoryData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="premium-card p-6 md:p-8 rounded-3xl"
        >
          <div className="flex items-center justify-between mb-8 md:mb-12">
            <h3 className="text-lg md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
              {transactionType === 'income' ? 'توزيع مصادر الدخل' : 'توزيع المصاريف'}
            </h3>
            <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
              <ChartPie className="size-4" />
              <span>نظرة تحليلية</span>
            </div>
          </div>
          <div className="h-56 md:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={width < 640 ? 60 : 90}
                  outerRadius={width < 640 ? 85 : 120}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                  animationBegin={0}
                  animationDuration={1500}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} className="hover:opacity-80 transition-opacity cursor-pointer" />
                  ))}
                </Pie>
                <RechartsTooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-5 rounded-3xl shadow-md border border-slate-100 dark:border-slate-800">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{payload[0].name}</p>
                          <p className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(payload[0].value as number, currency)}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Transactions List */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="premium-card rounded-3xl overflow-hidden"
      >
        <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl z-20">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <FileText className="size-5 md:size-6" />
            </div>
            <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-sm md:text-2xl">قائمة العمليات</h3>
          </div>
          <button 
            onClick={handleRefresh}
            className="p-2 md:p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <RefreshCcw size={20} className="text-slate-400 md:size-6" />
          </button>
        </div>

        {filteredTransactions.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
            <AnimatePresence>
              {visibleTransactions.map((transaction, index) => (
                <TransactionItem
                  key={transaction.id}
                  transaction={transaction}
                  categories={categories}
                  accounts={accounts}
                  currency={currency}
                  index={index}
                  onEdit={handleEditClick}
                  onDelete={(id, type) => setShowDeleteConfirm({ id, type })}
                  onDuplicate={handleDuplicate}
                  getPaymentIcon={getPaymentIcon}
                  getPaymentLabel={getPaymentLabel}
                />
              ))}
            </AnimatePresence>
            
            {hasMore && (
              <div className="p-8 text-center">
                <button
                  onClick={loadMore}
                  className="btn-secondary px-10 py-4 rounded-2xl text-sm font-black uppercase tracking-widest"
                >
                  تحميل المزيد
                </button>
              </div>
            )}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-20 md:p-32 text-center"
          >
            <div className="inline-flex items-center justify-center w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-slate-50 dark:bg-slate-900/50 mb-8 text-slate-200 dark:text-slate-800">
              <Search size={80} />
            </div>
            <h4 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white mb-4">لا توجد نتائج</h4>
            <p className="text-slate-500 dark:text-slate-400 font-medium max-w-sm mx-auto text-base md:text-xl">
              لم نجد أي عمليات تطابق معايير البحث الحالية. جرب تغيير الفلاتر.
            </p>
            <button 
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('');
                setStartDate('');
                setEndDate('');
              }}
              className="mt-10 text-emerald-600 dark:text-emerald-500 font-black text-base md:text-xl uppercase tracking-widest hover:underline"
            >
              إعادة تعيين الفلاتر
            </button>
          </motion.div>
        )}
      </motion.div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingTransaction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingTransaction(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-md border border-white/20 dark:border-slate-800 p-4 md:p-5 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500">
                    <Pencil className="size-4 md:size-5" />
                  </div>
                  <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                    {editingTransaction.type === 'expense' ? 'تعديل المصروف' : 'تعديل الدخل'}
                  </h2>
                </div>
                <button 
                  onClick={() => setEditingTransaction(null)}
                  className="p-1.5 md:p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  <X className="size-5 md:size-6" />
                </button>
              </div>

              <form onSubmit={handleUpdate} className="space-y-3 md:space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">المبلغ ({currency})</label>
                  <input
                    type="number"
                    step="0.001"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="w-full px-3 py-2 md:px-4 md:py-2.5 rounded-xl md:rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all font-mono font-black text-sm md:text-base"
                    required
                  />
                </div>

                {editingTransaction.type === 'expense' ? (
                  <>
                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">الفئة</label>
                        <CategorySelect
                          categories={categories}
                          selectedId={editCategoryId}
                          onChange={(id) => {
                            setEditCategoryId(id);
                            setEditSubcategoryId('');
                          }}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">الحساب</label>
                        <select
                          value={editAccountId}
                          onChange={(e) => setEditAccountId(e.target.value)}
                          className="w-full px-3 py-2 md:px-4 md:py-2.5 rounded-xl md:rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none font-black text-xs md:text-sm appearance-none"
                          required
                        >
                          <option value="">اختر الحساب</option>
                          {accounts.map((acc) => (
                            <option key={acc.id} value={acc.id}>{acc.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {categories.find(c => c.id === editCategoryId)?.subcategories && categories.find(c => c.id === editCategoryId)!.subcategories!.length > 0 && (
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">التصنيف الفرعي</label>
                        <select
                          value={editSubcategoryId}
                          onChange={(e) => setEditSubcategoryId(e.target.value)}
                          className="w-full px-3 py-2 md:px-4 md:py-2.5 rounded-xl md:rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none font-black text-xs md:text-sm appearance-none"
                        >
                          <option value="">اختر تصنيفاً فرعياً (اختياري)</option>
                          {categories.find(c => c.id === editCategoryId)?.subcategories?.map((sub, idx) => (
                            <option key={idx} value={sub}>{sub}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">المصدر</label>
                      <input
                        type="text"
                        value={editSource}
                        onChange={(e) => setEditSource(e.target.value)}
                        className="w-full px-3 py-2 md:px-4 md:py-2.5 rounded-xl md:rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none font-bold text-xs md:text-sm"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">الحساب (اختياري)</label>
                      <select
                        value={editAccountId}
                        onChange={(e) => setEditAccountId(e.target.value)}
                        className="w-full px-3 py-2 md:px-4 md:py-2.5 rounded-xl md:rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none font-black text-xs md:text-sm appearance-none"
                      >
                        <option value="">بدون حساب</option>
                        {accounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>{acc.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3 md:gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">التاريخ</label>
                    <input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="w-full px-3 py-2 md:px-4 md:py-2.5 rounded-xl md:rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none font-mono font-black text-xs md:text-sm"
                      required
                    />
                  </div>
                </div>

                {editingTransaction.type === 'expense' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">طريقة الدفع</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['cash', 'card', 'transfer'] as PaymentMethod[]).map((method) => (
                          <button
                            key={method}
                            type="button"
                            onClick={() => setEditPaymentMethod(method)}
                            className={cn(
                              "flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl border-2 transition-all",
                              editPaymentMethod === method
                                ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400"
                                : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-400"
                            )}
                          >
                            {getPaymentIcon(method)}
                            <span className="text-[10px] font-black uppercase">{getPaymentLabel(method)}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">ملاحظة</label>
                      <input
                        type="text"
                        value={editNote}
                        onChange={(e) => setEditNote(e.target.value)}
                        className="w-full px-3 py-2.5 md:px-4 md:py-3 rounded-xl md:rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none font-bold text-xs md:text-sm"
                      />
                    </div>
                  </>
                )}

                <div className="flex gap-2.5 pt-1.5">
                  <button
                    type="button"
                    onClick={() => setEditingTransaction(null)}
                    className="flex-1 px-3 py-2.5 md:px-4 md:py-3 rounded-xl md:rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] px-3 py-2.5 md:px-4 md:py-3 rounded-xl md:rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest bg-primary-600 text-white hover:bg-primary-700 shadow-md shadow-primary-500/20 transition-all"
                  >
                    حفظ التغييرات
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && transactionToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-white/20 dark:border-slate-800 p-5 md:p-6 overflow-hidden text-center"
            >
              <div className="w-16 h-16 md:w-20 md:h-20 bg-rose-500/10 rounded-2xl md:rounded-3xl flex items-center justify-center text-rose-500 mx-auto mb-5 md:mb-6">
                <CircleAlert size={40} />
              </div>
              
              <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">تأكيد الحذف</h2>
              <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 font-medium mb-6 md:mb-8">
                {(transactionToDelete as any).isTransfer 
                  ? 'هل أنت متأكد من رغبتك في حذف هذا التحويل؟ سيتم حذف كل من عملية الخصم والإيداع المرتبطة به. لا يمكن التراجع عن هذا الإجراء.'
                  : 'هل أنت متأكد من رغبتك في حذف هذه العملية؟ لا يمكن التراجع عن هذا الإجراء.'}
              </p>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 md:p-4 rounded-xl md:rounded-2xl mb-6 md:mb-8 flex items-center justify-between border border-slate-100 dark:border-slate-700">
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">العملية</p>
                  <p className="text-sm md:text-base font-bold text-slate-900 dark:text-white">
                    {(transactionToDelete as any).isTransfer ? (showDeleteConfirm.type === 'expense' ? (transactionToDelete as any).note : (transactionToDelete as any).source) : (showDeleteConfirm.type === 'expense' ? ((transactionToDelete as any).note || categories.find(c => c.id === (transactionToDelete as any).categoryId)?.name) : (transactionToDelete as any).source)}
                  </p>
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المبلغ</p>
                  <p className={cn("text-sm md:text-base font-black", (transactionToDelete as any).isTransfer ? "text-indigo-500" : (showDeleteConfirm.type === 'expense' ? "text-rose-500" : "text-emerald-500"))}>
                    {formatCurrency(transactionToDelete.amount, currency)}
                  </p>
                </div>
              </div>

              <div className="flex gap-2.5 md:gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-3 md:px-6 md:py-4 rounded-xl md:rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  إلغاء
                </button>
                <button
                  onClick={() => handleDelete(showDeleteConfirm.id, showDeleteConfirm.type)}
                  className="flex-1 px-4 py-3 md:px-6 md:py-4 rounded-xl md:rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest bg-rose-500 text-white hover:bg-rose-600 shadow-md shadow-rose-500/20 transition-all"
                >
                  حذف نهائي
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Transactions;
