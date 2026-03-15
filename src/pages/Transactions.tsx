import React, { useState, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';
import { useAppContext } from '../store/AppContext';
import { cn, formatCurrency, hapticFeedback } from '../utils';
import { Skeleton, TransactionSkeleton } from '../components/Skeleton';
import { format, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Search, Filter, Trash2, Download, ArrowUpDown, ArrowUp, ArrowDown, Calendar, FileText, PieChart, CreditCard, Banknote, Landmark, Edit2, X, AlertCircle, Wallet, Copy, RefreshCw } from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { DynamicIcon } from '../components/DynamicIcon';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { CategorySelect } from '../components/CategorySelect';
import { PaymentMethod } from '../types';

const Transactions = () => {
  const { expenses, categories, accounts, deleteExpense, updateExpense, addExpense, currency } = useAppContext();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleRefresh = async () => {
    hapticFeedback('medium');
    setIsRefreshing(true);
    // Simulate data refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [editingExpense, setEditingExpense] = useState<any | null>(null);

  const expenseToDelete = useMemo(() => {
    return expenses.find(e => e.id === showDeleteConfirm);
  }, [expenses, showDeleteConfirm]);

  // Form state for editing
  const [editAmount, setEditAmount] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editSubcategoryId, setEditSubcategoryId] = useState('');
  const [editAccountId, setEditAccountId] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editPaymentMethod, setEditPaymentMethod] = useState<PaymentMethod>('cash');

  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const category = categories.find(c => c.id === expense.categoryId);
      const matchesSearch = (expense.note || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (category?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (expense.subcategoryId || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter ? expense.categoryId === categoryFilter : true;
      const matchesType = typeFilter ? category?.type === typeFilter : true;
      
      const expDate = parseISO(expense.date);
      const matchesStartDate = startDate ? expDate >= parseISO(startDate) : true;
      const matchesEndDate = endDate ? expDate <= parseISO(endDate) : true;
      
      const matchesMinAmount = minAmount ? expense.amount >= Number(minAmount) : true;
      const matchesMaxAmount = maxAmount ? expense.amount <= Number(maxAmount) : true;
      
      return matchesSearch && matchesCategory && matchesType && matchesStartDate && matchesEndDate && matchesMinAmount && matchesMaxAmount;
    }).sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }, [expenses, searchTerm, categoryFilter, typeFilter, startDate, endDate, minAmount, maxAmount, categories, sortOrder]);

  const totalFiltered = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  const categoryData = useMemo(() => {
    const categorySums = filteredExpenses.reduce((acc, e) => {
      acc[e.categoryId] = (acc[e.categoryId] || 0) + e.amount;
      return acc;
    }, {} as Record<string, number>);

    return categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      value: categorySums[cat.id] || 0,
      color: cat.color
    })).filter(d => d.value > 0).sort((a, b) => b.value - a.value);
  }, [filteredExpenses, categories]);

  const handleDelete = (id: string) => {
    hapticFeedback('warning');
    deleteExpense(id);
    setShowDeleteConfirm(null);
    toast.success('تم حذف العملية بنجاح');
  };

  const handleEditClick = (expense: any) => {
    setEditingExpense(expense);
    setEditAmount(expense.amount.toString());
    setEditCategoryId(expense.categoryId);
    setEditSubcategoryId(expense.subcategoryId || '');
    setEditAccountId(expense.accountId || accounts[0]?.id || '');
    setEditDate(expense.date);
    setEditNote(expense.note || '');
    setEditPaymentMethod(expense.paymentMethod || 'cash');
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;

    updateExpense(editingExpense.id, {
      amount: Number(editAmount),
      categoryId: editCategoryId,
      subcategoryId: editSubcategoryId || undefined,
      accountId: editAccountId,
      date: editDate,
      note: editNote,
      paymentMethod: editPaymentMethod,
    });

    setEditingExpense(null);
  };

  const handleDuplicate = (expense: any) => {
    addExpense({
      amount: expense.amount,
      categoryId: expense.categoryId,
      subcategoryId: expense.subcategoryId,
      accountId: expense.accountId,
      goalId: expense.goalId,
      date: new Date().toISOString().split('T')[0], // Use today's date for the duplicate
      note: expense.note ? `${expense.note} (نسخة)` : 'نسخة',
      paymentMethod: expense.paymentMethod,
    });
  };

  const exportToCSV = () => {
    const headers = ['التاريخ', 'الفئة', 'المبلغ', 'الحساب', 'ملاحظة'];
    const rows = filteredExpenses.map(e => {
      const account = accounts.find(a => a.id === e.accountId);
      return [
        e.date,
        categories.find(c => c.id === e.categoryId)?.name || '',
        e.amount,
        account ? account.name : (e.paymentMethod === 'cash' ? 'نقدي' : e.paymentMethod === 'card' ? 'بطاقة' : 'تحويل'),
        e.note
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `مصاريفي_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'cash': return <Banknote size={14} />;
      case 'card': return <CreditCard size={14} />;
      case 'transfer': return <Landmark size={14} />;
      default: return null;
    }
  };

  const getPaymentLabel = (method: string) => {
    switch (method) {
      case 'cash': return 'نقدي';
      case 'card': return 'بطاقة';
      case 'transfer': return 'تحويل';
      default: return method;
    }
  };

  const [refreshing, setRefreshing] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePullToRefresh = async (event: any, info: any) => {
    if (info.offset.y > 80 && !refreshing) {
      setRefreshing(true);
      await handleRefresh();
      setRefreshing(false);
    }
    setPullProgress(0);
  };

  const handleDrag = (event: any, info: any) => {
    if (info.offset.y > 0 && !refreshing) {
      setPullProgress(Math.min(info.offset.y / 100, 1));
    }
  };

  return (
    <div className="space-y-4 md:space-y-8 pb-12 relative" ref={containerRef}>
      {/* Pull to Refresh Indicator */}
      <motion.div 
        style={{ 
          height: refreshing ? 60 : pullProgress * 60,
          opacity: refreshing ? 1 : pullProgress,
          scale: refreshing ? 1 : 0.8 + pullProgress * 0.2
        }}
        className="absolute top-[-20px] left-0 right-0 flex items-center justify-center pointer-events-none z-50 overflow-hidden"
      >
        <div className="bg-white dark:bg-slate-800 p-2 rounded-full shadow-lg border border-slate-100 dark:border-slate-700">
          <RefreshCw className={cn("text-emerald-500 size-5", refreshing && "animate-spin")} />
        </div>
      </motion.div>

      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDrag={handleDrag}
        onDragEnd={handlePullToRefresh}
        className="space-y-4 md:space-y-8"
      >
        {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-1.5"
        >
          <h1 className="text-2xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            سجل <span className="text-emerald-600">العمليات</span>
          </h1>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 font-medium">
            تتبع وإدارة جميع مصاريفك في مكان واحد
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3"
        >
          <button
            onClick={exportToCSV}
            className="group flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-5 py-2.5 rounded-xl md:rounded-3xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm hover:shadow-md active:scale-95"
          >
            <Download size={16} className="group-hover:translate-y-0.5 transition-transform" />
            <span className="font-bold text-xs md:text-sm">تصدير البيانات</span>
          </button>
        </motion.div>
      </div>

      {/* Summary Stats & Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Total Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-1 bg-emerald-600 rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-6 text-white shadow-xl shadow-emerald-200/50 relative overflow-hidden group"
        >
          <div className="absolute -right-4 -top-4 w-16 h-16 md:w-24 md:h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="relative z-10 space-y-3 md:space-y-6">
            <div className="flex items-center gap-2 md:gap-3 opacity-80">
              <PieChart className="size-5 md:size-6" />
              <span className="text-xs md:text-sm font-black uppercase tracking-wider">إجمالي المفلتر</span>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-black tracking-tighter">
                {formatCurrency(totalFiltered, currency)}
              </div>
              <p className="text-emerald-100 text-[10px] md:text-xs font-bold mt-1.5 md:mt-2">
                بناءً على {filteredExpenses.length} عملية
              </p>
            </div>
          </div>
        </motion.div>

        {/* Filters Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-3 glass-card p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem]"
        >
          <div className="flex flex-col gap-4 md:gap-6">
            <div className="flex flex-col md:flex-row gap-3 md:gap-4">
              <div className="relative group flex-1">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors size-4 md:size-5" />
                <input
                  type="text"
                  placeholder="بحث في العمليات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pr-10 pl-4 py-2.5 md:py-3.5 rounded-xl md:rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none text-sm font-black uppercase tracking-tight"
                />
              </div>
              
              <div className="flex gap-2 md:gap-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn(
                    "flex items-center gap-2 px-3 md:px-4 py-2.5 md:py-3.5 rounded-xl md:rounded-2xl border-2 transition-all shadow-sm active:scale-95 text-xs md:text-sm font-black uppercase tracking-widest",
                    showFilters 
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" 
                      : "border-dashed border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800"
                  )}
                >
                  <Filter className="size-4 md:size-5" />
                  <span>فلاتر</span>
                </button>

                <button
                  onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                  className="flex items-center justify-between gap-2 px-3 md:px-4 py-2.5 md:py-3.5 rounded-xl md:rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm active:scale-95 text-xs md:text-sm font-black uppercase tracking-widest"
                >
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="size-4 md:size-5 text-emerald-500" />
                    <span className="hidden sm:inline">{sortOrder === 'desc' ? 'الأحدث' : 'الأقدم'}</span>
                  </div>
                  {sortOrder === 'desc' ? <ArrowDown className="size-3 md:size-4" /> : <ArrowUp className="size-3 md:size-4" />}
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 pt-4 md:pt-5 border-t border-slate-100 dark:border-slate-800">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">الفئة</label>
                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none appearance-none text-xs font-black uppercase tracking-tight"
                      >
                        <option value="">كل الفئات</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">النوع (50/30/20)</label>
                      <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none appearance-none text-xs font-black uppercase tracking-tight"
                      >
                        <option value="">الكل</option>
                        <option value="need">احتياجات (50%)</option>
                        <option value="want">رغبات (30%)</option>
                        <option value="saving">ادخار (20%)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">من تاريخ</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none text-xs font-black uppercase tracking-widest font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">إلى تاريخ</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none text-xs font-black uppercase tracking-widest font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">الحد الأدنى للمبلغ</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={minAmount}
                        onChange={(e) => setMinAmount(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none text-xs font-black uppercase tracking-widest font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">الحد الأقصى للمبلغ</label>
                      <input
                        type="number"
                        placeholder="10000"
                        value={maxAmount}
                        onChange={(e) => setMaxAmount(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none text-xs font-black uppercase tracking-widest font-mono"
                      />
                    </div>

                    <div className="sm:col-span-2 flex items-end">
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setCategoryFilter('');
                          setTypeFilter('');
                          setStartDate('');
                          setEndDate('');
                          setMinAmount('');
                          setMaxAmount('');
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-900/20 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all shadow-sm active:scale-95 text-[10px] font-black uppercase tracking-widest"
                      >
                        <X className="size-3" />
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
          className="glass-card p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem]"
        >
          <h3 className="text-sm md:text-xl font-black text-slate-900 dark:text-white mb-4 md:mb-8 uppercase tracking-tight">توزيع المصاريف</h3>
          <div className="h-40 md:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700">
                          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{payload[0].name}</p>
                          <p className="text-sm md:text-lg font-black text-slate-900 dark:text-white">{formatCurrency(payload[0].value as number, currency)}</p>
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
        className="glass-card rounded-[1.5rem] md:rounded-[2rem] overflow-hidden"
      >
        <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur z-20">
          <div className="flex items-center gap-3">
            <FileText className="size-4 md:size-6 text-emerald-500" />
            <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-xs md:text-xl">قائمة العمليات</h3>
          </div>
          <button 
            onClick={handleRefresh}
            className={cn("p-1.5 md:p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all", isRefreshing && "animate-spin")}
          >
            <RefreshCw size={16} className="text-slate-400 md:size-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {[1, 2, 3, 4, 5].map((i) => (
              <TransactionSkeleton key={i} />
            ))}
          </div>
        ) : filteredExpenses.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
            <AnimatePresence mode="popLayout">
              {filteredExpenses.map((expense, index) => {
                const category = categories.find(c => c.id === expense.categoryId);
                const isDeleting = showDeleteConfirm === expense.id;
                const typeColor = category?.type === 'need' ? 'text-indigo-500' : category?.type === 'want' ? 'text-amber-500' : 'text-emerald-500';

                return (
                  <div key={expense.id} className="relative overflow-hidden">
                    {/* Swipe Background (Delete Button) */}
                    <div className="absolute inset-0 bg-rose-500 flex items-center justify-end px-6">
                      <div className="flex flex-col items-center gap-1 text-white">
                        <Trash2 size={24} />
                        <span className="text-[10px] font-black uppercase">حذف</span>
                      </div>
                    </div>

                    <motion.div 
                      layout
                      drag="x"
                      dragConstraints={{ left: -100, right: 0 }}
                      dragElastic={0.1}
                      onDragEnd={(e, info) => {
                        if (info.offset.x < -70) {
                          setShowDeleteConfirm(expense.id);
                        }
                      }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.03 }}
                      className={cn(
                        "relative z-10 p-4 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 md:gap-6 transition-all group bg-white dark:bg-slate-900",
                        isDeleting ? "bg-red-50/50 dark:bg-red-900/10" : "hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                      )}
                    >
                    <div className="flex items-center gap-4 md:gap-6">
                      <div 
                        className={cn("w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-[1.5rem] flex items-center justify-center text-white shrink-0 shadow-lg transition-transform group-hover:scale-110 duration-300", typeColor.replace('text-', 'bg-'))}
                        style={{ 
                          backgroundColor: category?.color || '#ccc',
                          boxShadow: `0 8px 24px -4px ${category?.color}40`
                        }}
                      >
                        {category?.icon ? (
                          <DynamicIcon name={category.icon} className="size-5 md:size-8" />
                        ) : (
                          <span className="text-base md:text-2xl font-black">{category?.name.charAt(0)}</span>
                        )}
                      </div>
                      <div className="space-y-1.5 md:space-y-2">
                        <h4 className="font-black text-slate-900 dark:text-white text-sm md:text-lg leading-tight">
                          {expense.note || (expense.subcategoryId ? `${category?.name} - ${expense.subcategoryId}` : category?.name)}
                        </h4>
                        <div className="flex flex-wrap items-center gap-x-2 md:gap-x-4 gap-y-1.5 text-xs md:text-sm font-bold text-slate-400 dark:text-slate-500">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="size-3.5 md:size-4" />
                            {format(parseISO(expense.date), 'dd MMM yyyy', { locale: ar })}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                          <span className={cn("font-black uppercase tracking-tighter", typeColor)}>
                            {category?.type === 'need' ? 'احتياجات' : category?.type === 'want' ? 'رغبات' : 'ادخار'}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                          <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 md:px-3 py-1 rounded-lg">
                            {getPaymentIcon(expense.paymentMethod)}
                            {expense.accountId ? (
                              accounts.find(a => a.id === expense.accountId)?.name || 'حساب محذوف'
                            ) : (
                              getPaymentLabel(expense.paymentMethod)
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end gap-4 md:gap-6 sm:w-auto w-full border-t sm:border-t-0 pt-4 md:pt-6 sm:pt-0 border-slate-100 dark:border-slate-800">
                      <div className="text-right">
                        <div className="text-base md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                          {formatCurrency(expense.amount, currency)}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 md:gap-3">
                        <button 
                          onClick={() => handleDuplicate(expense)}
                          className="p-1.5 md:p-2.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg md:rounded-xl transition-all opacity-100 sm:opacity-0 group-hover:opacity-100"
                          title="تكرار"
                        >
                          <Copy className="size-4 md:size-5" />
                        </button>

                        <button 
                          onClick={() => handleEditClick(expense)}
                          className="p-1.5 md:p-2.5 text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg md:rounded-xl transition-all opacity-100 sm:opacity-0 group-hover:opacity-100"
                          title="تعديل"
                        >
                          <Edit2 className="size-4 md:size-5" />
                        </button>
                        
                        <button 
                          onClick={() => setShowDeleteConfirm(expense.id)}
                          className="p-1.5 md:p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg md:rounded-xl transition-all opacity-100 sm:opacity-0 group-hover:opacity-100"
                          title="حذف"
                        >
                          <Trash2 className="size-4 md:size-5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              );
            })}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-16 md:p-24 text-center"
          >
            <div className="inline-flex items-center justify-center w-28 h-28 md:w-40 md:h-40 rounded-[2.5rem] md:rounded-[3.5rem] bg-slate-50 dark:bg-slate-800/50 mb-8 text-slate-300 dark:text-slate-700">
              <Search size={64} />
            </div>
            <h4 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white mb-3">لا توجد نتائج</h4>
            <p className="text-slate-500 dark:text-slate-400 font-medium max-w-sm mx-auto text-sm md:text-lg">
              لم نجد أي عمليات تطابق معايير البحث الحالية. جرب تغيير الفلاتر.
            </p>
            <button 
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('');
                setStartDate('');
                setEndDate('');
              }}
              className="mt-8 text-emerald-600 dark:text-emerald-500 font-black text-sm md:text-lg uppercase tracking-widest hover:underline"
            >
              إعادة تعيين الفلاتر
            </button>
          </motion.div>
        )}
      </motion.div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingExpense && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingExpense(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-white/20 dark:border-slate-800 p-4 md:p-5 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500">
                    <Edit2 className="size-4 md:size-5" />
                  </div>
                  <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">تعديل العملية</h2>
                </div>
                <button 
                  onClick={() => setEditingExpense(null)}
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

                <div className="flex gap-2.5 pt-1.5">
                  <button
                    type="button"
                    onClick={() => setEditingExpense(null)}
                    className="flex-1 px-3 py-2.5 md:px-4 md:py-3 rounded-xl md:rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] px-3 py-2.5 md:px-4 md:py-3 rounded-xl md:rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest bg-primary-600 text-white hover:bg-primary-700 shadow-xl shadow-primary-500/20 transition-all"
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
        {showDeleteConfirm && expenseToDelete && (
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
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[1.5rem] md:rounded-[2rem] shadow-2xl border border-white/20 dark:border-slate-800 p-5 md:p-6 overflow-hidden text-center"
            >
              <div className="w-16 h-16 md:w-20 md:h-20 bg-rose-500/10 rounded-2xl md:rounded-3xl flex items-center justify-center text-rose-500 mx-auto mb-5 md:mb-6">
                <AlertCircle size={40} />
              </div>
              
              <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">تأكيد الحذف</h2>
              <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 font-medium mb-6 md:mb-8">
                هل أنت متأكد من رغبتك في حذف هذه العملية؟ لا يمكن التراجع عن هذا الإجراء.
              </p>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 md:p-4 rounded-xl md:rounded-2xl mb-6 md:mb-8 flex items-center justify-between border border-slate-100 dark:border-slate-700">
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">العملية</p>
                  <p className="text-sm md:text-base font-bold text-slate-900 dark:text-white">{expenseToDelete.note || categories.find(c => c.id === expenseToDelete.categoryId)?.name}</p>
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المبلغ</p>
                  <p className="text-sm md:text-base font-black text-rose-500">{formatCurrency(expenseToDelete.amount, currency)}</p>
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
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="flex-1 px-4 py-3 md:px-6 md:py-4 rounded-xl md:rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest bg-rose-500 text-white hover:bg-rose-600 shadow-xl shadow-rose-500/20 transition-all"
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
