import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  BarChart2, Activity, TrendingUp, PieChart, ShieldCheck, 
  Sparkles, Layers, ArrowUpRight
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, Cell,
  AreaChart, Area
} from 'recharts';
import { parseISO, subMonths, format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Category, Budget, Expense } from '../../types';
import { formatCurrency, getBudgetMonth } from '../../utils';

interface BudgetAnalyticsTabProps {
  chartData: Array<{ name: string; spent: number; budgeted: number; color?: string }>;
  categories: Category[];
  currency: string;
  selectedMonth?: string;
  firstDayOfMonth?: number;
  expenses?: Expense[];
  budgets?: Budget[];
  globalBudgetNum: number;
  totalSpent: number;
}

export const BudgetAnalyticsTab: React.FC<BudgetAnalyticsTabProps> = ({
  chartData,
  categories,
  currency,
  selectedMonth,
  firstDayOfMonth = 1,
  expenses = [],
  budgets = [],
  globalBudgetNum,
  totalSpent,
}) => {
  // 6-Month Trend Data
  const trendData = useMemo(() => {
    if (!selectedMonth) return [];
    try {
      const baseDate = parseISO(`${selectedMonth}-01`);
      const monthsList: Array<{ monthKey: string; monthName: string; budgeted: number; spent: number }> = [];

      for (let i = 5; i >= 0; i--) {
        const d = subMonths(baseDate, i);
        const mKey = format(d, 'yyyy-MM');
        const mName = format(d, 'MMMM', { locale: ar });

        const bObj = budgets.find(b => b.month === mKey);
        const bAmount = bObj?.amount || 0;

        const mExpenses = expenses.filter(e => {
          if (e.isTransfer) return false;
          const eMonth = getBudgetMonth(parseISO(e.date), firstDayOfMonth);
          return eMonth === mKey;
        });
        const mSpent = mExpenses.reduce((s, e) => s + e.amount, 0);

        monthsList.push({
          monthKey: mKey,
          monthName: mName,
          budgeted: Number(bAmount.toFixed(1)),
          spent: Number(mSpent.toFixed(1)),
        });
      }
      return monthsList;
    } catch {
      return [];
    }
  }, [selectedMonth, budgets, expenses, firstDayOfMonth]);

  // 50/30/20 breakdown
  const rule503020 = useMemo(() => {
    const needsBudget = chartData.filter(i => {
      const found = categories.find(c => c.name === i.name);
      return found?.type === 'need' || !found?.type;
    }).reduce((s, x) => s + x.budgeted, 0);
    const needsSpent = chartData.filter(i => {
      const found = categories.find(c => c.name === i.name);
      return found?.type === 'need' || !found?.type;
    }).reduce((s, x) => s + x.spent, 0);

    const wantsBudget = chartData.filter(i => categories.find(c => c.name === i.name)?.type === 'want').reduce((s, x) => s + x.budgeted, 0);
    const wantsSpent = chartData.filter(i => categories.find(c => c.name === i.name)?.type === 'want').reduce((s, x) => s + x.spent, 0);

    const savingBudget = chartData.filter(i => categories.find(c => c.name === i.name)?.type === 'saving').reduce((s, x) => s + x.budgeted, 0);
    const savingSpent = chartData.filter(i => categories.find(c => c.name === i.name)?.type === 'saving').reduce((s, x) => s + x.spent, 0);

    return {
      needs: { budget: needsBudget, spent: needsSpent, percent: needsBudget > 0 ? Math.min(100, (needsSpent / needsBudget) * 100) : 0 },
      wants: { budget: wantsBudget, spent: wantsSpent, percent: wantsBudget > 0 ? Math.min(100, (wantsSpent / wantsBudget) * 100) : 0 },
      saving: { budget: savingBudget, spent: savingSpent, percent: savingBudget > 0 ? Math.min(100, (savingSpent / savingBudget) * 100) : 0 },
    };
  }, [chartData, categories]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 text-right font-tajawal rtl"
    >
      {/* 50/30/20 Framework Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Needs */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
              50% المقترح
            </span>
            <h4 className="text-xs font-black text-slate-900 dark:text-white">الاحتياجات والأساسيات</h4>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-bold text-slate-400 font-mono">
              الميزانية: {formatCurrency(rule503020.needs.budget, currency)}
            </span>
            <span className="text-base font-black font-mono text-rose-600 dark:text-rose-400">
              {formatCurrency(rule503020.needs.spent, currency)}
            </span>
          </div>
          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-rose-500 rounded-full transition-all duration-500" 
              style={{ width: `${rule503020.needs.percent}%` }}
            />
          </div>
        </div>

        {/* Wants */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
              30% المقترح
            </span>
            <h4 className="text-xs font-black text-slate-900 dark:text-white">الرغبات ونمط الحياة</h4>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-bold text-slate-400 font-mono">
              الميزانية: {formatCurrency(rule503020.wants.budget, currency)}
            </span>
            <span className="text-base font-black font-mono text-amber-600 dark:text-amber-400">
              {formatCurrency(rule503020.wants.spent, currency)}
            </span>
          </div>
          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-amber-500 rounded-full transition-all duration-500" 
              style={{ width: `${rule503020.wants.percent}%` }}
            />
          </div>
        </div>

        {/* Savings */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              20% المقترح
            </span>
            <h4 className="text-xs font-black text-slate-900 dark:text-white">الادخار والتأمين</h4>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-bold text-slate-400 font-mono">
              الميزانية: {formatCurrency(rule503020.saving.budget, currency)}
            </span>
            <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
              {formatCurrency(rule503020.saving.spent, currency)}
            </span>
          </div>
          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
              style={{ width: `${rule503020.saving.percent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Comparative Horizontal Bar Chart (Categories) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-150 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart2 size={16} className="text-indigo-500" />
              <span>المقارنة البصرية بين الميزانية والمصروف الفعلي</span>
            </h3>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">مقارنة ثنائية لكل فئة لمعرفة مواطن التوفير أو التجاوز</p>
          </div>

          <div className="flex items-center gap-3 text-[10px] font-bold">
            <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              الميزانية المرصودة
            </span>
            <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              المصروف الفعلي
            </span>
          </div>
        </div>

        {chartData.length > 0 ? (
          <div className="w-full" style={{ height: `${Math.max(260, chartData.length * 38)}px` }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" opacity={0.3} />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  orientation="right"
                  tick={{ fontSize: 10, fontWeight: 800, fill: '#64748b' }}
                  width={110}
                />
                <RechartsTooltip
                  cursor={{ fill: '#f8fafc', opacity: 0.1 }}
                  contentStyle={{ borderRadius: '14px', background: '#0f172a', border: '1px solid #1e293b', direction: 'rtl' }}
                  itemStyle={{ color: '#fff', fontSize: '11px', fontFamily: 'Tajawal, sans-serif' }}
                  labelStyle={{ color: '#94a3b8', fontSize: '10px', fontWeight: 'bold', fontFamily: 'Tajawal, sans-serif', textAlign: 'right' }}
                  formatter={(value: any, name: any) => [
                    `${value} ${currency}`,
                    name === 'budgeted' ? 'الميزانية المخصصة' : 'المصروف الفعلي'
                  ]}
                />
                <Bar dataKey="budgeted" name="budgeted" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={8}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-budgeted-${index}`} fill={entry.color ? `${entry.color}35` : '#6366f135'} stroke={entry.color || '#6366f1'} strokeWidth={1.5} />
                  ))}
                </Bar>
                <Bar dataKey="spent" name="spent" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={8}>
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-spent-${index}`} 
                      fill={entry.spent > entry.budgeted && entry.budgeted > 0 ? '#f43f5e' : `${entry.color || '#10b981'}cc`} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 text-xs font-bold">
            لا توجد بيانات كافية لعرض المقارنة البيانية حالياً.
          </div>
        )}
      </div>

      {/* 6-Month Trend Area Chart */}
      {trendData.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-150 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Activity size={16} className="text-emerald-500" />
                <span>تطور الميزانية والإنفاق لآخر 6 أشهر</span>
              </h3>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">مقارنة التزامك بالسقف المالي عبر الأشهر السابقة</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-bold">
              <span className="flex items-center gap-1.5 text-indigo-500">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                الميزانية
              </span>
              <span className="flex items-center gap-1.5 text-emerald-500">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                المصروف الفعلي
              </span>
            </div>
          </div>

          <div className="h-52 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="analyticsBudgetGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="analyticsSpentGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.3} />
                <XAxis 
                  dataKey="monthName" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
                />
                <RechartsTooltip
                  contentStyle={{ borderRadius: '14px', background: '#0f172a', border: '1px solid #1e293b', direction: 'rtl' }}
                  itemStyle={{ color: '#fff', fontSize: '11px', fontFamily: 'Tajawal, sans-serif' }}
                  labelStyle={{ color: '#94a3b8', fontSize: '10px', fontWeight: 'bold', fontFamily: 'Tajawal, sans-serif', textAlign: 'right' }}
                  formatter={(value: any, name: any) => [
                    `${value} ${currency}`,
                    name === 'budgeted' ? 'الميزانية' : 'المصروف الفعلي'
                  ]}
                />
                <Area 
                  type="monotone" 
                  dataKey="budgeted" 
                  stroke="#6366f1" 
                  strokeWidth={2} 
                  strokeDasharray="4 4"
                  fill="url(#analyticsBudgetGrad)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="spent" 
                  stroke="#10b981" 
                  strokeWidth={2.5} 
                  fill="url(#analyticsSpentGrad)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </motion.div>
  );
};
