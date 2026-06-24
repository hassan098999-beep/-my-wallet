import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../store/AppContext';
import { formatCurrency, cn, hapticFeedback } from '../../utils';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Trash2, Wallet, Calendar, Building2, 
  ArrowDownCircle, TrendingUp, Search, SlidersHorizontal, 
  Sparkles, CheckCircle2, Shield, Target, FileSpreadsheet, 
  Coins, ArrowRight, ArrowLeft, ArrowUpRight, HelpCircle
} from 'lucide-react';
import { format, parseISO, subMonths } from 'date-fns';
import { ar } from 'date-fns/locale';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';

const QUICK_SOURCES = [
  { label: '💼 راتب شهري', name: 'راتب شهري' },
  { label: '💻 عمل حر', name: 'عمل حر / Freelance' },
  { label: '🏪 أرباح مشروع', name: 'أرباح مشروع تجاري' },
  { label: '🏠 ريع كراء', name: 'ريع كراء عقار' },
  { label: '🎁 منحة عائلية', name: 'منحة' },
  { label: '📈 استثمار', name: 'عوائد استثمارية' },
];

const SPEED_AMOUNTS = [50, 100, 250, 500];

const IncomePage = () => {
  const { income = [], addIncome, deleteIncome, currency = 'TND', accounts = [], goals = [] } = useAppContext();
  
  // Form State
  const [source, setSource] = useState('');
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [goalId, setGoalId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeFormStep, setActiveFormStep] = useState(false); // Toggle to show form drawer/toggle

  // Filter & Search State
  const [selectedPeriod, setSelectedPeriod] = useState<'this-month' | 'last-month' | 'all'>('this-month');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'chart' | 'distribution'>('chart');

  // Add income handler
  const handleAddIncome = (e: React.FormEvent) => {
    e.preventDefault();
    if (!source.trim()) {
      toast.error('الرجاء إدخال مصدر الدخل');
      return;
    }
    const val = Number(amount);
    if (isNaN(val) || val <= 0) {
      toast.error('الرجاء إدخال مبلغ صحيح أكبر من الصفر');
      return;
    }

    hapticFeedback('success');
    addIncome({
      source: source.trim(),
      amount: val,
      accountId: accountId || undefined,
      goalId: goalId || undefined,
      date,
    });

    toast.success('تم تسجيل الدخل الوارد بنجاح! 🎉');
    
    // Reset Form
    setSource('');
    setAmount('');
    setAccountId('');
    setGoalId('');
    setActiveFormStep(false);
  };

  // Quick source tag selection
  const handleQuickSource = (name: string) => {
    hapticFeedback('light');
    setSource(name);
  };

  // Quick speed amount clicks
  const handleSpeedAmount = (val: number) => {
    hapticFeedback('light');
    const current = Number(amount) || 0;
    setAmount((current + val).toString());
  };

  // Safe parse and sort logic
  const filteredIncome = useMemo(() => {
    return income.filter(item => {
      if (!item.date) return true;
      const itemMonth = item.date.slice(0, 7); // yyyy-MM
      
      const today = new Date();
      const thisMonth = format(today, 'yyyy-MM');
      const lastMonth = format(subMonths(today, 1), 'yyyy-MM');
      
      if (selectedPeriod === 'this-month') return itemMonth === thisMonth;
      if (selectedPeriod === 'last-month') return itemMonth === lastMonth;
      return true;
    });
  }, [income, selectedPeriod]);

  // Handle Search Queries
  const searchedIncome = useMemo(() => {
    return filteredIncome.filter(item => {
      const query = searchQuery.toLowerCase().trim();
      if (!query) return true;
      const sourceMatches = item.source.toLowerCase().includes(query);
      const acc = accounts.find(a => a.id === item.accountId);
      const accMatches = acc ? acc.name.toLowerCase().includes(query) : false;
      const goal = goals.find(g => g.id === item.goalId);
      const goalMatches = goal ? goal.name.toLowerCase().includes(query) : false;
      return sourceMatches || accMatches || goalMatches;
    });
  }, [filteredIncome, searchQuery, accounts, goals]);

  // Sorted items (most recent first)
  const sortedIncomeList = useMemo(() => {
    return [...searchedIncome].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [searchedIncome]);

  // Computed metrics
  const stats = useMemo(() => {
    const total = searchedIncome.reduce((sum, item) => sum + item.amount, 0);
    const count = searchedIncome.length;

    // Top Revenue Source
    const sourceMap: Record<string, number> = {};
    searchedIncome.forEach(i => {
      sourceMap[i.source] = (sourceMap[i.source] || 0) + i.amount;
    });
    let maxSrc = 'لا يوجد';
    let maxVal = 0;
    Object.entries(sourceMap).forEach(([src, val]) => {
      if (val > maxVal) {
        maxVal = val;
        maxSrc = src;
      }
    });

    // Income Dedicated directly to Savings/Goals
    const totalAllocatedToGoals = searchedIncome
      .filter(item => item.goalId)
      .reduce((sum, item) => sum + item.amount, 0);

    const goalAllocationPct = total > 0 ? (totalAllocatedToGoals / total) * 100 : 0;

    return {
      total,
      count,
      topSource: maxSrc,
      topSourceAmount: maxVal,
      allocatedToGoals: totalAllocatedToGoals,
      allocatedPct: goalAllocationPct
    };
  }, [searchedIncome]);

  // Chart statistics data helper
  const parsedChartData = useMemo(() => {
    const sortedTimeline = [...filteredIncome].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Group by date
    const dateMap: Record<string, number> = {};
    sortedTimeline.forEach(i => {
      const day = format(parseISO(i.date), 'dd/MM');
      dateMap[day] = (dateMap[day] || 0) + i.amount;
    });

    let cumulative = 0;
    return Object.entries(dateMap).map(([dateLabel, val]) => {
      cumulative += val;
      return {
        dateLabel,
        'المبلغ النقدي': val,
        'التراكمي الإجمالي': cumulative
      };
    });
  }, [filteredIncome]);

  // Source Distribution analysis helper
  const sourceDistribution = useMemo(() => {
    const dataMap: Record<string, { total: number; count: number }> = {};
    filteredIncome.forEach(i => {
      if (!dataMap[i.source]) dataMap[i.source] = { total: 0, count: 0 };
      dataMap[i.source].total += i.amount;
      dataMap[i.source].count += 1;
    });

    const overall = filteredIncome.reduce((sum, i) => sum + i.amount, 0);
    return Object.entries(dataMap)
      .map(([name, d]) => ({
        name,
        total: d.total,
        count: d.count,
        percentage: overall > 0 ? (d.total / overall) * 100 : 0
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredIncome]);

  // Animations variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  return (
    <div className="space-y-6 p-4 pb-32 text-right font-tajawal">
      <PageHeader 
        title="إدارة وتوجيه الدخل" 
        subtitle="سجل روافد الدخل ووزع الأرباح لحماية حسابات عائلتك وتأمين الصناديق"
        action={
          <button
            onClick={() => {
              hapticFeedback('medium');
              setActiveFormStep(!activeFormStep);
            }}
            className={cn(
              "btn-primary flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs transition-all shadow-md",
              activeFormStep ? "bg-rose-500 hover:bg-rose-600 shadow-rose-500/10" : "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/10"
            )}
          >
            {activeFormStep ? (
              <>
                <span>إغلاق النموذج</span>
                <ArrowUpRight size={16} className="rotate-45" />
              </>
            ) : (
              <>
                <Plus size={16} />
                <span>إضافة تدفق جديد</span>
              </>
            )}
          </button>
        }
      />

      {/* QUICK PERIOD SELECTION BAR */}
      <div className="flex bg-slate-100 dark:bg-slate-900/60 p-1 rounded-2xl w-full sm:max-w-md mr-auto gap-1 border border-slate-250">
        {(['this-month', 'last-month', 'all'] as const).map((period) => (
          <button
            key={period}
            onClick={() => {
              hapticFeedback('light');
              setSelectedPeriod(period);
            }}
            className={cn(
              "flex-1 py-2.5 text-center text-xs font-black rounded-xl transition-all",
              selectedPeriod === period 
                ? "bg-white dark:bg-slate-800 text-slate-850 dark:text-white shadow-sm ring-1 ring-slate-100/10" 
                : "text-slate-400 hover:text-slate-650"
            )}
          >
            {period === 'this-month' && 'هذا الشهر'}
            {period === 'last-month' && 'الشهر الماضي'}
            {period === 'all' && 'جميع الأوقات'}
          </button>
        ))}
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-4 gap-5"
      >
        {/* KPI: Total Liquidity */}
        <motion.div variants={itemVariants}>
          <div className="card border-emerald-500/10 bg-gradient-to-br from-emerald-500/5 to-transparent p-5 rounded-3xl relative overflow-hidden flex flex-col justify-between h-32 border">
            <div className="absolute right-0 top-0 -mr-10 -mt-10 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex justify-between items-start">
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
                <ArrowDownCircle size={18} className="animate-pulse" />
              </span>
              <p className="text-[10px] text-slate-400 font-extrabold tracking-widest uppercase">السيولة الإجمالية</p>
            </div>
            <div className="space-y-0.5">
              <h2 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight text-left">
                {formatCurrency(stats.total, currency)}
              </h2>
              <span className="text-[9px] font-bold text-slate-400">مجموع النفقات الواردة بالمدى المبحوث</span>
            </div>
          </div>
        </motion.div>

        {/* KPI: Number of Deposits */}
        <motion.div variants={itemVariants}>
          <div className="card p-5 rounded-3xl relative overflow-hidden flex flex-col justify-between h-32">
            <div className="flex justify-between items-start">
              <span className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-500 shrink-0 border border-slate-100 dark:border-slate-800">
                <FileSpreadsheet size={18} />
              </span>
              <p className="text-[10px] text-slate-400 font-extrabold tracking-widest uppercase">عدد العمليات والدفعات</p>
            </div>
            <div className="space-y-0.5">
              <h2 className="text-2xl font-black text-slate-800 dark:text-white font-mono text-left">
                {stats.count} <span className="text-[10px] font-black text-slate-400">حوالة</span>
              </h2>
              <span className="text-[9px] font-bold text-slate-400">مصادر تم صرفها وتسجيلها بالدفتر</span>
            </div>
          </div>
        </motion.div>

        {/* KPI: Biggest Source contributor */}
        <motion.div variants={itemVariants}>
          <div className="card p-5 rounded-3xl relative overflow-hidden flex flex-col justify-between h-32">
            <div className="flex justify-between items-start">
              <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500 shrink-0 border border-indigo-100 dark:border-indigo-900/40">
                <Coins size={18} />
              </span>
              <p className="text-[10px] text-slate-400 font-extrabold tracking-widest uppercase">الرافد الأعظم</p>
            </div>
            <div className="space-y-0.5 text-right w-full">
              <h2 className="text-base font-black text-slate-800 dark:text-white truncate" title={stats.topSource}>
                {stats.topSource}
              </h2>
              <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 font-mono mt-0.5">
                <span>{stats.topSourceAmount > 0 ? formatCurrency(stats.topSourceAmount, currency) : ''}</span>
                <span>المصدر الأعلى ربحاً</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* KPI: Allocated to Savings Goals */}
        <motion.div variants={itemVariants}>
          <div className="card border-rose-500/10 bg-gradient-to-br from-rose-500/5 to-transparent p-5 rounded-3xl relative overflow-hidden flex flex-col justify-between h-32 border">
            <div className="absolute right-0 top-0 -mr-10 -mt-10 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex justify-between items-start">
              <span className="p-2 rounded-xl bg-rose-500/10 text-rose-500 shrink-0">
                <Target size={18} />
              </span>
              <p className="text-[10px] text-slate-400 font-extrabold tracking-widest uppercase">تأمين الادخار الموجه</p>
            </div>
            <div className="space-y-0.5">
              <h2 className="text-2xl font-black text-rose-500 font-mono tracking-tight text-left">
                {formatCurrency(stats.allocatedToGoals, currency)}
              </h2>
              <div className="flex justify-between items-center text-[9px] font-bold text-slate-400">
                <span className="font-semibold text-rose-600">({Math.round(stats.allocatedPct)}% من إجمالي الدخل)</span>
                <span>المدخرات المربوطة بالأهداف</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* DELUXE ANIMATED MODEL FORM */}
      <AnimatePresence>
        {activeFormStep && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <Card className="border border-emerald-500/20 bg-gradient-to-b from-white to-emerald-50/10 dark:from-slate-900 dark:to-emerald-950/5 p-6 md:p-8 rounded-3xl shadow-lg relative overflow-hidden">
              <div className="absolute left-0 top-0 -ml-16 -mt-16 w-36 h-36 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/50">
                  <Sparkles size={16} className="animate-spin" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-white">نموذج تسجيل نفقات الدخل السريع</h3>
                  <p className="text-[9px] text-slate-450 font-bold">تعبئة الدخل وربطه فوراً بأرصدة الحسابات وموازنات الأهداف المالية للطفل والعائلة</p>
                </div>
              </div>

              <form onSubmit={handleAddIncome} className="space-y-6">
                
                {/* 1. Quick prefill tags */}
                <div className="space-y-2">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">نقر سريع للتصنيف والمصادر النموذجية:</span>
                  <div className="flex flex-wrap gap-2 justify-start">
                    {QUICK_SOURCES.map((q, i) => (
                      <button
                        type="button"
                        key={i}
                        onClick={() => handleQuickSource(q.name)}
                        className={cn(
                          "px-3.5 py-2 text-xs font-black rounded-xl border transition-all cursor-pointer",
                          source === q.name 
                            ? "bg-emerald-500 text-white border-emerald-500 shadow-sm" 
                            : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-500 hover:text-emerald-500"
                        )}
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                  
                  {/* Field A: Core Source Input */}
                  <div className="space-y-2">
                    <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest pr-1">مصدر الدخل</label>
                    <input
                      type="text"
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                      placeholder="أدخل مسمى المصدر..."
                      className="w-full px-4 py-3 rounded-2xl border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-white focus:ring-8 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                      required
                    />
                  </div>

                  {/* Field B: Numeric Amount Input */}
                  <div className="space-y-2">
                    <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest pr-1">المبلغ النقدي ({currency})</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.001"
                        value={amount}
                        className="w-full pl-14 pr-4 py-3 rounded-2xl border-2 border-slate-150 dark:border-slate-800 bg-white/90 dark:bg-slate-950 text-xs font-black text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-all font-mono"
                        placeholder="0.000"
                        onChange={(e) => setAmount(e.target.value)}
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
                        required
                        dir="ltr"
                      />
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 font-extrabold text-[10px]">{currency}</span>
                    </div>
                  </div>

                  {/* Field C: Bank Account selection */}
                  <div className="space-y-2">
                    <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest pr-1">الإيداع في الحساب</label>
                    <div className="relative">
                      <select
                        value={accountId}
                        onChange={(e) => setAccountId(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-white focus:ring-8 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all appearance-none cursor-pointer"
                      >
                        <option value="">بدون حساب (نقدي)</option>
                        {accounts.map(acc => (
                          <option key={acc.id} value={acc.id}>{acc.name} ({formatCurrency(acc.balance, currency)})</option>
                        ))}
                      </select>
                      <Building2 size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Field D: Transaction Date */}
                  <div className="space-y-2">
                    <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest pr-1">تاريخ الحوالة</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-white focus:ring-8 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all cursor-pointer"
                      required
                    />
                  </div>

                </div>

                {/* Direct allocates to Saving Goals */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900/65 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-3">
                  <div className="flex items-center gap-2">
                    <Target size={14} className="text-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-extrabold text-slate-600 dark:text-slate-300">أمن صندوقاً مباشرة: تخصيص هذا المبلغ لهدف ادخار (اختياري)</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <select
                        value={goalId}
                        onChange={(e) => setGoalId(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-white focus:ring-6 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all appearance-none cursor-pointer"
                      >
                        <option value="">لا يوجد هدف (خزينة عامة)</option>
                        {goals.map(goal => (
                          <option key={goal.id} value={goal.id}>
                            {goal.name} {goal.isEmergencyFund ? '🛡️' : '🎯'} (الحالي: {formatCurrency(goal.currentAmount, currency)})
                          </option>
                        ))}
                      </select>
                      <Target size={12} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                    
                    <p className="text-[10px] text-slate-400 flex items-center justify-start text-right leading-relaxed font-semibold">
                      💡 في حال الملاءمة مع هدف (مثل طابع الرضيع أو الرصيد الاحتياطي)، تتم زيادة قيمة الرصيد تلقائياً عند حفظ الحوالة وتثبيتها.
                    </p>
                  </div>
                </div>

                {/* 2. Speed Amounts Keys */}
                <div className="space-y-2">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">نقد سريع لزيادة وتسهيل المبلغ (+):</span>
                  <div className="flex gap-2.5 justify-start">
                    {SPEED_AMOUNTS.map((val) => (
                      <button
                        type="button"
                        key={val}
                        onClick={() => handleSpeedAmount(val)}
                        className="px-4 py-2 text-xs font-black rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 hover:border-emerald-500 hover:text-emerald-500 active:scale-95 transition-all cursor-pointer font-mono"
                      >
                        +{val}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => { hapticFeedback('light'); setAmount(''); }}
                      className="px-4 py-2 text-xs font-black rounded-xl bg-rose-50 text-rose-500 border border-rose-100 hover:bg-rose-100 active:scale-95 transition-all cursor-pointer"
                    >
                      تصفير
                    </button>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      hapticFeedback('light');
                      setActiveFormStep(false);
                    }}
                    className="px-5 py-3 rounded-2xl text-xs font-black text-slate-400 border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-600 transition-all cursor-pointer"
                  >
                    إلغاء الأمر
                  </button>
                  
                  <button
                    type="submit"
                    className="px-8 py-3 rounded-2xl font-black text-xs bg-emerald-500 text-white hover:bg-emerald-600 active:scale-[0.98] transition-all shadow-md shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
                  >
                    <Plus size={16} />
                    <span>تخزين الحوالة الآن</span>
                  </button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DUAL ANALYSIS AND CHART TABS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* RIGHT COLUMN: Statistics Chart and breakdown distribution */}
        <div className="lg:col-span-8 flex flex-col space-y-6">
          <Card className="flex flex-col flex-1 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-150/65 pb-4 gap-4">
              <div className="space-y-0.5">
                <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-1.5 justify-end">
                  <TrendingUp size={16} className="text-emerald-500" />
                  <span>تحليل نمو قنوات الدفع للمدى المالي المختار</span>
                </h3>
                <p className="text-[10px] text-slate-400 font-extrabold">مقارنة خطية للنمو التراكمي وتوزيع حصص التمويل</p>
              </div>

              {/* Chart Tab toggleButtons */}
              <div className="flex bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl w-fit mr-auto gap-1 border border-slate-200">
                <button
                  onClick={() => { hapticFeedback('light'); setActiveTab('chart'); }}
                  className={cn(
                    "px-3.5 py-1.5 text-[10px] font-black rounded-lg transition-all",
                    activeTab === 'chart' 
                      ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-xs" 
                      : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  منحنى الواردات
                </button>
                <button
                  onClick={() => { hapticFeedback('light'); setActiveTab('distribution'); }}
                  className={cn(
                    "px-3.5 py-1.5 text-[10px] font-black rounded-lg transition-all",
                    activeTab === 'distribution' 
                      ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-xs" 
                      : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  توزيع الفئات بالتأثير
                </button>
              </div>
            </div>

            <div className="h-64 sm:h-72 w-full pt-6">
              {filteredIncome.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-2">
                  <Wallet size={36} className="text-slate-305 text-slate-400 mx-auto" />
                  <p className="text-xs font-black text-slate-550">لا توجد نفقات أو مداخيل في المدة المحددة لتوليد المبيعات والرسوم البيانية.</p>
                </div>
              ) : activeTab === 'chart' ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={parsedChartData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                      </linearGradient>
                      <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.2} />
                    <XAxis 
                      dataKey="dateLabel" 
                      stroke="#94a3b8" 
                      tickLine={false} 
                      axisLine={false} 
                      tick={{ fontSize: 9, fontWeight: 'bold' }} 
                    />
                    <YAxis 
                      stroke="#94a3b8" 
                      tickLine={false} 
                      axisLine={false} 
                      tick={{ fontSize: 9, fontWeight: 'mono', fill: '#64748b' }} 
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '14px', background: '#0f172a', border: '1px solid #1e293b', direction: 'rtl' }}
                      itemStyle={{ color: '#fff', fontSize: '10px' }}
                      labelStyle={{ color: '#94a3b8', fontSize: '9px', fontWeight: 'bold', textAlign: 'right' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="المبلغ النقدي" 
                      stroke="#10b981" 
                      strokeWidth={2.5} 
                      fillOpacity={1} 
                      fill="url(#colorIncome)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="التراكمي الإجمالي" 
                      stroke="#3b82f6" 
                      strokeWidth={1.5} 
                      strokeDasharray="4 4" 
                      fillOpacity={1} 
                      fill="url(#colorCumulative)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="space-y-4 max-h-full overflow-y-auto pr-2">
                  {sourceDistribution.map((src, idx) => (
                    <div key={idx} className="p-3.5 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800/85">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="font-mono text-xs font-black text-slate-800 dark:text-slate-350">{formatCurrency(src.total, currency)}</span>
                        <div className="text-right">
                          <span className="text-xs font-black text-slate-850 dark:text-white">{src.name}</span>
                          <span className="text-[9px] text-slate-400 font-bold block">مجموع العمليات: {src.count} عمليات</span>
                        </div>
                      </div>
                      
                      {/* Progress share bar */}
                      <div className="space-y-1">
                        <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-850 overflow-hidden relative">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${src.percentage}%` }}
                            transition={{ duration: 0.5 }}
                            className="h-full rounded-full bg-emerald-500"
                          />
                        </div>
                        <div className="flex justify-between text-[8px] font-black text-slate-400">
                          <span>{src.percentage.toFixed(0)}% من قنوات الدفن</span>
                          <span>مساهمة قوية</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* LEFT COLUMN: Ledger Logs history, Search filter, item delete swipe */}
        <div className="lg:col-span-4 flex flex-col space-y-6">
          <Card className="flex flex-col flex-grow p-5 justify-between">
            
            {/* Header ledger */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-3">
                <span className="px-2.5 py-1 bg-slate-50 dark:bg-slate-900 text-slate-400 text-[10px] font-black rounded-lg border border-slate-150">
                  {sortedIncomeList.length} حوالة
                </span>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-black text-slate-800 dark:text-white">سجل تدفق الدفتر</h3>
                  <Wallet size={14} className="text-emerald-500" />
                </div>
              </div>

              {/* SEARCH DIALOGUE */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="ابحث بالنفقات أو بالحساب أو بالهدف..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-emerald-500 transition-all font-tajawal"
                />
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            {/* LEDGER LIST CONTAINER */}
            <div className="flex-1 overflow-y-auto max-h-96 pr-1 divide-y divide-slate-100 dark:divide-slate-800/40 mt-4 space-y-2">
              {sortedIncomeList.length === 0 ? (
                <div className="py-16 text-center space-y-4">
                  <div className="p-4 bg-emerald-500/5 size-16 mx-auto rounded-2xl flex items-center justify-center text-emerald-500 border border-emerald-500/10">
                    <Search size={22} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-black text-slate-500">لا يوجد مصادر للدخل تطابق البحث</p>
                    <p className="text-[10px] text-slate-400">حاول تجربة كلمات بحث أخرى أو فلترة المدى الزمني أعلاه.</p>
                  </div>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {sortedIncomeList.map((item, index) => {
                    const mappedAccount = accounts.find(a => a.id === item.accountId);
                    const mappedGoal = goals.find(g => g.id === item.goalId);
                    
                    return (
                      <motion.div
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.25, delay: Math.min(index, 8) * 0.03 }}
                        key={item.id}
                        className="py-3 flex items-center justify-between gap-3 group hover:bg-slate-50/50 dark:hover:bg-slate-900/30 rounded-xl p-2 transition-all"
                      >
                        {/* Remove / delete Action button with popup haptic */}
                        <button
                          onClick={() => {
                            if (window.confirm('هل أنت متأكد من رغبتك بحذف هذا القيد المالي؟ (سيؤثر ذلك على أرصدة الحسابات والأهداف المرتبطة)')) {
                              hapticFeedback('warning');
                              deleteIncome(item.id);
                              toast.success('تم إقصاء وحذف قيد الدخل بنجاح');
                            }
                          }}
                          className="p-2 text-slate-350 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all cursor-pointer shrink-0"
                          title="إزالة الحوالة"
                        >
                          <Trash2 size={13} />
                        </button>

                        {/* Middle balance/amounts elements */}
                        <div className="flex flex-col items-start font-mono grow text-left shrink-0">
                          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 tracking-tight select-all">
                            +{formatCurrency(item.amount, currency)}
                          </span>
                          
                          {/* Account badge */}
                          {mappedAccount ? (
                            <span className="inline-flex items-center gap-1 text-[8px] font-black text-indigo-500 mt-1 uppercase">
                              <Building2 size={8} />
                              {mappedAccount.name}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[8px] font-black text-slate-400 mt-1 uppercase">
                              🏦 كاش / نقدي
                            </span>
                          )}
                        </div>

                        {/* Title source and target badges */}
                        <div className="text-right flex flex-col justify-between grow text-rtl space-y-1">
                          <h4 className="text-xs font-black text-slate-800 dark:text-white leading-tight">
                            {item.source}
                          </h4>
                          
                          <div className="flex flex-wrap gap-1 justify-end items-center">
                            {mappedGoal && (
                              <span className={cn(
                                "inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[8px] font-black rounded border whitespace-nowrap",
                                mappedGoal.isEmergencyFund 
                                  ? "bg-rose-100/60 text-rose-600 border-rose-200 dark:bg-rose-950/20 dark:text-rose-450 dark:border-rose-900"
                                  : "bg-emerald-100/60 text-emerald-600 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900"
                              )}>
                                {mappedGoal.isEmergencyFund ? <Shield size={7} /> : <Target size={7} />}
                                🎯 مخصص لـ {mappedGoal.name}
                              </span>
                            )}
                            
                            <span className="text-[8px] text-slate-400 font-bold block font-mono">
                              {format(parseISO(item.date), 'dd MMM yyyy', { locale: ar })}
                            </span>
                          </div>
                        </div>

                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>

            {/* Quick reminder help status */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 text-right">
              <p className="text-[9px] text-slate-400 font-semibold leading-relaxed">
                🚨 تنبيه: يرجى إبقاء كشف الدخل محدثاً لملاءمة التوقعات في <strong className="text-indigo-500">ميزانيات قفة الشهر الفرعية</strong> والحفاظ على نسب الادخار الآمنة.
              </p>
            </div>

          </Card>
        </div>

      </div>

    </div>
  );
};

export default IncomePage;
