import React, { useMemo, useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { formatCurrency, hapticFeedback, getBudgetRange, getBudgetMonth, cn } from '../utils';
import { parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PiggyBank, TrendingUp, Sparkles, Percent, Baby, 
  UtensilsCrossed, House, HeartPulse, Lightbulb, 
  ShieldCheck, AlertTriangle, ArrowRight, Sliders, Info, 
  Coins, Calculator, CheckCircle2, Gauge, Flame, Target, 
  Wallet, RefreshCw, Zap, ShieldAlert, ArrowUpRight
} from 'lucide-react';
import { ResponsiveContainer, RadialBarChart, RadialBar } from 'recharts';
import { Link } from 'react-router-dom';
import { calculateDetailedHealthReport } from '../utils/healthCalculator';

const SavingsIndicators = () => {
  const { 
    income, 
    expenses, 
    categories, 
    currency, 
    firstDayOfMonth, 
    budgets, 
    accounts, 
    goals, 
    recurringExpenses 
  } = useAppContext();

  // 1. Simulation states
  const [foodSavingPct, setFoodSavingPct] = useState(15);
  const [babySavingPct, setBabySavingPct] = useState(10);
  const [leisureSavingPct, setLeisureSavingPct] = useState(25);

  // 2. Fetch current budget month based on first day of month setting
  const currentMonth = useMemo(() => getBudgetMonth(new Date(), firstDayOfMonth), [firstDayOfMonth]);

  // 3. Compute Comprehensive Health Report
  const healthReport = useMemo(() => {
    return calculateDetailedHealthReport({
      income,
      expenses,
      budgets,
      accounts,
      categories,
      goals,
      recurringExpenses,
      currentMonth,
      firstDayOfMonth,
      currency
    });
  }, [income, expenses, budgets, accounts, categories, goals, recurringExpenses, currentMonth, firstDayOfMonth, currency]);

  // Extract category expenses for simulation
  const { start: monthStart, end: monthEnd } = useMemo(() => getBudgetRange(currentMonth, firstDayOfMonth), [currentMonth, firstDayOfMonth]);
  
  const categoryExpenses = useMemo(() => {
    return expenses
      .filter(e => {
        if (e.isTransfer) return false;
        const d = parseISO(e.date);
        return d >= monthStart && d <= monthEnd;
      })
      .reduce((acc, e) => {
        acc[e.categoryId] = (acc[e.categoryId] || 0) + e.amount;
        return acc;
      }, {} as Record<string, number>);
  }, [expenses, monthStart, monthEnd]);

  const categoriesList = categories || [];
  const foodCategory = categoriesList.find(c => c.name.includes('سوق') || c.name.includes('قفة') || c.id === '1');
  const babyCategory = categoriesList.find(c => c.name.includes('رضيع') || c.name.includes('بيبي') || c.id === '2');
  const leisureCategory = categoriesList.find(c => c.name.includes('مقهى') || c.name.includes('ترفيه') || c.type === 'want' || c.id === '6');

  const foodExpense = foodCategory ? (categoryExpenses[foodCategory.id] || 0) : 0;
  const babyExpense = babyCategory ? (categoryExpenses[babyCategory.id] || 0) : 0;
  const leisureExpense = leisureCategory ? (categoryExpenses[leisureCategory.id] || 0) : 0;

  // Simulator totals
  const simulatedSavedFood = (foodExpense * foodSavingPct) / 100;
  const simulatedSavedBaby = (babyExpense * babySavingPct) / 100;
  const simulatedSavedLeisure = (leisureExpense * leisureSavingPct) / 100;
  
  const simulatedExtraSavings = simulatedSavedFood + simulatedSavedBaby + simulatedSavedLeisure;
  const simulatedTotalSavings = healthReport.actualSavings + simulatedExtraSavings;
  const simulatedSavingRate = healthReport.totalIncome > 0 ? (simulatedTotalSavings / healthReport.totalIncome) * 100 : 0;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 }
  };

  // Radial chart data
  const radialData = [
    {
      name: 'مؤشر الصحة المالية',
      value: healthReport.score,
      fill: healthReport.score >= 85 ? '#059669' : healthReport.score >= 70 ? '#2563eb' : healthReport.score >= 50 ? '#d97706' : '#e11d48',
    }
  ];

  const handleSliderChange = (type: string, val: number) => {
    hapticFeedback('light');
    if (type === 'food') setFoodSavingPct(val);
    if (type === 'baby') setBabySavingPct(val);
    if (type === 'leisure') setLeisureSavingPct(val);
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 pb-20 w-full max-w-full px-2 font-tajawal"
      dir="rtl"
    >
      {/* 1. Header & Title Zone */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-5 md:p-6 rounded-3xl shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>مؤشر الصحة المالية ومستشار التوفير</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
                  SMART AI
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                تحليل علمي شامل لمدى متانة ميزانيتك، صندوق الطوارئ، وتوصيات ادخار مخصصة
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <div className="bg-slate-100 dark:bg-slate-800/80 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
            الدورة المالية: <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{currentMonth}</span>
          </div>
          <Link
            to="/budget"
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
          >
            <span>ضبط الميزانية</span>
            <ArrowRight size={13} className="rotate-180" />
          </Link>
        </div>
      </div>

      {healthReport.totalIncome === 0 ? (
        <motion.div 
          variants={itemVariants}
          className="bg-amber-500/5 border border-amber-500/20 rounded-3xl p-8 text-center space-y-4"
        >
          <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 mx-auto">
            <AlertTriangle size={32} />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">لم نجد أي مدخول مسجل لهذا الشهر!</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              لحساب مؤشر الصحة المالية بدقة وتقديم توصيات ادخار ملائمة لدخلك، يرجى تسجيل مصادر الدخل أولاً.
            </p>
          </div>
          <div>
            <Link 
              to="/income" 
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs inline-flex items-center gap-2 shadow-md shadow-emerald-600/20"
            >
              <span>تسجيل الدخل الشهري</span>
              <ArrowRight size={14} className="rotate-180" />
            </Link>
          </div>
        </motion.div>
      ) : (
        <>
          {/* 2. Top Banner: Big Health Score Card & Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Left: Overall Health Score Gauge Card */}
            <motion.div 
              variants={itemVariants} 
              className={cn(
                "p-6 rounded-3xl border shadow-xs flex flex-col justify-between space-y-4 text-center md:text-right relative overflow-hidden",
                healthReport.gradeBg,
                healthReport.gradeBorder
              )}
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/5">
                  <span className="text-xs font-black text-slate-500 dark:text-slate-400">مؤشر الصحة المالية الإجمالي</span>
                  <span className={cn(
                    "text-xs font-black px-2.5 py-0.5 rounded-full border",
                    healthReport.gradeColor,
                    "bg-white/80 dark:bg-slate-900/80"
                  )}>
                    {healthReport.grade}
                  </span>
                </div>

                <div className="h-44 w-full flex items-center justify-center relative my-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart 
                      cx="50%" 
                      cy="50%" 
                      innerRadius="65%" 
                      outerRadius="100%" 
                      barSize={14} 
                      data={radialData} 
                      startAngle={180} 
                      endAngle={-180}
                    >
                      <RadialBar
                        background
                        dataKey="value"
                        cornerRadius={14}
                      />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
                      {healthReport.score}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">من 100 نقطة</span>
                  </div>
                </div>

                <p className="text-xs font-bold leading-relaxed text-slate-700 dark:text-slate-300">
                  {healthReport.gradeDescription}
                </p>
              </div>

              <div className="pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[11px] font-bold text-slate-500">
                <span>السيولة المتاحة:</span>
                <span className="font-mono text-slate-900 dark:text-white font-black">
                  {formatCurrency(healthReport.totalLiquidBalance, currency)}
                </span>
              </div>
            </motion.div>

            {/* Right: Cash Flow Snapshot */}
            <motion.div 
              variants={itemVariants} 
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-6 rounded-3xl shadow-xs md:col-span-2 flex flex-col justify-between space-y-5"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins className="text-emerald-500 size-5" />
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">ملخص التدفق النقدي الشهري</h3>
                  </div>
                  <span className="text-xs font-bold text-slate-400 font-mono">
                    {healthReport.savingsRate.toFixed(1)}% نسبة الادخار
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200/60 dark:border-emerald-900/30">
                    <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mb-1">إجمالي المداخيل</p>
                    <p className="text-base md:text-lg font-black text-slate-900 dark:text-white font-mono">
                      {formatCurrency(healthReport.totalIncome, currency)}
                    </p>
                  </div>

                  <div className="p-4 bg-rose-50/50 dark:bg-rose-950/20 rounded-2xl border border-rose-200/60 dark:border-rose-900/30">
                    <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 mb-1">إجمالي المصاريف</p>
                    <p className="text-base md:text-lg font-black text-slate-900 dark:text-white font-mono">
                      {formatCurrency(healthReport.totalExpense, currency)}
                    </p>
                  </div>

                  <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-2xl border border-blue-200/60 dark:border-blue-900/30 col-span-2 md:col-span-1">
                    <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mb-1">الفائض المدخّر الفعلي</p>
                    <p className="text-base md:text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                      {formatCurrency(healthReport.actualSavings, currency)}
                    </p>
                  </div>
                </div>

                {/* 50/30/20 Visual Bar */}
                <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-600 dark:text-slate-300">
                    <span>توزيع الصرف الفعلي (ضروريات / كماليات / ادخار):</span>
                    <span className="font-mono text-[11px] text-slate-400">قاعدة 50/30/20</span>
                  </div>

                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
                    <div 
                      className="bg-rose-500 h-full transition-all" 
                      style={{ width: `${Math.min(100, healthReport.needsVsWants.needsPct)}%` }}
                      title={`الضروريات: ${healthReport.needsVsWants.needsPct.toFixed(0)}%`}
                    />
                    <div 
                      className="bg-amber-500 h-full transition-all" 
                      style={{ width: `${Math.min(100, healthReport.needsVsWants.wantsPct)}%` }}
                      title={`الكماليات: ${healthReport.needsVsWants.wantsPct.toFixed(0)}%`}
                    />
                    <div 
                      className="bg-emerald-500 h-full transition-all" 
                      style={{ width: `${Math.min(100, healthReport.needsVsWants.savingsPct)}%` }}
                      title={`الادخار: ${healthReport.needsVsWants.savingsPct.toFixed(0)}%`}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[10px] font-bold pt-1">
                    <span className="text-rose-500 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      ضروريات: {healthReport.needsVsWants.needsPct.toFixed(0)}%
                    </span>
                    <span className="text-amber-500 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      كماليات: {healthReport.needsVsWants.wantsPct.toFixed(0)}%
                    </span>
                    <span className="text-emerald-500 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      ادخار: {healthReport.needsVsWants.savingsPct.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Safety Shield Advisory */}
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
                <span>احتياطي الطوارئ الحالي يغطي <strong>{healthReport.emergencyRunwayMonths.toFixed(1)} شهر</strong> من نفقات العائلة المعتادة.</span>
              </div>
            </motion.div>
          </div>

          {/* 3. The 4 Health Pillars Deep Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Gauge className="text-emerald-500 size-4" />
              <h2 className="text-sm font-black text-slate-900 dark:text-white">محاور تقييم الصحة المالية الأربعة</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(healthReport.pillars).map(([key, pillar]) => {
                const isPillarExcellent = pillar.status === 'excellent';
                const isPillarGood = pillar.status === 'good';
                const isPillarWarning = pillar.status === 'warning';

                return (
                  <motion.div
                    key={key}
                    variants={itemVariants}
                    className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-3xl shadow-xs flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400">{pillar.benchmark}</span>
                        <span className={cn(
                          "text-[10px] font-black px-2 py-0.5 rounded-full",
                          isPillarExcellent ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300" :
                          isPillarGood ? "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300" :
                          isPillarWarning ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300" :
                          "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                        )}>
                          {pillar.score} / {pillar.maxScore} نقطة
                        </span>
                      </div>

                      <h4 className="text-xs font-black text-slate-900 dark:text-white">{pillar.title}</h4>
                      <div className="text-base font-black font-mono text-slate-900 dark:text-white">
                        {pillar.displayValue}
                      </div>

                      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            isPillarExcellent ? "bg-emerald-500" :
                            isPillarGood ? "bg-blue-500" :
                            isPillarWarning ? "bg-amber-500" : "bg-rose-500"
                          )}
                          style={{ width: `${pillar.percentage}%` }}
                        />
                      </div>
                    </div>

                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-2.5">
                      {pillar.feedback}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* 4. Actionable Savings Recommendations */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Sparkles className="text-amber-500 size-4" />
                <h2 className="text-sm font-black text-slate-900 dark:text-white">خطة التوصيات الإجرائية المباشرة لتطوير التوفير</h2>
              </div>
              <span className="text-[11px] font-bold text-slate-400">توصيات مخصصة لعائلتك</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {healthReport.recommendations.map((rec) => (
                <motion.div
                  key={rec.id}
                  variants={itemVariants}
                  className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-3xl shadow-xs flex flex-col justify-between space-y-4 hover:border-emerald-300 dark:hover:border-emerald-800 transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn(
                        "text-[10px] font-black px-2.5 py-0.5 rounded-full border",
                        rec.priority === 'high' ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200" :
                        "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200"
                      )}>
                        {rec.priority === 'high' ? 'أولوية قصوى ⚡' : 'أولوية متوسطة 💡'}
                      </span>
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        {rec.impact}
                      </span>
                    </div>

                    <h3 className="text-sm font-black text-slate-900 dark:text-white">{rec.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                      {rec.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <Link
                      to={rec.actionLink}
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-emerald-600 hover:text-white dark:bg-slate-800 dark:hover:bg-emerald-600 text-slate-800 dark:text-slate-200 text-xs font-black transition-all flex items-center justify-center gap-2 group cursor-pointer"
                    >
                      <span>{rec.actionLabel}</span>
                      <ArrowRight size={13} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* 5. Interactive Savings Simulator */}
          <motion.div 
            variants={itemVariants}
            className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-6 rounded-3xl shadow-xs space-y-5"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Sliders size={12} />
                  <span>محاكي الادخار الفوري والتأثير على الميزانية</span>
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-white">محاكي ترشيد النفقات التفاعلي</h3>
                <p className="text-xs text-slate-400 font-medium">
                  جرّب تحريك المؤشرات لترى مقدار الفائض التقديري الذي ستكسبه عائلتك شهرياً
                </p>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-950/40 px-4 py-3 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 text-right">
                <p className="text-[10px] font-bold text-slate-400">الوفر الإضافي التقديري شهرياً:</p>
                <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  +{formatCurrency(simulatedExtraSavings, currency)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              {/* Food Simulation */}
              <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-900 dark:text-white flex items-center gap-1.5">
                    <UtensilsCrossed size={14} className="text-rose-500" />
                    <span>قفة السوق والعطارة</span>
                  </span>
                  <span className="font-mono text-emerald-600">{foodSavingPct}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  value={foodSavingPct}
                  onChange={(e) => handleSliderChange('food', Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <p className="text-[10px] text-slate-400 font-bold">
                  يوفر لعائلتكم: <span className="text-emerald-500 font-mono">{formatCurrency(simulatedSavedFood, currency)}</span>
                </p>
              </div>

              {/* Baby Simulation */}
              <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Baby size={14} className="text-cyan-500" />
                    <span>لوازم وحفاضات الرضيع</span>
                  </span>
                  <span className="font-mono text-emerald-600">{babySavingPct}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={babySavingPct}
                  onChange={(e) => handleSliderChange('baby', Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <p className="text-[10px] text-slate-400 font-bold">
                  يوفر لعائلتكم: <span className="text-emerald-500 font-mono">{formatCurrency(simulatedSavedBaby, currency)}</span>
                </p>
              </div>

              {/* Leisure Simulation */}
              <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Sparkles size={14} className="text-amber-500" />
                    <span>المقاهي والكماليات</span>
                  </span>
                  <span className="font-mono text-emerald-600">{leisureSavingPct}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  value={leisureSavingPct}
                  onChange={(e) => handleSliderChange('leisure', Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <p className="text-[10px] text-slate-400 font-bold">
                  يوفر لعائلتكم: <span className="text-emerald-500 font-mono">{formatCurrency(simulatedSavedLeisure, currency)}</span>
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </motion.div>
  );
};

export default SavingsIndicators;
