import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useAppContext } from '../store/AppContext';
import { formatCurrency, cn } from '../utils';
import { parseISO, format, isAfter, isBefore, addDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Plus, CheckCircle2, Wallet, CreditCard, Banknote, Landmark, TrendingUp, Activity, CalendarClock } from 'lucide-react';
import { DynamicIcon } from '../components/DynamicIcon';
import { PaymentMethod } from '../types';
import { CategorySelect } from '../components/CategorySelect';
import { motion, AnimatePresence, Variants } from 'motion/react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { expenses, categories, accounts, goals, currency, addExpense, setIsAddModalOpen, budget, income = [], recurringExpenses = [] } = useAppContext();

  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [goalId, setGoalId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(true);

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error('الرجاء إدخال مبلغ صحيح');
      return;
    }
    if (!accountId) {
      toast.error('الرجاء اختيار الحساب');
      return;
    }

    addExpense({
      amount: Number(amount),
      categoryId: categoryId || categories[0]?.id,
      subcategoryId: subcategoryId || undefined,
      accountId,
      goalId: goalId || undefined,
      date,
      note,
      paymentMethod,
    });

    setAmount('');
    setNote('');
    setSubcategoryId('');
    setGoalId('');
    toast.success('تم حفظ العملية بنجاح!');
  };

  const recentTransactions = expenses.slice(0, 5);
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthlyExpenses = expenses.filter(e => e.date.startsWith(currentMonth));
  const totalMonthlyExpense = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Smart Calculations
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const currentDay = new Date().getDate();
  const dailyAverage = totalMonthlyExpense / (currentDay || 1);
  const forecastExpense = dailyAverage * daysInMonth;
  
  const totalMonthlyIncome = income.filter(i => i.date.startsWith(currentMonth)).reduce((sum, i) => sum + i.amount, 0);
  const potentialSavings = Math.max(0, totalMonthlyIncome - totalMonthlyExpense);

  const upcomingBills = recurringExpenses
    .filter(r => isAfter(parseISO(r.nextDate), new Date()) && isBefore(parseISO(r.nextDate), addDays(new Date(), 14)))
    .sort((a, b) => new Date(a.nextDate).getTime() - new Date(b.nextDate).getTime())
    .slice(0, 3);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-3 md:space-y-5 pb-4"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4">
        <div className="space-y-0.5">
          <h1 className="text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight">مرحباً بك</h1>
          <p className="text-[9px] md:text-[10px] text-slate-500 dark:text-slate-400 font-medium">إليك ملخص نشاطك المالي لهذا الشهر</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3 py-1.5 rounded-xl transition-all shadow-xl hover:shadow-2xl active:scale-95 font-black text-[10px]"
          >
            <Plus size={14} />
            إضافة عملية
          </button>
        </div>
      </div>

      {/* Hero Section - Bento Grid Style */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
        {/* Main Balance Card */}
        <motion.div 
          variants={itemVariants}
          className="lg:col-span-2 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950 rounded-2xl md:rounded-3xl p-3 md:p-5 text-white relative overflow-hidden shadow-2xl shadow-indigo-900/40"
        >
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1.5 opacity-70">
                <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md">
                  <Wallet size={10} className="text-indigo-300" />
                </div>
                <span className="text-[7px] md:text-[9px] font-black uppercase tracking-[0.2em] text-indigo-100">إجمالي الرصيد المتاح</span>
              </div>
              <h2 className="text-2xl md:text-4xl font-black tracking-tighter mb-3 md:mb-5 bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-indigo-200">
                {formatCurrency(accounts.reduce((sum, acc) => sum + acc.balance, 0), currency)}
              </h2>
            </div>

            {budget && (
              <div className="space-y-2 md:space-y-3 bg-white/5 backdrop-blur-md p-3 md:p-4 rounded-xl md:rounded-2xl border border-white/10 shadow-inner">
                <div className="flex justify-between items-end">
                  <div className="space-y-0.5">
                    <p className="text-[7px] md:text-[9px] font-black opacity-60 uppercase tracking-widest mb-0.5">الميزانية الشهرية</p>
                    <p className="text-sm md:text-lg font-black">{formatCurrency(totalMonthlyExpense, currency)} <span className="text-[9px] md:text-[11px] opacity-40 font-bold">/ {formatCurrency(budget.amount, currency)}</span></p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl md:text-3xl font-black opacity-80 tracking-tighter">{Math.round((totalMonthlyExpense / budget.amount) * 100)}%</span>
                  </div>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1.5 md:h-2.5 overflow-hidden p-0.5 border border-white/5 shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (totalMonthlyExpense / budget.amount) * 100)}%` }}
                    transition={{ duration: 1.2, ease: "circOut" }}
                    className={`h-full rounded-full shadow-[0_0_20px_rgba(99,102,241,0.5)] relative overflow-hidden ${totalMonthlyExpense > budget.amount ? 'bg-gradient-to-r from-rose-500 to-pink-500' : 'bg-gradient-to-r from-indigo-400 to-violet-500'}`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                  </motion.div>
                </div>
              </div>
            )}
          </div>
          {/* Decorative background elements */}
          <div className="absolute -right-10 -top-10 w-24 h-24 bg-indigo-500/20 rounded-full blur-[50px] animate-pulse-soft" />
          <div className="absolute -left-10 -bottom-10 w-24 h-24 bg-emerald-500/10 rounded-full blur-[50px] animate-float" />
        </motion.div>

        {/* Secondary Stats Column */}
        <div className="grid grid-cols-1 gap-3 md:gap-4">
          <motion.div variants={itemVariants} className="glass-card p-3 md:p-4 rounded-2xl md:rounded-3xl flex flex-col justify-center gap-2 md:gap-3">
            <div className="flex items-center gap-2 md:gap-3 mb-0.5">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shadow-inner">
                <Activity size={16} />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-[9px] md:text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight">مؤشر 50/30/20</h4>
                <p className="text-[7px] md:text-[9px] font-bold text-slate-500">توزيع مصاريف الشهر الحالي</p>
              </div>
            </div>
            
            <div className="space-y-2">
              {[
                { type: 'need', label: 'الاحتياجات', color: 'bg-indigo-500', target: 50 },
                { type: 'want', label: 'الرغبات', color: 'bg-amber-500', target: 30 },
                { type: 'saving', label: 'الادخار', color: 'bg-emerald-500', target: 20 }
              ].map(bucket => {
                const amount = monthlyExpenses
                  .filter(e => categories.find(c => c.id === e.categoryId)?.type === bucket.type)
                  .reduce((sum, e) => sum + e.amount, 0);
                const percent = totalMonthlyIncome > 0 ? (amount / totalMonthlyIncome) * 100 : 0;
                
                return (
                  <div key={bucket.type} className="space-y-1">
                    <div className="flex justify-between items-center text-[9px] md:text-[11px] font-black">
                      <span className="text-slate-600 dark:text-slate-400">{bucket.label}</span>
                      <span className={percent > bucket.target ? "text-rose-500" : "text-slate-900 dark:text-white"}>
                        {Math.round(percent)}% <span className="text-slate-400 font-bold opacity-50">/ {bucket.target}%</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800/50 h-1.5 rounded-full overflow-hidden p-0.5 shadow-inner">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, percent)}%` }}
                        className={`h-full rounded-full ${percent > bucket.target ? 'bg-rose-500' : bucket.color} shadow-sm relative overflow-hidden`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                      </motion.div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Link to="/income" className="glass-card p-3 md:p-4 rounded-2xl md:rounded-3xl flex items-center gap-2 md:gap-3 group hover:scale-[1.02] transition-all duration-300">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0 shadow-inner group-hover:rotate-12 transition-transform">
                <TrendingUp size={18} />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-[7px] md:text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">التوفير المحتمل</h4>
                <p className="text-base md:text-xl font-black text-slate-900 dark:text-white tracking-tighter">{formatCurrency(potentialSavings, currency)}</p>
                <p className="text-[7px] md:text-[9px] font-bold text-slate-500/70">الفرق بين دخلك ومصاريفك</p>
              </div>
            </Link>
          </motion.div>

          {/* Upcoming Bills */}
          {upcomingBills.length > 0 && (
            <motion.div variants={itemVariants} className="glass-card p-3 md:p-4 rounded-2xl md:rounded-3xl flex flex-col gap-2 md:gap-3">
              <div className="flex items-center gap-2 md:gap-3 mb-0.5">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500 shadow-inner">
                  <CalendarClock size={16} />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-[9px] md:text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight">فواتير قادمة</h4>
                  <p className="text-[7px] md:text-[9px] font-bold text-slate-500">خلال 14 يوم</p>
                </div>
              </div>
              <div className="space-y-1.5 md:space-y-2">
                {upcomingBills.map(bill => {
                  const category = categories.find(c => c.id === bill.categoryId);
                  return (
                    <div key={bill.id} className="flex justify-between items-center p-1.5 md:p-2 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-slate-100/50 dark:border-slate-800/50 shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center text-white shadow-lg shadow-current/20" style={{ backgroundColor: category?.color || '#ccc' }}>
                          {category?.icon ? <DynamicIcon name={category.icon} size={12} /> : <span className="text-[9px] md:text-[11px] font-black">{category?.name.charAt(0)}</span>}
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[9px] md:text-[11px] font-black text-slate-900 dark:text-white">{bill.note || category?.name}</p>
                          <p className="text-[7px] md:text-[9px] font-bold text-slate-400">{format(parseISO(bill.nextDate), 'dd MMMM', { locale: ar })}</p>
                        </div>
                      </div>
                      <span className="text-[9px] md:text-[11px] font-black text-slate-900 dark:text-white tracking-tighter">{formatCurrency(bill.amount, currency)}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Quick Add & Transactions Section */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 md:gap-4">
        {/* Quick Add Form - Modern Style */}
        <motion.div variants={itemVariants} className="lg:col-span-2 glass-card p-3 md:p-5 rounded-2xl md:rounded-3xl">
          <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-5">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-600 shadow-inner">
              <Plus size={18} />
            </div>
            <h3 className="text-base md:text-lg font-black text-slate-900 dark:text-white tracking-tight">إضافة سريعة</h3>
          </div>

          <form onSubmit={handleQuickAdd} className="space-y-2 md:space-y-3">
            <div className="relative mb-4 md:mb-6">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-2 md:py-3.5 rounded-xl md:rounded-2xl border-none bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white text-center font-mono font-black text-xl md:text-3xl tracking-tighter placeholder:text-slate-200 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner"
                placeholder="0.00"
                required
              />
              <div className="absolute inset-x-0 -bottom-2 md:-bottom-3 flex justify-center">
                <span className="px-2 py-0.5 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 text-[7px] md:text-[9px] font-black rounded-full uppercase tracking-widest shadow-lg border border-slate-100 dark:border-slate-700">
                  {currency}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 md:gap-3">
              <CategorySelect
                categories={categories}
                selectedId={categoryId}
                onChange={setCategoryId}
                className="!rounded-xl md:!rounded-2xl !bg-slate-50 !dark:bg-slate-900/50 !border-none !h-[38px] md:!h-[48px] !shadow-inner !font-black !text-[10px] md:!text-xs"
              />

              <div className="relative">
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className={cn(
                    "w-full px-4 py-2 md:py-3 rounded-xl md:rounded-2xl border-none bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white font-black text-[10px] md:text-xs focus:ring-4 focus:ring-indigo-500/10 shadow-inner transition-all"
                  )}
                  placeholder="ملاحظة (مثال: غداء عمل)"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2 md:gap-3">
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="px-3 md:px-4 py-1.5 md:py-2.5 rounded-xl md:rounded-2xl border-none bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white font-black text-[9px] md:text-[11px] appearance-none focus:ring-4 focus:ring-indigo-500/10 shadow-inner cursor-pointer"
                  required
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>

                <select
                  value={goalId}
                  onChange={(e) => setGoalId(e.target.value)}
                  className="px-3 md:px-4 py-1.5 md:py-2.5 rounded-xl md:rounded-2xl border-none bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white font-black text-[9px] md:text-[11px] appearance-none focus:ring-4 focus:ring-indigo-500/10 shadow-inner cursor-pointer"
                >
                  <option value="">ربط بهدف</option>
                  {goals.map((goal) => (
                    <option key={goal.id} value={goal.id}>{goal.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 md:py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-black rounded-xl md:rounded-2xl transition-all shadow-2xl shadow-indigo-500/30 active:scale-[0.98] text-[10px] md:text-sm uppercase tracking-[0.2em]"
            >
              حفظ العملية
            </button>
          </form>
        </motion.div>

        {/* Recent Transactions - Organized List */}
        <motion.div variants={itemVariants} className="lg:col-span-3 glass-card p-3 md:p-5 rounded-2xl md:rounded-3xl">
          <div className="flex justify-between items-center mb-3 md:mb-5">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600 shadow-inner">
                <Activity size={18} />
              </div>
              <h3 className="text-base md:text-lg font-black text-slate-900 dark:text-white tracking-tight">آخر العمليات</h3>
            </div>
            <Link to="/transactions" className="text-[9px] md:text-[11px] font-black text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 px-2 py-1.5 rounded-xl transition-all">عرض الكل</Link>
          </div>

          <div className="space-y-2 md:space-y-3">
            {recentTransactions.length > 0 ? (
              recentTransactions.map(expense => {
                const category = categories.find(c => c.id === expense.categoryId);
                return (
                  <div key={expense.id} className="flex items-center justify-between p-2 md:p-3 rounded-xl md:rounded-2xl hover:bg-white dark:hover:bg-slate-800 transition-all group border border-transparent hover:border-slate-100 dark:hover:border-slate-700 hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-none">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div 
                        className="w-8 h-8 md:w-11 md:h-11 rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-lg shadow-current/20 transition-transform group-hover:scale-110 group-hover:rotate-3"
                        style={{ backgroundColor: category?.color || '#ccc' }}
                      >
                        {category?.icon ? <DynamicIcon name={category.icon} size={16} /> : <span className="text-[10px] md:text-xs font-black">{category?.name.charAt(0)}</span>}
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs md:text-sm font-black text-slate-900 dark:text-white mb-0.5">{expense.note || category?.name}</p>
                        <div className="flex items-center gap-2 md:gap-3">
                          <p className="text-[7px] md:text-[9px] font-bold text-slate-400">{format(parseISO(expense.date), 'dd MMMM', { locale: ar })}</p>
                          <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
                          <p className="text-[7px] md:text-[9px] font-bold text-slate-400">{accounts.find(a => a.id === expense.accountId)?.name}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-0.5">
                      <p className="text-sm md:text-lg font-black text-slate-900 dark:text-white tracking-tighter">{formatCurrency(expense.amount, currency)}</p>
                      {expense.goalId && (
                        <p className="text-[7px] md:text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-0.5">مدخرات</p>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-6 md:py-12 text-center">
                <div className="w-12 h-12 md:w-20 md:h-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center text-slate-200 mb-3 animate-pulse">
                  <Activity size={28} />
                </div>
                <p className="text-slate-400 font-black text-xs md:text-sm">لا توجد عمليات مسجلة حالياً</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
