import React, { useState } from 'react';
import { useAppContext } from '../../store/AppContext';
import { formatCurrency, cn } from '../../utils';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Wallet, Calendar, Landmark, ArrowDownCircle, TrendingUp } from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval } from 'date-fns';
import { ar } from 'date-fns/locale';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const IncomePage = () => {
  const { income = [], addIncome, deleteIncome, currency, accounts } = useAppContext();
  const [source, setSource] = useState('');
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleAddIncome = (e: React.FormEvent) => {
    e.preventDefault();
    if (source.trim() && Number(amount) > 0) {
      addIncome({
        source,
        amount: Number(amount),
        accountId: accountId || undefined,
        date,
      });
      setSource('');
      setAmount('');
      setAccountId('');
    }
  };

  const totalIncome = income.reduce((sum, item) => sum + item.amount, 0);

  // Prepare chart data
  const chartData = income
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(item => ({
      date: format(parseISO(item.date), 'dd/MM'),
      amount: item.amount
    }));

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
      className="space-y-8 md:space-y-12 pb-12 max-w-5xl mx-auto"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 md:gap-6">
        <div className="space-y-1.5">
          <h1 className="text-2xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            إدارة <span className="text-emerald-500">الدخل</span>
          </h1>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 font-medium">
            سجل مصادر دخلك لمتابعة رصيدك المالي
          </p>
        </div>
        
        <div className="bg-emerald-50/80 dark:bg-emerald-900/40 px-5 py-3 md:px-6 md:py-4 rounded-2xl md:rounded-3xl border border-emerald-100 dark:border-emerald-800/50 flex items-center gap-4 shadow-lg backdrop-blur-md">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-emerald-100 dark:bg-emerald-800/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-inner">
            <ArrowDownCircle size={28} />
          </div>
          <div>
            <p className="text-xs md:text-sm font-black text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-widest mb-1">إجمالي الدخل</p>
            <p className="text-3xl md:text-4xl font-black text-emerald-700 dark:text-emerald-300 tracking-tight">{formatCurrency(totalIncome, currency)}</p>
          </div>
        </div>
      </div>

      {income.length > 0 && (
        <motion.div variants={itemVariants} className="glass-card p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-lg h-64 md:h-80">
          <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
            <TrendingUp className="text-emerald-500 size-5 md:size-6" />
            <h3 className="text-base md:text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">تحليل الدخل</h3>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Area type="monotone" dataKey="amount" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      <motion.form 
        variants={itemVariants}
        onSubmit={handleAddIncome} 
        className="glass-card p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all"
      >
        <div className="flex items-center gap-4 mb-6 md:mb-8">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-primary-50 dark:bg-primary-900/40 flex items-center justify-center text-primary-500 shadow-inner">
            <Plus size={24} className="md:size-28" />
          </div>
          <h3 className="text-base md:text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">إضافة دخل جديد</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <div className="space-y-2 md:space-y-3">
            <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest pl-1">المصدر</label>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="مثال: راتب، عمل حر"
              className="w-full px-4 py-3 md:px-5 md:py-4 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-sm md:text-base font-bold text-slate-900 dark:text-white focus:ring-8 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all shadow-sm"
              required
            />
          </div>
          
          <div className="space-y-2 md:space-y-3">
            <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest pl-1">المبلغ</label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-14 pr-4 py-3 md:px-5 md:py-4 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-sm md:text-base font-black text-slate-900 dark:text-white focus:ring-8 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all font-mono shadow-sm"
                required
                dir="ltr"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs md:text-sm">{currency}</span>
            </div>
          </div>

          <div className="space-y-2 md:space-y-3">
            <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest pl-1">الحساب (اختياري)</label>
            <div className="relative">
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-4 py-3 md:px-5 md:py-4 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-sm md:text-base font-bold text-slate-900 dark:text-white focus:ring-8 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all appearance-none shadow-sm"
              >
                <option value="">بدون حساب</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
              <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-2 md:space-y-3">
            <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest pl-1">التاريخ</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 md:px-5 md:py-4 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-sm md:text-base font-bold text-slate-900 dark:text-white focus:ring-8 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all shadow-sm"
              required
            />
          </div>
        </div>
        
        <div className="mt-6 md:mt-8 flex justify-end">
          <motion.button 
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            type="submit" 
            className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 md:px-10 md:py-4 rounded-2xl md:rounded-3xl font-black text-sm md:text-base flex items-center justify-center gap-3 transition-all shadow-xl shadow-emerald-500/30"
          >
            <Plus size={20} className="md:size-24" /> 
            <span>إضافة الدخل</span>
          </motion.button>
        </div>
      </motion.form>

      <motion.div variants={itemVariants} className="glass-card rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-lg overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-4 md:gap-5">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center text-slate-500 shadow-inner">
              <Wallet size={24} className="md:size-28" />
            </div>
            <h3 className="text-base md:text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">سجل الدخل</h3>
          </div>
          <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs md:text-sm font-black px-4 py-2 rounded-full uppercase tracking-widest shadow-sm">
            {income.length} عملية
          </span>
        </div>

        {income.length === 0 ? (
          <div className="p-16 md:p-24 text-center">
            <div className="w-24 h-24 md:w-32 md:h-32 mx-auto bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-center text-slate-400 mb-8 md:mb-10 shadow-inner">
              <Wallet className="size-10 md:size-14" />
            </div>
            <p className="text-lg md:text-xl font-bold text-slate-500">لا توجد مصادر دخل مسجلة حالياً</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
            <AnimatePresence mode="popLayout">
              {income.map((item, index) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  key={item.id} 
                  className="p-6 md:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 md:gap-6 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group"
                >
                  <div className="flex items-center gap-4 md:gap-6">
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-[2rem] bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-500 shrink-0 shadow-sm">
                      <ArrowDownCircle size={24} className="md:size-32" />
                    </div>
                    <div className="space-y-1.5 md:space-y-2">
                      <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white">{item.source}</h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs md:text-sm font-bold text-slate-400">
                        <span className="flex items-center gap-2">
                          <Calendar size={14} className="md:size-16" />
                          {format(parseISO(item.date), 'dd MMMM yyyy', { locale: ar })}
                        </span>
                        {item.accountId && (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                            <span className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500">
                              <Landmark size={14} className="md:size-16" />
                              {accounts.find(a => a.id === item.accountId)?.name || 'حساب محذوف'}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between sm:justify-end gap-6 md:gap-8 border-t sm:border-t-0 pt-4 md:pt-0 border-slate-100 dark:border-slate-800">
                    <span className="text-2xl md:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                      +{formatCurrency(item.amount, currency)}
                    </span>
                    <button 
                      onClick={() => deleteIncome(item.id)}
                      className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all opacity-100 sm:opacity-0 group-hover:opacity-100 shadow-sm hover:shadow-md"
                      title="حذف"
                    >
                      <Trash2 size={20} className="md:size-24" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default IncomePage;
