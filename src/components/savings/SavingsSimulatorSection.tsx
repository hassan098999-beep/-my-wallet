import React, { useState, useMemo } from 'react';
import { 
  Sliders, 
  Sparkles, 
  TrendingUp, 
  PiggyBank, 
  UtensilsCrossed, 
  Baby, 
  Coffee, 
  ShieldCheck, 
  CheckCircle2, 
  Lightbulb,
  ArrowUpRight
} from 'lucide-react';
import { useAppContext } from '../../store/AppContext';
import { formatCurrency, hapticFeedback, cn, getBudgetRange, getBudgetMonth } from '../../utils';
import { parseISO } from 'date-fns';

interface SavingsSimulatorSectionProps {
  itemVariants?: any;
}

export const SavingsSimulatorSection: React.FC<SavingsSimulatorSectionProps> = () => {
  const { income, expenses, categories, currency, firstDayOfMonth } = useAppContext();

  // Sliders state (% potential savings)
  const [foodSavingPct, setFoodSavingPct] = useState(15);
  const [leisureSavingPct, setLeisureSavingPct] = useState(25);
  const [babySavingPct, setBabySavingPct] = useState(10);

  // Month range
  const currentMonth = useMemo(() => getBudgetMonth(new Date(), firstDayOfMonth), [firstDayOfMonth]);
  const { start: monthStart, end: monthEnd } = useMemo(() => getBudgetRange(currentMonth, firstDayOfMonth), [currentMonth, firstDayOfMonth]);

  // Expenses totals
  const monthlyTotals = useMemo(() => {
    const totalExpense = expenses
      .filter(e => !e.isTransfer && parseISO(e.date) >= monthStart && parseISO(e.date) <= monthEnd)
      .reduce((sum, e) => sum + e.amount, 0);

    const totalIncome = income
      .filter(i => !i.isTransfer && parseISO(i.date) >= monthStart && parseISO(i.date) <= monthEnd)
      .reduce((sum, i) => sum + i.amount, 0);

    const catExpenses = expenses
      .filter(e => !e.isTransfer && parseISO(e.date) >= monthStart && parseISO(e.date) <= monthEnd)
      .reduce((acc, e) => {
        acc[e.categoryId] = (acc[e.categoryId] || 0) + e.amount;
        return acc;
      }, {} as Record<string, number>);

    return { totalExpense, totalIncome, catExpenses };
  }, [expenses, income, monthStart, monthEnd]);

  // Specific categories
  const categoriesList = categories || [];
  const foodCategory = categoriesList.find(c => (c.name && (c.name.includes('السوق') || c.name.includes('القفة'))) || c.id === '1');
  const babyCategory = categoriesList.find(c => (c.name && c.name.includes('الرضيع')) || c.id === '2');
  const leisureCategory = categoriesList.find(c => (c.name && (c.name.includes('ترفيه') || c.name.includes('مقهى'))) || c.id === '6');

  // Baseline expenses (use real expenses, or practical baseline if 0 so simulator is always useful)
  const rawFood = foodCategory ? (monthlyTotals.catExpenses[foodCategory.id] || 0) : 0;
  const rawBaby = babyCategory ? (monthlyTotals.catExpenses[babyCategory.id] || 0) : 0;
  const rawLeisure = leisureCategory ? (monthlyTotals.catExpenses[leisureCategory.id] || 0) : 0;

  // If no transactions yet this month, show typical estimated baselines (e.g., 400 TND food, 200 baby, 120 leisure)
  const isEstimated = rawFood === 0 && rawBaby === 0 && rawLeisure === 0;
  const foodExpense = rawFood > 0 ? rawFood : 450;
  const babyExpense = rawBaby > 0 ? rawBaby : 220;
  const leisureExpense = rawLeisure > 0 ? rawLeisure : 150;

  // Calculated extra savings
  const savedFood = (foodExpense * foodSavingPct) / 100;
  const savedBaby = (babyExpense * babySavingPct) / 100;
  const savedLeisure = (leisureExpense * leisureSavingPct) / 100;

  const totalExtraMonthly = savedFood + savedBaby + savedLeisure;
  const totalExtraYearly = totalExtraMonthly * 12;

  const baseSurplus = Math.max(0, monthlyTotals.totalIncome - monthlyTotals.totalExpense);
  const projectedSurplus = baseSurplus + totalExtraMonthly;
  const projectedSavingRate = monthlyTotals.totalIncome > 0 
    ? Math.round((projectedSurplus / monthlyTotals.totalIncome) * 100) 
    : Math.round((totalExtraMonthly / (monthlyTotals.totalExpense > 0 ? monthlyTotals.totalExpense : 1200)) * 100);

  return (
    <div className="space-y-6 text-right w-full" dir="rtl">
      
      {/* 1. Main Interactive Simulator Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 md:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Sliders size={22} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                محاكي الترشيد والتوفير الذكي
              </h3>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">
                حرك المؤشرات لترى كم يمكنك توفيره شهرياً وسنوياً بترشيد مصاريف معينة
              </p>
            </div>
          </div>

          {isEstimated && (
            <span className="text-[10px] font-black px-2 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-lg border border-amber-200/60 dark:border-amber-900/40 self-start sm:self-auto">
              نموذج تقديري ذكي 💡
            </span>
          )}
        </div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* 1. Food / Market */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <UtensilsCrossed size={14} className="text-emerald-500" />
                <span>قفة السوق والمشتريات</span>
              </span>
              <span className="text-xs font-black font-mono text-emerald-600 dark:text-emerald-400">{foodSavingPct}%</span>
            </div>

            <input
              type="range"
              min="0"
              max="40"
              step="5"
              value={foodSavingPct}
              onChange={(e) => {
                hapticFeedback('light');
                setFoodSavingPct(Number(e.target.value));
              }}
              className="w-full h-1.5 accent-emerald-500 cursor-pointer"
            />

            <div className="flex justify-between text-[10px] text-slate-400 font-bold">
              <span>المصروف: {formatCurrency(foodExpense, currency)}</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-black font-mono">
                وفر: +{formatCurrency(savedFood, currency)}
              </span>
            </div>
          </div>

          {/* 2. Leisure / Cafe */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Coffee size={14} className="text-amber-500" />
                <span>الترفيه والمقاهي</span>
              </span>
              <span className="text-xs font-black font-mono text-amber-600 dark:text-amber-400">{leisureSavingPct}%</span>
            </div>

            <input
              type="range"
              min="0"
              max="60"
              step="5"
              value={leisureSavingPct}
              onChange={(e) => {
                hapticFeedback('light');
                setLeisureSavingPct(Number(e.target.value));
              }}
              className="w-full h-1.5 accent-amber-500 cursor-pointer"
            />

            <div className="flex justify-between text-[10px] text-slate-400 font-bold">
              <span>المصروف: {formatCurrency(leisureExpense, currency)}</span>
              <span className="text-amber-600 dark:text-amber-400 font-black font-mono">
                وفر: +{formatCurrency(savedLeisure, currency)}
              </span>
            </div>
          </div>

          {/* 3. Baby Supplies */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Baby size={14} className="text-cyan-500" />
                <span>مشتريات الرضيع بالجملة</span>
              </span>
              <span className="text-xs font-black font-mono text-cyan-600 dark:text-cyan-400">{babySavingPct}%</span>
            </div>

            <input
              type="range"
              min="0"
              max="30"
              step="5"
              value={babySavingPct}
              onChange={(e) => {
                hapticFeedback('light');
                setBabySavingPct(Number(e.target.value));
              }}
              className="w-full h-1.5 accent-cyan-500 cursor-pointer"
            />

            <div className="flex justify-between text-[10px] text-slate-400 font-bold">
              <span>المصروف: {formatCurrency(babyExpense, currency)}</span>
              <span className="text-cyan-600 dark:text-cyan-400 font-black font-mono">
                وفر: +{formatCurrency(savedBaby, currency)}
              </span>
            </div>
          </div>

        </div>

        {/* Projected Simulation Results Hero */}
        <div className="p-5 bg-gradient-to-br from-indigo-50 to-emerald-50 dark:from-slate-800/80 dark:to-slate-800/40 rounded-3xl border border-indigo-100 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center sm:text-right">
          
          <div className="border-b sm:border-b-0 sm:border-l border-indigo-200/40 dark:border-slate-700 pb-3 sm:pb-0 sm:pl-3">
            <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 block mb-1">
              مجموع التوفير الإضافي الشهري
            </span>
            <span className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">
              +{formatCurrency(totalExtraMonthly, currency)}
            </span>
          </div>

          <div className="border-b sm:border-b-0 sm:border-l border-indigo-200/40 dark:border-slate-700 pb-3 sm:pb-0 sm:pl-3">
            <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 block mb-1">
              التوفير التراكمي السنوي المتوقع
            </span>
            <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              +{formatCurrency(totalExtraYearly, currency)}
            </span>
          </div>

          <div>
            <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 block mb-1">
              نسبة الادخار المحتملة الجديدة
            </span>
            <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">
              {projectedSavingRate}% من ميزانيتك
            </span>
          </div>

        </div>
      </div>

      {/* 2. Actionable Financial Health Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Rule 50/30/20 */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <ShieldCheck size={18} />
            </div>
            <h4 className="text-sm font-black text-slate-900 dark:text-white">قاعدة 50/30/20 للاتزان المالي</h4>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            توزيع الدخل المثالي المعتمد عالمياً:
            <br />
            • <strong>50%</strong> للحاجات الأساسية (القفة، الفواتير، الإيجار، الرضيع).
            <br />
            • <strong>30%</strong> للرغبات والترفيه والكماليات.
            <br />
            • <strong>20%</strong> للادخار المباشر، وصناديق الطوارئ والاستثمار.
          </p>
        </div>

        {/* Smart Tip */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <Lightbulb size={18} />
            </div>
            <h4 className="text-sm font-black text-slate-900 dark:text-white">نصيحة الادخار التلقائي أول الشهر</h4>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            لا تدخر ما يتبقى بعد الإنفاق، بل أنفق ما يتبقى بعد الادخار!
            <br />
            بمجرد استلام الراتب، حوّل حصة الادخار (مثلاً 100 أو 200 {currency}) فوراً إلى أهدافك أو حصالتك قبل البدء بالصرف اليومي.
          </p>
        </div>
      </div>

    </div>
  );
};

export default SavingsSimulatorSection;

