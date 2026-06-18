import React, { useMemo, useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { formatCurrency, hapticFeedback, getBudgetRange, getBudgetMonth } from '../utils';
import { parseISO } from 'date-fns';
import { motion } from 'motion/react';
import { 
  PiggyBank, TrendingUp, Sparkles, Percent, Baby, 
  UtensilsCrossed, House, HeartPulse, Lightbulb, 
  ShieldCheck, AlertTriangle, ArrowRight, Sliders, Info, Coins, Calculator, CheckCircle2
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, RadialBarChart, RadialBar } from 'recharts';
import { Link } from 'react-router-dom';

const SavingsIndicators = () => {
  const { income, expenses, categories, currency, firstDayOfMonth } = useAppContext();

  // 1. Simulation states
  const [foodSavingPct, setFoodSavingPct] = useState(15); // Default simulated 15% save in groceries
  const [babySavingPct, setBabySavingPct] = useState(10); // Default simulated 10% save in baby items in bulk
  const [leisureSavingPct, setLeisureSavingPct] = useState(25); // Default simulated 25% save in coffee/leisure

  // 2. Fetch current budget month based on first day of month setting
  const currentMonth = useMemo(() => getBudgetMonth(new Date(), firstDayOfMonth), [firstDayOfMonth]);
  const { start: monthStart, end: monthEnd } = useMemo(() => getBudgetRange(currentMonth, firstDayOfMonth), [currentMonth, firstDayOfMonth]);

  // 3. Compute income, expenses and category breakdowns
  const monthlyTotals = useMemo(() => {
    const totalExpense = expenses
      .filter(e => {
        if (e.isTransfer) return false;
        const d = parseISO(e.date);
        return d >= monthStart && d <= monthEnd;
      })
      .reduce((sum, e) => sum + e.amount, 0);

    const totalIncome = income
      .filter(i => {
        if (i.isTransfer) return false;
        const d = parseISO(i.date);
        return d >= monthStart && d <= monthEnd;
      })
      .reduce((sum, i) => sum + i.amount, 0);
    
    // Expenses grouped by Category
    const categoryExpenses = expenses
      .filter(e => {
        if (e.isTransfer) return false;
        const d = parseISO(e.date);
        return d >= monthStart && d <= monthEnd;
      })
      .reduce((acc, e) => {
        acc[e.categoryId] = (acc[e.categoryId] || 0) + e.amount;
        return acc;
      }, {} as Record<string, number>);

    return { totalExpense, totalIncome, categoryExpenses };
  }, [expenses, income, monthStart, monthEnd]);

  const totalIncome = monthlyTotals.totalIncome;
  const totalExpense = monthlyTotals.totalExpense;
  const actualSavings = Math.max(0, totalIncome - totalExpense);
  const savingRate = totalIncome > 0 ? (actualSavings / totalIncome) * 100 : 0;

  // Find the exact category IDs for our Tunisian model
  const categoriesList = useMemo(() => categories || [], [categories]);
  const foodCategory = useMemo(() => categoriesList.find(c => c.name === 'قضية السوق والقفة' || c.id === '1'), [categoriesList]);
  const babyCategory = useMemo(() => categoriesList.find(c => c.name === 'لوازم ومصروف الرضيع' || c.id === '2'), [categoriesList]);
  const housingCategory = useMemo(() => categoriesList.find(c => c.name === 'البيت والفواتير' || c.id === '3'), [categoriesList]);
  const medicalCategory = useMemo(() => categoriesList.find(c => c.name === 'صحة وطبيب الأطفال' || c.id === '5'), [categoriesList]);
  const leisureCategory = useMemo(() => categoriesList.find(c => c.name === 'ترفيه ومقهى ومواسم' || c.id === '6'), [categoriesList]);

  const foodExpense = foodCategory ? (monthlyTotals.categoryExpenses[foodCategory.id] || 0) : 0;
  const babyExpense = babyCategory ? (monthlyTotals.categoryExpenses[babyCategory.id] || 0) : 0;
  const housingExpense = housingCategory ? (monthlyTotals.categoryExpenses[housingCategory.id] || 0) : 0;
  const medicalExpense = medicalCategory ? (monthlyTotals.categoryExpenses[medicalCategory.id] || 0) : 0;
  const leisureExpense = leisureCategory ? (monthlyTotals.categoryExpenses[leisureCategory.id] || 0) : 0;

  // 4. Calculate simulation updates
  const simulatedSavedFood = (foodExpense * foodSavingPct) / 100;
  const simulatedSavedBaby = (babyExpense * babySavingPct) / 100;
  const simulatedSavedLeisure = (leisureExpense * leisureSavingPct) / 100;
  
  const simulatedExtraSavings = simulatedSavedFood + simulatedSavedBaby + simulatedSavedLeisure;
  const simulatedTotalSavings = actualSavings + simulatedExtraSavings;
  const simulatedSavingRate = totalIncome > 0 ? (simulatedTotalSavings / totalIncome) * 100 : 0;

  // Determine Savings Health Category
  const savingsGrade = useMemo(() => {
    if (totalIncome === 0) return { title: 'قيد الانتظار', color: 'text-slate-500 bg-slate-100 dark:bg-slate-900', desc: 'يرجى إدخال البيانات ومصادر الدخل الشهرية لبدء التحليل.' };
    if (savingRate <= 0) return { title: 'مرحلة الخطر (استهلاك كلي ومكشوف)', color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30', desc: 'كامل المدخول يذهب في النفقات الاستهلاكية الحالية دون ترك أي هامش أمان لمستقبل الطفل وطوارئ الصحة.' };
    if (savingRate < 10) return { title: 'معدل هش غير كافٍ', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30', desc: 'ادخاركم أقل من 10%. بوجود رضيع صغير، تعتبر هذه النسبة حساسة حيث إن أي طارئ صحي مفاجئ للبيبي قد يخل بالتوازن المالي بالكامل.' };
    if (savingRate <= 22) return { title: 'موقع آمن ومتوازن', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-950/30', desc: 'رائع جداً! ميزانيتكم متوازنة وصحية وضمن أفضل المعدلات التونسية الملائمة لأسرة في حداثة عهدها، وتكفي لتكوين درع أمان محترم.' };
    return { title: 'امتياز واستقرار مالي رفيع', color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/30', desc: 'نسبة ادخار تتجاوز 22%! قدرة مذهلة على ترشيد الإنفاق وإحكام السيطرة المالية. ينصح بالبدء فوراً بفتح حساب توفير طويل المدى للرضيع.' };
  }, [savingRate, totalIncome]);

  // Generate recommendations based on the actual spending distribution
  const diagnostics = useMemo(() => {
    const list = [];
    if (totalIncome === 0) return [];

    // Food diagnostic
    if (foodExpense > 0) {
      const pct = (foodExpense / totalIncome) * 100;
      if (pct > 30) {
        list.push({
          icon: UtensilsCrossed,
          title: 'تكلفة قفة الطعام مرتفعة جداً',
          assessment: `تلتهم القفة وحاجيات الأكل حوالي ${pct.toFixed(0)}% من مجمل مدخولكم الشهري. الشراء اليومي من المغازات ومحلات العطارة يزيد من المصاريف الجانبية.`,
          action: 'تخصيص تسوق أسبوعي جماعي من "السوق الأسبوعي" الشعبي لشراء الخضراوات واللحوم والأسماك دفعة واحدة، يقلص الكلفة برمتها بنسبة 20%.'
        });
      } else {
        list.push({
          icon: UtensilsCrossed,
          title: 'استهلاك قفة عقلاني',
          assessment: `تمثل قفة عيش الأسرة ${pct.toFixed(0)}% من الدخل وهو مؤشر ممتاز على التحكم في ميزانية الطعام والاعتماد على الطبخ المنزلي.`,
          action: 'واصلوا هذا التوازن واعتمدوا على إعداد قائمات الوجبات الأسبوعية مسبقاً.'
        });
      }
    }

    // Baby diagnostic
    if (babyExpense > 0) {
      const pct = (babyExpense / totalIncome) * 100;
      if (pct > 15) {
        list.push({
          icon: Baby,
          title: 'نفقات الرضيع تحتاج ترتيب وجدولة',
          assessment: `تستأثر لوازم الرضيع بـ ${pct.toFixed(0)}% من الدخل. مع حفاظات الرضع (الكوش) وحليب الصيدليات والمراهم، تتصاعد المصاريف سريعاً.`,
          action: 'تجنب شراء الحفاضات بالعلب الصغيرة وبصفة يومية. اقتنائها بالحزمة الكبيرة (Giant Pack) ومن مغازات الجملة الكبرى أو المستودعات يوفر مبالغ هامة شهرياً.'
        });
      } else {
        list.push({
          icon: Baby,
          title: 'مصروف الرضيع مثالي ومدروس',
          assessment: `تخصيص ${pct.toFixed(0)}% من ميزانية العائلة للطفل الرضيع يدل على حكمة اقتصادية وموازنة جيدة بين مستلزمات البيبي والمصاريف الأساسية الأخرى.`,
          action: 'حاولوا الاستمرار في هذا الإنفاق وحقن المدخرات في صندوق خاص لتأمين تطعيمات حيوية ومصاريف الطبيب الفجائية.'
        });
      }
    }

    // Housing & Bills diagnostic
    if (housingExpense > 0) {
      const pct = (housingExpense / totalIncome) * 100;
      if (pct > 25) {
        list.push({
          icon: House,
          title: 'فواتير ومصاريف البيت ثقيلة',
          assessment: `خدمات وإيجار وفواتير المنزل تلتهم ${pct.toFixed(0)}% من دخل العائلة. الارتفاع المتتالي لفواتير الشركة التونسية للكهرباء والغاز (STEG) والصوناد يثقل كاهلكم.`,
          action: 'ابدأ بخفض استهلاك المكيّفات والأجهزة الإلكترونية في فترات الذروة، واحرص على قراءة العداد بشكل يدوي وتقديمه بانتظام لتتجنب الفواتير التقديرية الخيالية.'
        });
      }
    }

    // Medical diagnostics
    if (medicalExpense > 0) {
      const pct = (medicalExpense / totalIncome) * 100;
      if (pct > 12) {
        list.push({
          icon: HeartPulse,
          title: 'ملاحظة طبية وتلاقيح الرضيع',
          assessment: `معدل علاج وطبيب عائلتكم مرتفع هذا الشهر بنسبة ${pct.toFixed(0)}%، حيث يشمل فيزيتات طبيب الأطفال والأدوية والتلاقيح الضرورية.`,
          action: 'للرعاية الصحية، يُفضل الاستفادة من التلاقيح المجانية والبرامج الوطنية في مراكز رعاية الأم والطفل العمومية (مستوصفات البلدية) فهي تضاهي جودة عيادات الأخصائيين وتقلل الكلفة الكلية.'
        });
      }
    }

    // Default emergency advisory
    list.push({
      icon: Lightbulb,
      title: 'صندوق الأمان المالي الاستعجالي',
      assessment: 'العائلات التي لديها طفل رضيع تحتاج إلى سيولة فورية بسبب احتمالية زيارات طبيب الأطفال أو نزلات البرد المفاجئة التي تستوجب شراء أدوية وصيدلية في الليل.',
      action: 'اجعل هدفك الأول ادخار "مبلغ عاجل" نقدي (Cash) يتراوح بين 200 إلى 400 دينار موضوع في المنزل بعيداً عن البطاقات البنكية، ولا تلمسه أبداً لغير الطوارئ الصحية المحضة بلطف على الرضيع.'
    });

    return list;
  }, [foodExpense, babyExpense, housingExpense, medicalExpense, totalIncome]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 }
  };

  // Prepare Radial chart data for Recharts
  const radialData = [
    {
      name: 'معدل التوفير الفعلي',
      value: Math.min(100, Math.round(savingRate)),
      fill: savingRate >= 20 ? '#10b981' : savingRate > 10 ? '#3b82f6' : '#f59e0b',
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
      className="space-y-6 pb-16 max-w-5xl mx-auto px-2"
    >
      {/* Header and Context Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div className="space-y-0.5 text-right">
          <h1 className="text-xl md:text-2xl font-semibold text-slate-900 dark:text-white flex items-center gap-2 justify-end">
            <span>مؤشرات التوفير العائلية</span>
            <PiggyBank className="text-emerald-500 size-6" />
          </h1>
          <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-medium">
            صُمم خصيصاً لمراقبة ميزانية ومستقبل العائلة التونسية (الأب والأم والرضيع)
          </p>
        </div>
        <div className="bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-xl text-[10px] font-semibold text-slate-600 dark:text-slate-300">
          دورة الحساب الحالية: <span className="font-mono">{currentMonth}</span>
        </div>
      </div>

      {totalIncome === 0 ? (
        <motion.div 
          variants={itemVariants}
          className="glass-card p-8 rounded-3xl border border-dashed border-amber-500/30 bg-amber-500/5 text-center space-y-4"
        >
          <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 mx-auto">
            <AlertTriangle size={32} />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">لم نجد أي مدخول مسجل لهذا الشهر!</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              لتتمكن من حساب نسبة الادخار بدقة وتقديم مؤشرات التوفير المخصصة والذكية لعائلتك، يجب أولاً إدخال مدخولك الشهري الإجمالي (مرتب الأب، مرتب الأم، إلخ).
            </p>
          </div>
          <div className="pt-2">
            <Link 
              to="/income" 
              className="btn-primary px-6 py-3 rounded-2xl font-semibold text-xs inline-flex items-center gap-2 shadow-lg shadow-primary-500/20"
            >
              <span>إرساء وإدخال الدخل والانطلاق</span>
              <ArrowRight size={14} className="rotate-180" />
            </Link>
          </div>
        </motion.div>
      ) : (
        <>
          {/* Main Financial State Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Left Box: Simple Overview Info */}
            <motion.div 
              variants={itemVariants} 
              className="glass-card p-5 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between space-y-6 md:col-span-2"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Coins className="text-primary-500 size-5" />
                  <h3 className="text-xs font-semibold text-slate-600 dark:text-slate-400 leading-none">الملخص الحسابي للشهر</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                    <p className="text-[9px] font-bold text-slate-400 mb-0.5">إجمالي المداخيل العائلية</p>
                    <p className="text-base md:text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalIncome, currency)}</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                    <p className="text-[9px] font-bold text-slate-400 mb-0.5">إجمالي المصاريف والنفقات</p>
                    <p className="text-base md:text-lg font-bold text-rose-600 dark:text-rose-400">{formatCurrency(totalExpense, currency)}</p>
                  </div>
                </div>

                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">الفائض المدخّر الفعلي</p>
                    <p className="text-lg md:text-xl font-bold text-slate-900 dark:text-white leading-none mt-1-5">
                      {formatCurrency(actualSavings, currency)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-bold text-slate-400">معدل التوفير</p>
                    <p className="text-lg md:text-xl font-bold text-emerald-600 tracking-tighter mt-1-5">
                      {savingRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Savings Evaluation Card */}
              <div className={`p-4 border rounded-2xl space-y-1.5 ${savingsGrade.color}`}>
                <div className="flex items-center gap-2 justify-between">
                  <span className="text-xs font-semibold flex items-center gap-1.5">
                    <ShieldCheck size={14} className="shrink-0" />
                    التقييم: <span className="underline">{savingsGrade.title}</span>
                  </span>
                  <span className="text-[9px] font-semibold bg-black/5 dark:bg-white/10 px-2.5 py-1 rounded-full text-slate-600 dark:text-slate-300">نصيحة تلقائية</span>
                </div>
                <p className="text-[10px] md:text-xs font-semibold leading-relaxed text-right text-slate-700 dark:text-slate-200">
                  {savingsGrade.desc}
                </p>
              </div>
            </motion.div>

            {/* Right Box: Thermometer or Simple Visual Circle indicating savings percentage */}
            <motion.div 
              variants={itemVariants} 
              className="glass-card p-5 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center space-y-4"
            >
              <div className="space-y-1 w-full text-right">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block">مقياس توفير الميزانية</span>
                <p className="text-xs font-semibold text-slate-800 dark:text-white">النسبة المئوية الحالية للادخار</p>
              </div>

              <div className="h-44 w-full flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart 
                    cx="50%" 
                    cy="50%" 
                    innerRadius="60%" 
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
                  <span className="text-3xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">
                    {Math.round(savingRate)}%
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500 mt-1 leading-none">توفير من مجموع الدخل</span>
                </div>
              </div>

              <div className="space-y-1 font-bold">
                <p className="text-[10px] text-slate-400">معدل التوفير المستهدف السليم للعائلات</p>
                <div className="flex gap-1.5 justify-center text-[10px] text-slate-600 dark:text-slate-300">
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500">حرج: &lt;10%</span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500">مقبول: 10%-20%</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">رائع: &gt;20%</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* SIMULATOR CARD */}
          <motion.div 
            variants={itemVariants}
            className="glass-card p-5 md:p-6 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-5"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="space-y-0.5 text-right w-full sm:w-auto">
                <span className="text-[10px] font-semibold text-primary-600 dark:text-primary-405 block flex items-end justify-end gap-1">
                  <span>أداة تفاعلية للمحاكاة المباشرة</span>
                  <Sliders size={12} />
                </span>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-white">محاكي ميزانية وترشيد المصاريف</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5 leading-relaxed">
                  احسب كم يمكنك ادخاره بتعديل طفيف على سلوك شراء قفة عيش العائلة، مستلزمات البيبي والمواسم.
                </p>
              </div>
              <div className="bg-gradient-to-tr from-emerald-500/15 to-emerald-400/5 dark:from-emerald-500/10 dark:to-emerald-500/0 px-4 py-3 rounded-2xl border border-emerald-500/20 text-right w-full sm:w-auto">
                <p className="text-[9px] font-bold text-slate-400">الوفر المالي التقديري الإضافي شهرياً</p>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {formatCurrency(simulatedExtraSavings, currency)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-5">
                {/* Food Simulation */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-right">
                    <span className="text-[10px] font-semibold text-slate-400">(الحالي: {formatCurrency(foodExpense, currency)})</span>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                      <span>ترشيد قفة السوق ومواد العطارة</span>
                      <UtensilsCrossed size={12} className="text-rose-500" />
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-xs font-bold text-slate-600 w-12 text-left">{foodSavingPct}%</span>
                    <input
                      type="range"
                      min="0"
                      max="40"
                      value={foodSavingPct}
                      onChange={(e) => handleSliderChange('food', Number(e.target.value))}
                      className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>
                  <p className="text-[9px] text-slate-400 font-bold text-right">سيوفر لعائلتكم حوالي <span className="text-emerald-500 font-mono">{formatCurrency(simulatedSavedFood, currency)}</span> شهرياً</p>
                </div>

                {/* Baby Simulation */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-right">
                    <span className="text-[10px] font-semibold text-slate-400">(الحالي: {formatCurrency(babyExpense, currency)})</span>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                      <span>توفير لوازم الرضيع (البيع بالجملة)</span>
                      <Baby size={12} className="text-cyan-500" />
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-xs font-bold text-slate-600 w-12 text-left">{babySavingPct}%</span>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      value={babySavingPct}
                      onChange={(e) => handleSliderChange('baby', Number(e.target.value))}
                      className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>
                  <p className="text-[9px] text-slate-400 font-bold text-right">سيوفر لعائلتكم حوالي <span className="text-emerald-500 font-mono">{formatCurrency(simulatedSavedBaby, currency)}</span> شهرياً</p>
                </div>

                {/* Leisure Simulation */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-right">
                    <span className="text-[10px] font-semibold text-slate-400">(الحالي: {formatCurrency(leisureExpense, currency)})</span>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                      <span>التحكم في مصاريف المقهى والترفيه</span>
                      <Sparkles size={12} className="text-amber-500" />
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-xs font-bold text-slate-600 w-12 text-left">{leisureSavingPct}%</span>
                    <input
                      type="range"
                      min="0"
                      max="60"
                      value={leisureSavingPct}
                      onChange={(e) => handleSliderChange('leisure', Number(e.target.value))}
                      className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>
                  <p className="text-[9px] text-slate-400 font-bold text-right">سيوفر لعائلتكم حوالي <span className="text-emerald-500 font-mono">{formatCurrency(simulatedSavedLeisure, currency)}</span> شهرياً</p>
                </div>
              </div>

              {/* Simulation Result Details */}
              <div className="bg-slate-50 dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5 text-right">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">مقارنة معدل الادخار التقديري</p>
                  <div className="flex items-center gap-3 justify-end text-sm">
                    <span className="line-through text-slate-400 font-mono">{savingRate.toFixed(1)}%</span>
                    <span className="text-slate-400">←</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono text-lg">{simulatedSavingRate.toFixed(1)}%</span>
                  </div>
                </div>

                <div className="space-y-1 text-right border-t border-slate-200/50 dark:border-slate-800/55 pt-3">
                  <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md">
                    المستقبل المالي المتوقع
                  </span>
                  <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-350 leading-relaxed mt-1.5">
                    الالتزام بهذا الترشيد البسيط يوفر لعائلتك مبلغاً صافياً مقداره <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(simulatedTotalSavings, currency)}</span> شهرياً. هذا المبلغ يكفي لتغطية نفقات طبيب الأطفال بالكامل وتكوين مدخرات صلبة لمستقبل مدرسة الصغير وصندوق الطوارئ الصحي.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* DIAGNOSTICS & ADVICE LIST FROM EXPERTS */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white text-right flex items-center gap-1.5 justify-end">
              <span>توجيهات وإرشادات حماية الميزانية العائلية</span>
              <Lightbulb className="text-amber-500 size-4" />
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {diagnostics.map((diag, index) => {
                const IconComponent = diag.icon;
                return (
                  <motion.div
                    key={index}
                    variants={itemVariants}
                    className="p-5 bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex gap-4 text-right"
                  >
                    <div className="flex-1 space-y-2">
                      <h4 className="text-xs font-semibold text-slate-900 dark:text-white">{diag.title}</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                        {diag.assessment}
                      </p>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-start gap-2 justify-end">
                        <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300 leading-relaxed text-right">
                          {diag.action}
                        </span>
                        <CheckCircle2 size={12} className="text-emerald-500 shrink-0 mt-0.5" />
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800 shrink-0 self-start">
                      <IconComponent size={20} />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default SavingsIndicators;
