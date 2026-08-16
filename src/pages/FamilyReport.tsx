import React, { useMemo } from 'react';
import { useAppContext } from '../store/AppContext';
import { formatCurrency, hapticFeedback, cn, getBudgetMonth } from '../utils';
import { format, subMonths, parseISO, startOfDay, differenceInDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  Baby, Home, TrendingUp, TrendingDown, HelpCircle, 
  Sparkles, CheckCircle2, AlertCircle, ShoppingBag, 
  Heart, Calendar, Activity, ArrowRight, ShieldCheck,
  ChevronLeft
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, 
  Legend as RechartsLegend, Cell, RadialBarChart, RadialBar
} from 'recharts';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import BabyBudget from './BabyBudget';

const FamilyReport: React.FC = () => {
  const { expenses, income, categories, budgets, firstDayOfMonth, currency = 'TND' } = useAppContext();
  const [activeTab, setActiveTab] = React.useState<'report' | 'baby'>('report');
  
  const currentMonth = getBudgetMonth(new Date(), firstDayOfMonth || 1);
  const budget = budgets?.find(b => b.month === currentMonth) || null;
  const categoryBudgets = useMemo(() => budget?.categoryBudgets || {}, [budget]);

  const currentMonthStr = useMemo(() => format(new Date(), 'yyyy-MM'), []);
  const lastMonthStr = useMemo(() => format(subMonths(new Date(), 1), 'yyyy-MM'), []);

  // Filter current and previous month transactions safely (excluding transfers)
  const currentMonthExpenses = useMemo(() => {
    return expenses.filter(e => !e.isTransfer && e.date && e.date.startsWith(currentMonthStr));
  }, [expenses, currentMonthStr]);

  const previousMonthExpenses = useMemo(() => {
    return expenses.filter(e => !e.isTransfer && e.date && e.date.startsWith(lastMonthStr));
  }, [expenses, lastMonthStr]);

  // Determine if we have under 7 days of expenses
  const hasUnder7Days = useMemo(() => {
    const uniqueDates = new Set(expenses.filter(e => !e.isTransfer).map(e => e.date));
    return uniqueDates.size < 7;
  }, [expenses]);

  // Find child/baby category
  const babyCategory = useMemo(() => {
    return categories.find(c => 
      c.id === '2' || 
      c.name === 'لوازم ومصروف الرضيع' || 
      c.name.toLowerCase().includes('baby') || 
      c.name.includes('رضيع') || 
      c.name.includes('طفل') ||
      c.name.includes('أطفال')
    );
  }, [categories]);

  // Calculate Baby/Child Expenses
  const babyStats = useMemo(() => {
    if (!babyCategory) return { current: 0, last: 0, pctOfTotal: 0, momChange: 0, momTrending: 'flat' };

    const currentBabyTotal = currentMonthExpenses
      .filter(e => e.categoryId === babyCategory.id)
      .reduce((sum, e) => sum + e.amount, 0);

    const lastBabyTotal = previousMonthExpenses
      .filter(e => e.categoryId === babyCategory.id)
      .reduce((sum, e) => sum + e.amount, 0);

    const totalCurrentExpenses = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const pctOfTotal = totalCurrentExpenses > 0 ? (currentBabyTotal / totalCurrentExpenses) * 100 : 0;

    let momChange = 0;
    let momTrending: 'up' | 'down' | 'flat' = 'flat';

    if (lastBabyTotal > 0) {
      momChange = ((currentBabyTotal - lastBabyTotal) / lastBabyTotal) * 100;
      if (momChange > 1) momTrending = 'up';
      else if (momChange < -1) momTrending = 'down';
    } else if (currentBabyTotal > 0) {
      momChange = 100;
      momTrending = 'up';
    }

    return {
      current: currentBabyTotal,
      last: lastBabyTotal,
      pctOfTotal,
      momChange,
      momTrending
    };
  }, [currentMonthExpenses, previousMonthExpenses, babyCategory]);

  // Calculate Need vs Want analysis
  const budgetingStats = useMemo(() => {
    let needsTotal = 0;
    let wantsTotal = 0;
    let savingsTotal = 0;

    currentMonthExpenses.forEach(e => {
      const cat = categories.find(c => c.id === e.categoryId);
      if (!cat) {
        needsTotal += e.amount;
        return;
      }
      if (cat.type === 'need') {
        needsTotal += e.amount;
      } else if (cat.type === 'want') {
        wantsTotal += e.amount;
      } else if (cat.type === 'saving') {
        savingsTotal += e.amount;
      } else {
        // Safe fallbacks matching name keywords
        const lowerName = cat.name.toLowerCase();
        if (
          lowerName.includes('ترفيه') || 
          lowerName.includes('تسلية') || 
          lowerName.includes('شراءات') || 
          lowerName.includes('كماليات') || 
          lowerName.includes('فسحة') ||
          lowerName.includes('luxury') ||
          lowerName.includes('want')
        ) {
          wantsTotal += e.amount;
        } else {
          needsTotal += e.amount;
        }
      }
    });

    // Net actual savings calculated from overall income subtracting expenses plus saving assets
    const thisMonthIncome = income
      .filter(i => !i.isTransfer && i.date && i.date.startsWith(currentMonthStr))
      .reduce((sum, i) => sum + i.amount, 0);

    const calculatedSavings = Math.max(0, thisMonthIncome - currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0));
    const activeSavings = calculatedSavings + savingsTotal;

    const totalAllocated = needsTotal + wantsTotal + activeSavings;
    
    return {
      needs: needsTotal,
      wants: wantsTotal,
      savings: activeSavings,
      needsPct: totalAllocated > 0 ? (needsTotal / totalAllocated) * 100 : 0,
      wantsPct: totalAllocated > 0 ? (wantsTotal / totalAllocated) * 100 : 0,
      savingsPct: totalAllocated > 0 ? (activeSavings / totalAllocated) * 100 : 0,
      total: totalAllocated
    };
  }, [currentMonthExpenses, income, categories, currentMonthStr]);

  // Chart data for 50/30/20 Comparison
  const needWantChartData = useMemo(() => {
    return [
      {
        name: 'الاحتياجات الضرورية (50%)',
        'الفعلي': Math.round(budgetingStats.needsPct),
        'الموصى به': 50,
        amount: budgetingStats.needs,
        color: '#f43f5e',
        bgColor: 'rgba(244, 63, 94, 0.1)'
      },
      {
        name: 'الرغبات والكماليات (30%)',
        'الفعلي': Math.round(budgetingStats.wantsPct),
        'الموصى به': 30,
        amount: budgetingStats.wants,
        color: '#f59e0b',
        bgColor: 'rgba(245, 158, 11, 0.1)'
      },
      {
        name: 'الادخار والتأمين (20%)',
        'الفعلي': Math.round(budgetingStats.savingsPct),
        'الموصى به': 20,
        amount: budgetingStats.savings,
        color: '#10b981',
        bgColor: 'rgba(16, 185, 129, 0.1)'
      }
    ];
  }, [budgetingStats]);

  // Family Sub-budgets lists
  const familySubBudgets = useMemo(() => {
    return categories
      .map(cat => {
        const budgeted = Number(categoryBudgets[cat.id]) || 0;
        const spent = currentMonthExpenses
          .filter(e => e.categoryId === cat.id)
          .reduce((sum, e) => sum + e.amount, 0);
        const percentage = budgeted > 0 ? Math.min(100, (spent / budgeted) * 100) : 0;
        
        const isBaby = cat.id === '2' || 
                       cat.name === 'لوازم ومصروف الرضيع' || 
                       cat.name.toLowerCase().includes('baby') || 
                       cat.name.includes('رضيع') || 
                       cat.name.includes('أطفال');
        
        return {
          id: cat.id,
          name: cat.name,
          budgeted,
          spent,
          percentage,
          isBaby,
          color: cat.color
        };
      })
      .filter(item => item.budgeted > 0)
      .sort((a, b) => {
        if (a.isBaby && !b.isBaby) return -1;
        if (!a.isBaby && b.isBaby) return 1;
        return b.budgeted - a.budgeted;
      });
  }, [categories, categoryBudgets, currentMonthExpenses]);

  // Stagger Animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  const renderTabSwitcher = () => (
    <div className="w-full max-w-4xl mx-auto mb-6">
      <div className="bg-slate-100 dark:bg-slate-900/60 p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between gap-1" dir="rtl">
        <button
          onClick={() => { hapticFeedback('light'); setActiveTab('report'); }}
          className={cn(
            "flex-1 py-3 text-center rounded-xl text-xs font-black transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer",
            activeTab === 'report'
              ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-md font-bold scale-[1.02]"
              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          )}
        >
          <Baby size={15} />
          <span>التقارير المعيشية 👶</span>
        </button>
        <button
          onClick={() => { hapticFeedback('light'); setActiveTab('baby'); }}
          className={cn(
            "flex-1 py-3 text-center rounded-xl text-xs font-black transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer",
            activeTab === 'baby'
              ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-md font-bold scale-[1.02]"
              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          )}
        >
          <span className="text-sm">🍼</span>
          <span>ميزانية الرضيع يحيى</span>
        </button>
      </div>
    </div>
  );

  if (activeTab === 'baby') {
    return (
      <div className="space-y-6 p-4 pb-32 text-right">
        {renderTabSwitcher()}
        <PageHeader 
          title="ميزانية الرضيع يحيى" 
          subtitle="مراقبة مخصصة للحفاضات، الحليب، الرعاية ومستلزمات العناية بطفلك" 
        />
        <BabyBudget />
      </div>
    );
  }

  // Render welcome EmptyState if we have less than 7 days of transactions
  if (hasUnder7Days) {
    return (
      <div className="space-y-6 p-4 pb-32 text-right">
        {renderTabSwitcher()}
        <PageHeader 
          title="تفريرة العيلة" 
          subtitle="تقرير معيشي ومتابعة ميزانية عائلتك لموازنة الاحتياجات وحماية رضيعك" 
        />
        
        {/* Personalized Family Profile Widget */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-4xl mx-auto p-5 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 dark:border-emerald-500/10 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm relative overflow-hidden mb-6"
          dir="rtl"
        >
          <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-4 text-right">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <Heart className="size-8 animate-pulse text-rose-500" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                <span>عائلة حسن الرياحي وسهير 🏡💖</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-450 font-bold mt-1 leading-relaxed">
                برفقة ابنهما الرضيع <span className="text-emerald-600 dark:text-emerald-400 font-black underline decoration-emerald-500/45">يحيى</span> البالغ من العمر <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-extrabold">شهراً واحداً</span> 👶🍼
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-2.5 rounded-2xl shrink-0">
            <div className="text-right">
              <p className="text-[9px] font-black text-slate-400">حالة دورة الميزانية 📊</p>
              <p className="text-xs font-extrabold text-slate-700 dark:text-slate-300 mt-0.5">قفة تونسية آمنة وصحية ✅</p>
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card border-dashed border-emerald-500/30 bg-emerald-500/5 max-w-2xl mx-auto p-8 text-center space-y-6"
        >
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/30 rounded-full flex items-center justify-center text-emerald-500 mx-auto animate-bounce">
            <Baby size={40} />
          </div>
          <div className="space-y-3">
            <h2 className="text-xl font-black text-slate-800 dark:text-white">مرحباً بكل عائلة ملتزمة! 👋</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              لحساب مؤشرات مصاريف العائلة التونسية بدقة وتثبيت بطاقة "الأساسيات مقابل الكماليات"، يحتاج التطبيق إلى تسجيل نفقات موزعة على <strong>7 أيام مختلفة على الأقل</strong>.
            </p>
            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs text-slate-400 font-semibold space-y-1">
              <span className="text-emerald-500">💡 فكرة ذكية لعائلتك:</span>
              <p>ابدأ بإنشاء موازنة فرعية مخصصة للحليم وحفاظات الرضيع (الكوش) أو قفة عيش العبار لملء الدفتر وتحسين التقرير.</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link 
              to="/transactions"
              onClick={() => hapticFeedback('medium')}
              className="btn-primary"
            >
              <ShoppingBag size={15} />
              <span>تسجيل النفقات لملء الدفتر</span>
            </Link>
            <Link 
              to="/budget"
              onClick={() => hapticFeedback('light')}
              className="btn-secondary"
            >
              <span>ضبط الموازنات الفرعية</span>
              <ChevronLeft size={15} />
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 pb-32 text-right">
      {renderTabSwitcher()}
      <PageHeader 
        title="تفريرة العيلة" 
        subtitle="متابعة مالية ومعيشية منسقة للتحكم بقفة الشهر وسقف مصاريف الرضيع" 
      />

      {/* Personalized Family Profile Widget */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl mx-auto p-5 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 dark:border-emerald-500/10 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm relative overflow-hidden"
        dir="rtl"
      >
        <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center gap-4 text-right">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <Heart className="size-8 animate-pulse text-rose-500" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
              <span>عائلة حسن الرياحي وسهير 🏡💖</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-450 font-bold mt-1 leading-relaxed">
              برفقة ابنهما الرضيع <span className="text-emerald-600 dark:text-emerald-400 font-black underline decoration-emerald-500/45">يحيى</span> البالغ من العمر <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-extrabold">شهراً واحداً</span> 👶🍼
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-2.5 rounded-2xl shrink-0">
          <div className="text-right">
            <p className="text-[9px] font-black text-slate-400">حالة دورة الميزانية 📊</p>
            <p className="text-xs font-extrabold text-slate-700 dark:text-slate-300 mt-0.5">قفة تونسية آمنة وصحية ✅</p>
          </div>
        </div>
      </motion.div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 lg:grid-cols-12 gap-6"
      >
        
        {/* CARD 1: Essentials vs Luxuries (Needs vs Wants) */}
        <motion.div variants={itemVariants} className="lg:col-span-8 flex flex-col space-y-6">
          <Card className="relative overflow-hidden flex-1 flex flex-col justify-between">
            {/* Ambient Background Glow */}
            <div className="absolute left-0 top-0 -ml-20 -mt-20 w-64 h-64 bg-indigo-500/5 dark:bg-indigo-400/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="space-y-1 pb-4 border-b border-slate-100 dark:border-slate-800/60 flex justify-between items-start">
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                  <Activity size={18} className="text-rose-500" />
                  <span>الأساسيات والاحتياجات مقابل الكماليات (قاعدة 50/30/20)</span>
                </h3>
                <p className="text-[10px] text-slate-400 font-bold">يقارن هذا التحليل نفقاتك الكلية موزعة حسب طبيعة كل فئة بالتواؤم مع السقف المثالي لعائلتك</p>
              </div>
              <span className="p-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-150 text-[10px] text-slate-400 font-black">
                دورة {format(new Date(), 'MMMM yyyy', { locale: ar })}
              </span>
            </div>

            {/* Graphics and breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 py-6 items-center">
              
              {/* Detailed Horizontal comparison charts */}
              <div className="md:col-span-7 h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={needWantChartData}
                    layout="vertical"
                    margin={{ top: 5, right: 10, left: -25, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" opacity={0.2} />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 'bold', fill: '#94a3b8' }} unit="%" />
                    <YAxis
                      dataKey="name"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      orientation="right"
                      tick={{ fontSize: 9, fontWeight: 'black', fill: '#475569' }}
                      width={130}
                    />
                    <RechartsTooltip
                      cursor={{ fill: '#f1f5f9', opacity: 0.1 }}
                      contentStyle={{ borderRadius: '14px', background: '#0f172a', border: '1px solid #1e293b', direction: 'rtl' }}
                      itemStyle={{ color: '#fff', fontSize: '10px' }}
                      labelStyle={{ color: '#94a3b8', fontSize: '9px', fontWeight: 'bold', textAlign: 'right' }}
                      formatter={(value: any, name: any) => [`${value}%`, name]}
                    />
                    <RechartsLegend verticalAlign="top" height={36} iconType="circle" iconSize={6} wrapperStyle={{ fontSize: '9px', fontWeight: 'bold' }} />
                    <Bar dataKey="الفعلي" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={10} />
                    <Bar dataKey="الموصى به" fill="#e2e8f0" radius={[0, 4, 4, 0]} barSize={10} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Stat Boxes */}
              <div className="md:col-span-5 space-y-3.5 pr-2">
                {needWantChartData.map((item, index) => (
                  <div key={index} className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-1.5 flex items-center justify-between">
                    <div className="space-y-0.5 text-right">
                      <span className="flex items-center gap-1.5 justify-end">
                        <span className="text-xs font-black text-slate-800 dark:text-white">{item.name.split(' ')[0]}</span>
                        <span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
                      </span>
                      <p className="text-[10px] text-slate-400 font-bold">الحصة الفعلية: <span className="font-mono text-slate-700 dark:text-slate-300 font-extrabold">{item.الفعلي}%</span></p>
                    </div>
                    <div className="text-left font-mono">
                      <p className="text-xs font-black text-slate-700 dark:text-slate-200">{formatCurrency(item.amount, currency)}</p>
                      <span className="text-[8px] font-bold text-slate-400">توصية: {item['الموصى به']}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Health Checklist or advice widget */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-500 shrink-0">
                <ShieldCheck size={16} />
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                {budgetingStats.needsPct > 55 ? (
                  <span>تشهد نفقات <strong>الاحتياجات الضرورية</strong> ارتفاعاً نسبياً ({Math.round(budgetingStats.needsPct)}%). نوصي بتقنين تكاليف التنقل وفواتير المنزل لزيادة الوعاء الادخاري لرضيعك.</span>
                ) : (
                  <span>مبروك! قفة العائلة ونفقات الاحتياجات الضرورية تعمل في حدود <strong>بر الأمان الصحي</strong> وهو ما يسمح بتغذية صندوق الرضيع بأريحية مريحة.</span>
                )}
              </p>
            </div>
          </Card>
        </motion.div>

        {/* CARD 2: Baby/Child Expenses (قرة عيني) */}
        <motion.div variants={itemVariants} className="lg:col-span-4 flex flex-col">
          <Card className="border-primary-500/20 bg-gradient-to-br from-emerald-50/20 to-white dark:from-emerald-950/10 dark:to-slate-900 border relative overflow-hidden flex-1 flex flex-col justify-between p-6">
            {/* Sparkle effects */}
            <div className="absolute right-0 top-0 -mr-12 -mt-12 w-48 h-48 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="space-y-1 pb-4 border-b border-emerald-500/10 flex items-center gap-3 justify-end">
              <div className="text-right">
                <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-1.5 justify-end">
                  <span>مصاريف البيبي (قرة عيني)</span>
                  <Baby size={18} className="text-emerald-500" />
                </h3>
                <p className="text-[9px] text-slate-400 font-bold">مصاريف لوازم، حفاظات، تلقيح، وحليب الرضيع</p>
              </div>
            </div>

            <div className="py-6 text-center space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">مجموع النفقات للشهر الحالي</p>
                <h2 className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">
                  {formatCurrency(babyStats.current, currency)}
                </h2>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-slate-950/40 rounded-full border border-emerald-100 dark:border-emerald-900/60 mt-2">
                  <span className="text-[10px] font-semibold text-slate-500">تمثل <span className="font-bold text-emerald-600 dark:text-emerald-400">{Math.round(babyStats.pctOfTotal)}%</span> من إجمالي المصاريف</span>
                </div>
              </div>

              {/* Month-over-Month Comparison */}
              <div className="p-4 bg-white/60 dark:bg-slate-950/20 rounded-2xl border border-slate-100 dark:border-emerald-950/20 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400">مقارنة مع الشهر الماضي (MoM)</span>
                
                {babyStats.last > 0 ? (
                  <div className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold ${
                    babyStats.momTrending === 'up' 
                      ? 'bg-rose-50 text-rose-500 border border-rose-100' 
                      : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                  }`}>
                    {babyStats.momTrending === 'up' ? (
                      <>
                        <TrendingUp size={12} />
                        <span>منحنى صاعد (+{Math.round(babyStats.momChange)}%)</span>
                      </>
                    ) : (
                      <>
                        <TrendingDown size={12} />
                        <span>منحنى هابط ({Math.round(babyStats.momChange)}%)</span>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-[10px] font-black text-slate-400 bg-slate-50 dark:bg-slate-900 px-2.5 py-1 rounded-xl">
                    لا تتوفر بيانات سابقة
                  </div>
                )}
              </div>
            </div>

            {/* Micro details */}
            <div className="pt-4 border-t border-emerald-550/10 text-right space-y-1">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">الشهر المنقضي (مرجعي)</span>
              <p className="text-xs font-black text-slate-700 dark:text-slate-300">
                {babyStats.last > 0 ? formatCurrency(babyStats.last, currency) : 'لم يتم تسجيل أي نفقات الشهر الماضي.'}
              </p>
            </div>
          </Card>
        </motion.div>

        {/* CARD 3: Family Sub-Budgets (الميزانيات الفرعية الذكية) */}
        <motion.div variants={itemVariants} className="lg:col-span-12">
          <Card className="p-6 md:p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-100 dark:border-slate-800/60 pb-4 gap-4">
              <div>
                <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-indigo-500 animate-pulse" />
                  <span>الميزانيات الفرعية الذكية وتتبع استهلاك الأسرة</span>
                </h3>
                <p className="text-[10px] text-slate-300 font-semibold mt-0.5">تتبع سقف إنفاقك لكل فئة محددة، مع تمييز فئات الأطفال والرضيع بقوة</p>
              </div>
              <Link 
                to="/budget"
                onClick={() => hapticFeedback('light')}
                className="btn-ghost flex items-center gap-1 px-3 py-1 bg-slate-50 dark:bg-slate-800 text-xs font-black rounded-lg hover:text-emerald-500"
              >
                <span>تعديل الميزانيات</span>
                <ChevronLeft size={14} className="rotate-0" />
              </Link>
            </div>

            {familySubBudgets.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {familySubBudgets.map((sub, idx) => (
                  <div 
                    key={idx}
                    className={`p-4 rounded-2xl border transition-all relative ${
                      sub.isBaby 
                        ? 'bg-emerald-500/5 border-emerald-500/20 ring-1 ring-emerald-550/10' 
                        : 'bg-slate-50/40 border-slate-100 dark:bg-slate-900/30 dark:border-slate-800'
                    }`}
                  >
                    {sub.isBaby && (
                      <span className="absolute -top-2 left-4 px-2.5 py-0.5 bg-emerald-500 text-white rounded-full text-[8px] font-black tracking-widest flex items-center gap-1 shadow-sm">
                        <Sparkles size={8} className="animate-spin" />
                        عناية فائقة لعائلتك
                      </span>
                    )}

                    <div className="flex justify-between items-start mb-3">
                      <div className="text-left font-mono">
                        <span className="text-xs font-semibold text-slate-400">الموازنة:</span>
                        <p className="text-xs font-black text-slate-800 dark:text-slate-200">{formatCurrency(sub.budgeted, currency)}</p>
                      </div>
                      <div className="text-right">
                        <h4 className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5 justify-end">
                          <span>{sub.name}</span>
                          <span className="size-2 rounded-full" style={{ backgroundColor: sub.color }} />
                        </h4>
                        <span className="text-[10px] text-slate-400 font-bold block mt-0.5">صُرِفَ: {formatCurrency(sub.spent, currency)}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1 pt-1">
                      <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden relative">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${sub.percentage}%` }}
                          transition={{ duration: 0.6 }}
                          className={`h-full rounded-full transition-all ${
                            sub.percentage >= 100 
                              ? 'bg-rose-500' 
                              : sub.isBaby 
                                ? 'bg-emerald-500' 
                                : 'bg-indigo-500'
                          }`}
                        />
                      </div>
                      <div className="flex justify-between text-[8px] font-black">
                        <span className={sub.percentage >= 100 ? 'text-rose-500' : 'text-slate-400'}>
                          {sub.percentage >= 100 ? 'تجاوزت الحد!' : `${Math.round(sub.percentage)}% مستهلك`}
                        </span>
                        <span className="text-slate-400 font-mono">الخزينة المتبقية: {formatCurrency(Math.max(0, sub.budgeted - sub.spent), currency)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center space-y-2">
                <AlertCircle size={32} className="text-slate-400 mx-auto" />
                <p className="text-xs font-black text-slate-500">لم تقم بتعيين موازنات فرعية للفئات بعد.</p>
                <p className="text-[10px] text-slate-400">اذهب لصفحة الموازنة وقم بتوزيع جزء من الميزانية الإجمالية على الفئات الأساسية لإثراء تقارير عائلتك.</p>
              </div>
            )}
          </Card>
        </motion.div>

      </motion.div>
    </div>
  );
};

export default FamilyReport;
