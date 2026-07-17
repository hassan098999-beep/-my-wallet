import React, { useMemo } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { 
  TrendingDown, 
  TrendingUp, 
  Sparkles, 
  Lightbulb, 
  CheckCircle,
  HelpCircle,
  PiggyBank,
  ArrowRight
} from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Expense {
  id: string;
  amount: number;
  date: string;
  categoryId: string;
  note?: string;
  isTransfer?: boolean;
}

interface Category {
  id: string;
  name: string;
  color: string;
}

interface WeeklyAnalysisProps {
  expenses: Expense[];
  categories: Category[];
  currency: string;
}

export const WeeklyAnalysis: React.FC<WeeklyAnalysisProps> = ({ expenses, categories, currency }) => {
  // 1. Calculate this week's and last week's spendings
  const analysisData = useMemo(() => {
    const today = new Date();
    
    // This week intervals
    const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
    const thisWeekEnd = endOfWeek(today, { weekStartsOn: 1 });
    
    // Last week intervals
    const lastWeekStart = startOfWeek(subDays(today, 7), { weekStartsOn: 1 });
    const lastWeekEnd = endOfWeek(subDays(today, 7), { weekStartsOn: 1 });

    const daysMap = [
      { key: 'Mon', label: 'الإثنين' },
      { key: 'Tue', label: 'الثلاثاء' },
      { key: 'Wed', label: 'الأربعاء' },
      { key: 'Thu', label: 'الخميس' },
      { key: 'Fri', label: 'الجمعة' },
      { key: 'Sat', label: 'السبت' },
      { key: 'Sun', label: 'الأحد' }
    ];

    // Initialize arrays
    const chartData = daysMap.map(d => ({
      name: d.label,
      thisWeek: 0,
      lastWeek: 0,
    }));

    let thisWeekTotal = 0;
    let lastWeekTotal = 0;
    const categoryTotals: Record<string, number> = {};

    expenses.forEach(exp => {
      if (exp.isTransfer) return;
      const amount = Number(exp.amount) || 0;
      const expDate = parseISO(exp.date);
      const dayIndex = (expDate.getDay() + 6) % 7; // Convert Sunday=0..Saturday=6 to Monday=0..Sunday=6

      // Sum for this week
      if (isWithinInterval(expDate, { start: thisWeekStart, end: thisWeekEnd })) {
        if (dayIndex >= 0 && dayIndex < 7) {
          chartData[dayIndex].thisWeek += amount;
        }
        thisWeekTotal += amount;
        
        // Count categories for smart tips
        categoryTotals[exp.categoryId] = (categoryTotals[exp.categoryId] || 0) + amount;
      }
      
      // Sum for last week
      if (isWithinInterval(expDate, { start: lastWeekStart, end: lastWeekEnd })) {
        if (dayIndex >= 0 && dayIndex < 7) {
          chartData[dayIndex].lastWeek += amount;
        }
        lastWeekTotal += amount;
      }
    });

    // Find top spending category
    let topCategoryId = '';
    let topCategoryAmount = 0;
    Object.entries(categoryTotals).forEach(([catId, amount]) => {
      if (amount > topCategoryAmount) {
        topCategoryAmount = amount;
        topCategoryId = catId;
      }
    });

    const topCategory = categories.find(c => c.id === topCategoryId);

    return {
      chartData,
      thisWeekTotal,
      lastWeekTotal,
      topCategory,
      topCategoryAmount
    };
  }, [expenses, categories]);

  const { chartData, thisWeekTotal, lastWeekTotal, topCategory, topCategoryAmount } = analysisData;

  // Calculate difference
  const spendDiff = thisWeekTotal - lastWeekTotal;
  const isSaving = spendDiff <= 0;
  const diffPercent = lastWeekTotal > 0 ? Math.abs((spendDiff / lastWeekTotal) * 100) : 0;

  // Dynamic Tunisian Smart saving tips generator
  const savingTips = useMemo(() => {
    const tips = [
      {
        id: 'tip_1',
        title: 'قانون "القفة الفاضية" 🛒',
        text: 'دائماً اذهب للسوق البلدي ببطن ممتلئة وقائمة دقيقة ومكتوبة. الشراء العشوائي تحت تأثير الجوع يضيف 30% مصاريف زائدة على القفة التونسية.',
        impact: 'توفير حوالي 40 د.ت أسبوعياً'
      },
      {
        id: 'tip_2',
        title: 'ترشيد طاقة الـ STEG/SONEDE 🔌',
        text: 'تجنب ترك شواحن الهواتف موصولة بالكهرباء دون استخدام، واضبط تكييف الهواء دائماً على 24 درجة لتجنب القفزات الكبيرة في فاتورة الكهرباء القادمة.',
        impact: 'توفير 15% من قيمة الفاتورة'
      }
    ];

    if (topCategory) {
      if (topCategory.name.includes('قفة') || topCategory.name.includes('سوق')) {
        tips.unshift({
          id: 'tip_custom',
          title: 'تحليل ذكي لقفة السوق 🇹🇳',
          text: `فئة "${topCategory.name}" هي الأكثر استهلاكاً هذا الأسبوع بـ ${topCategoryAmount.toFixed(3)} د.ت. حاول الشراء بالجملة من أسواق الجملة الأسبوعية بدلاً من محلات التجزئة اليومية لتوفير الفارق.`,
          impact: 'توفير حتى 25% من ميزانية السوق'
        });
      } else if (topCategory.name.includes('رضيع') || topCategory.name.includes('كوش')) {
        tips.unshift({
          id: 'tip_custom',
          title: 'ذكاء مصروف الرضيع 👶🍼',
          text: `فئة "${topCategory.name}" أخذت النصيب الأكبر (${topCategoryAmount.toFixed(3)} د.t). ابحث عن العروض العائلية الكبرى (Megapack) للحفاضات والحليب في المغازات الكبرى، فهي أوفر بكثير على المدى الطويل من الشراء بالعلبة المفردة من الصيدلية.`,
          impact: 'توفير حتى 50 د.ت شهرياً'
        });
      } else {
        tips.unshift({
          id: 'tip_custom',
          title: `تحدي ترشيد فئة ${topCategory.name} 🎯`,
          text: `لقد أنفقت ${topCategoryAmount.toFixed(3)} د.ت على فئة "${topCategory.name}" هذا الأسبوع. هل يمكنك وضع سقف تحدي لتقليل هذا المبلغ بـ 10% الأسبوع القادم؟`,
          impact: 'مدخرات إضافية ممتازة'
        });
      }
    }

    return tips;
  }, [topCategory, topCategoryAmount]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-5 md:p-6 shadow-sm space-y-6 text-right w-full max-w-5xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-50 dark:border-slate-800/50">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="text-amber-500 animate-pulse" size={18} />
            <span>التحليل الأسبوعي ومقارنة الأداء 📈</span>
          </h3>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold mt-1">مقارنة أداء الإنفاق اليومي للأسبوع الحالي مع الأسبوع الماضي مع نصائح الترشيد</p>
        </div>
        
        {/* Comparison badge */}
        <div className={`px-4 py-2 rounded-2xl flex items-center gap-2 border text-xs font-black ${
          isSaving 
            ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400' 
            : 'bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400'
        }`}>
          {isSaving ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
          <span>
            {isSaving 
              ? `وفرت ${diffPercent.toFixed(1)}% مقارنة بالأسبوع الماضي! 🎉` 
              : `زيادة ${diffPercent.toFixed(1)}% عن الأسبوع الماضي! ⚠️`}
          </span>
        </div>
      </div>

      {/* Grid: Chart and Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Column (lg:col-span-2) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-black text-slate-800 dark:text-slate-200">مخطط الإنفاق اليومي المقارن</span>
            <div className="flex gap-4 text-[10px] font-bold">
              <span className="flex items-center gap-1 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700 block" /> الأسبوع الماضي
              </span>
              <span className="flex items-center gap-1 text-indigo-500">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 block" /> الأسبوع الحالي
              </span>
            </div>
          </div>

          <div className="h-64 w-full bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850/40 rounded-2xl p-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 5, left: 5, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorThisWeek" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorLastWeek" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800/50" />
                <XAxis 
                  dataKey="name" 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'mono' }}
                  orientation="right"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                    border: 'none', 
                    borderRadius: '12px',
                    color: '#fff',
                    textAlign: 'right',
                    fontSize: '11px',
                    fontFamily: 'Tajawal, sans-serif'
                  }}
                  itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                  labelStyle={{ color: '#94a3b8', marginBottom: '4px', fontWeight: 'bold' }}
                />
                <Area 
                  name="الأسبوع الحالي"
                  type="monotone" 
                  dataKey="thisWeek" 
                  stroke="#6366f1" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorThisWeek)" 
                />
                <Area 
                  name="الأسبوع الماضي"
                  type="monotone" 
                  dataKey="lastWeek" 
                  stroke="#94a3b8" 
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  fillOpacity={1} 
                  fill="url(#colorLastWeek)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Totals & Analysis Summary Card */}
        <div className="bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="space-y-4">
            <span className="text-xs font-black text-slate-850 dark:text-slate-200 block border-b border-slate-100 dark:border-slate-800/80 pb-2">تفصيل المقارنة الرقمية</span>
            
            <div className="flex justify-between items-center">
              <span className="font-mono font-black text-indigo-500 text-sm">{thisWeekTotal.toFixed(3)} د.ت</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">مجموع الأسبوع الحالي:</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="font-mono font-black text-slate-500 text-sm">{lastWeekTotal.toFixed(3)} د.ت</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">مجموع الأسبوع الماضي:</span>
            </div>

            <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-850/60 pt-3">
              <span className={`font-mono font-black text-sm ${isSaving ? 'text-emerald-500' : 'text-rose-500'}`}>
                {isSaving ? '-' : '+'}{Math.abs(spendDiff).toFixed(3)} د.ت
              </span>
              <span className="text-[11px] text-slate-850 dark:text-slate-200 font-black">الفارق المالي:</span>
            </div>
          </div>

          <div className="p-3 bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/10 rounded-xl mt-4 text-center">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-black block mb-1">الوضع العام للأسبوع</span>
            <p className="text-[11px] font-black leading-normal text-slate-800 dark:text-slate-200">
              {isSaving 
                ? 'أداء رائع ومبهر جداً! أنت تتبع سلوكاً ادخارياً سليماً وتقلل من الهدر المالي.' 
                : 'هناك بعض الارتفاع الطفيف في النفقات، راجع نصائح الترشيد الجانبية لتعديل المسار.'}
            </p>
          </div>
        </div>
      </div>

      {/* Smart Savings Tips Row */}
      <div className="space-y-3.5 pt-4 border-t border-slate-50 dark:border-slate-800/50">
        <div className="flex items-center gap-2 px-1">
          <Lightbulb size={16} className="text-amber-500 animate-bounce" />
          <span className="text-xs font-black text-slate-850 dark:text-slate-200">نصائح توفير تونسية ذكية مخصصة لك 💡🇹🇳</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {savingTips.map((tip) => (
            <div 
              key={tip.id} 
              className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-850/40 hover:border-slate-200 dark:hover:border-slate-700 transition-all flex flex-col justify-between text-right space-y-3 relative overflow-hidden group"
            >
              <div className="space-y-1.5">
                <span className="text-xs font-black text-indigo-500 dark:text-indigo-400 block">{tip.title}</span>
                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                  {tip.text}
                </p>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-850/30 text-[10px]">
                <span className="font-bold text-slate-400">العائد المرجو:</span>
                <span className="font-black text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-md">
                  {tip.impact}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
