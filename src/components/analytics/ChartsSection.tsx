import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area,
  ReferenceLine
} from 'recharts';
import { 
  ChartColumn as BarChart3, 
  ChartPie as PieChartIcon
} from 'lucide-react';
import { formatCurrency, cn, hapticFeedback } from '../../utils';

interface ChartsSectionProps {
  chartSubTab: 'daily' | 'monthly' | 'cumulative';
  setChartSubTab: (tab: 'daily' | 'monthly' | 'cumulative') => void;
  isReady?: boolean;
  dailyData: any[];
  monthlyData: any[];
  dailyPerformance?: { data: any[]; overBudgetDays: number; performanceScore: number; avgDailySpending: number };
  categoryData: any[];
  incomeSourceData: any[];
  totalMonthlyExpense: number;
  totalMonthlyIncome: number;
  dailyBudget: number;
  currency: string;
  width: number;
  itemVariants?: any;
}

export const ChartsSection: React.FC<ChartsSectionProps> = ({
  chartSubTab,
  setChartSubTab,
  isReady = true,
  dailyData,
  monthlyData,
  categoryData,
  incomeSourceData,
  totalMonthlyExpense,
  totalMonthlyIncome,
  dailyBudget,
  currency,
  width,
}) => {
  // Cumulative cash flow data (running net balance over days)
  const cumulativeData = React.useMemo(() => {
    let runningNet = 0;
    return (dailyData || []).map(d => {
      const netForDay = (d.incomeAmount || 0) - (d.expenseAmount || 0);
      runningNet += netForDay;
      return {
        ...d,
        dailyNet: netForDay,
        cumulativeBalance: runningNet,
      };
    });
  }, [dailyData]);

  const hasDailyData = dailyData && dailyData.length > 0;
  const hasMonthlyData = monthlyData && monthlyData.length > 0;

  return (
    <div className="space-y-6 text-right w-full" dir="rtl">
      
      {/* 1. Main Interactive Flow & Trend Graph */}
      <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
              <BarChart3 size={18} />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-black text-slate-900 dark:text-white">
                {chartSubTab === 'daily' ? 'حركة التدفقات اليومية (المصاريف والدخل)' :
                 chartSubTab === 'cumulative' ? 'منحنى الرصيد التراكمي وتطور الفائض' :
                 'المقارنة السنوية عبر الأشهر'}
              </h3>
              <p className="text-[11px] font-semibold text-slate-400">
                متابعة بصرية دقيقة لوتيرة الصرف ومسار السيولة
              </p>
            </div>
          </div>

          {/* Sub-tab Pill Switcher */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 w-full sm:w-auto">
            {[
              { id: 'daily', label: 'حركة يومية ⚡' },
              { id: 'cumulative', label: 'الرصيد التراكمي 📈' },
              { id: 'monthly', label: 'شهور السنة 🗓️' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  hapticFeedback('light');
                  setChartSubTab(tab.id as any);
                }}
                className={cn(
                  "flex-1 sm:flex-none px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer",
                  chartSubTab === tab.id 
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs" 
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chart Canvas Area */}
        <div className="h-64 md:h-72 w-full min-h-[260px]">
          {chartSubTab === 'daily' && hasDailyData ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.35} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: width < 640 ? 8 : 10, fontWeight: 700, fill: '#94a3b8' }}
                  interval={width < 640 ? 4 : 2}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: width < 640 ? 8 : 10, fontWeight: 700, fill: '#94a3b8' }}
                  width={width < 640 ? 30 : 40}
                />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9', opacity: 0.2 }}
                  contentStyle={{ borderRadius: '16px', background: '#0f172a', border: '1px solid #334155', color: '#fff', fontSize: '11px', direction: 'rtl', fontWeight: 'bold' }}
                  formatter={(value: any, name: any) => [formatCurrency(value, currency), name === 'incomeAmount' ? 'المقبوضات (الدخل)' : 'المصروفات']}
                />
                {dailyBudget > 0 && (
                  <ReferenceLine y={dailyBudget} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'الحد اليومي', fill: '#f59e0b', fontSize: 9, position: 'insideTopRight' }} />
                )}
                <Bar dataKey="incomeAmount" name="الدخل" fill="#10b981" radius={[4, 4, 0, 0]} barSize={width < 640 ? 5 : 12} />
                <Bar dataKey="expenseAmount" name="المصاريف" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={width < 640 ? 5 : 12} />
              </BarChart>
            </ResponsiveContainer>
          ) : chartSubTab === 'cumulative' && hasDailyData ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cumulativeData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.35} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: width < 640 ? 8 : 10, fontWeight: 700, fill: '#94a3b8' }}
                  interval={width < 640 ? 4 : 2}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: width < 640 ? 8 : 10, fontWeight: 700, fill: '#94a3b8' }}
                  width={width < 640 ? 30 : 40}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', background: '#0f172a', border: '1px solid #334155', color: '#fff', fontSize: '11px', direction: 'rtl', fontWeight: 'bold' }}
                  formatter={(value: any) => [formatCurrency(value, currency), 'الرصيد التراكمي المتبقي']}
                />
                <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="2 2" />
                <Area 
                  type="monotone" 
                  dataKey="cumulativeBalance" 
                  stroke="#6366f1" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#colorBalance)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : chartSubTab === 'monthly' && hasMonthlyData ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.35} />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: width < 640 ? 8 : 10, fontWeight: 700, fill: '#94a3b8' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: width < 640 ? 8 : 10, fontWeight: 700, fill: '#94a3b8' }}
                  width={width < 640 ? 30 : 40}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', background: '#0f172a', border: '1px solid #334155', color: '#fff', fontSize: '11px', direction: 'rtl', fontWeight: 'bold' }}
                  formatter={(value: any, name: any) => [formatCurrency(value, currency), name === 'income' ? 'الدخل السنوي' : 'المصاريف السنوية']}
                />
                <Bar dataKey="income" name="الدخل" fill="#10b981" radius={[4, 4, 0, 0]} barSize={width < 640 ? 8 : 16} />
                <Bar dataKey="expense" name="المصاريف" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={width < 640 ? 8 : 16} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-50 dark:bg-slate-800/20 rounded-2xl text-xs text-slate-400 font-bold">
              لا توجد بيانات كافية لعرض الرسم البياني في هذه الفترة.
            </div>
          )}
        </div>

        {/* Legend indicator bar */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-slate-600 dark:text-slate-400 font-bold text-[11px]">المقبوضات والدخل</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <span className="text-slate-600 dark:text-slate-400 font-bold text-[11px]">المصروفات اليومية</span>
            </div>
            {dailyBudget > 0 && chartSubTab === 'daily' && (
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 bg-amber-500" />
                <span className="text-slate-600 dark:text-slate-400 font-bold text-[11px]">الحد اليومي المتاح ({formatCurrency(dailyBudget, currency)})</span>
              </div>
            )}
          </div>

          <span className="text-[11px] text-slate-400 font-mono font-bold">
            صافي الفترة: <strong className={cn(totalMonthlyIncome >= totalMonthlyExpense ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
              {formatCurrency(totalMonthlyIncome - totalMonthlyExpense, currency)}
            </strong>
          </span>
        </div>
      </div>

      {/* 2. Side-By-Side Distribution Circle Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Expenses Category Distribution Share */}
        <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-500 rounded-xl">
                <PieChartIcon size={16} />
              </div>
              <h4 className="text-xs md:text-sm font-black text-slate-900 dark:text-white">توزيع فئات المصاريف</h4>
            </div>
            <span className="text-[11px] font-mono font-bold text-slate-400">
              {categoryData.length} فئات نشطة
            </span>
          </div>

          {categoryData.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              <div className="h-44 relative sm:col-span-6 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={66}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', background: '#0f172a', border: '1px solid #334155', color: '#fff', fontSize: '10px', direction: 'rtl', fontWeight: 'bold' }}
                      formatter={(v) => formatCurrency(Number(v), currency)}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="text-[9px] font-black text-slate-400 uppercase">المجموع</span>
                  <span className="text-xs font-black font-mono text-slate-900 dark:text-white mt-0.5">
                    {formatCurrency(totalMonthlyExpense, currency)}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 sm:col-span-6 max-h-44 overflow-y-auto pr-1">
                {categoryData.slice(0, 5).map((cat, i) => (
                  <div key={i} className="flex items-center justify-between text-xs p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      <span className="font-bold text-slate-700 dark:text-slate-300 truncate">{cat.name}</span>
                    </div>
                    <div className="text-left font-mono font-bold shrink-0">
                      <span className="text-slate-900 dark:text-white">{formatCurrency(cat.value, currency)}</span>
                      <span className="text-[10px] text-slate-400 mr-1.5">
                        ({((cat.value / (totalMonthlyExpense || 1)) * 100).toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-44 flex items-center justify-center text-xs text-slate-400 font-bold bg-slate-50 dark:bg-slate-800/30 rounded-2xl">
              لا توجد عمليات صرف مسجلة في هذه الفترة.
            </div>
          )}
        </div>

        {/* Income Source Distribution Share */}
        <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 rounded-xl">
                <PieChartIcon size={16} />
              </div>
              <h4 className="text-xs md:text-sm font-black text-slate-900 dark:text-white">توزيع مصادر الدخل</h4>
            </div>
            <span className="text-[11px] font-mono font-bold text-slate-400">
              {incomeSourceData.length} مصادر مسجلة
            </span>
          </div>

          {incomeSourceData.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              <div className="h-44 relative sm:col-span-6 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={incomeSourceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={66}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {incomeSourceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', background: '#0f172a', border: '1px solid #334155', color: '#fff', fontSize: '10px', direction: 'rtl', fontWeight: 'bold' }}
                      formatter={(v) => formatCurrency(Number(v), currency)}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="text-[9px] font-black text-slate-400 uppercase">المجموع</span>
                  <span className="text-xs font-black font-mono text-slate-900 dark:text-white mt-0.5">
                    {formatCurrency(totalMonthlyIncome, currency)}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 sm:col-span-6 max-h-44 overflow-y-auto pr-1">
                {incomeSourceData.slice(0, 5).map((source, i) => (
                  <div key={i} className="flex items-center justify-between text-xs p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: source.color }} />
                      <span className="font-bold text-slate-700 dark:text-slate-300 truncate">{source.name}</span>
                    </div>
                    <div className="text-left font-mono font-bold shrink-0">
                      <span className="text-slate-900 dark:text-white">{formatCurrency(source.value, currency)}</span>
                      <span className="text-[10px] text-slate-400 mr-1.5">
                        ({((source.value / (totalMonthlyIncome || 1)) * 100).toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-44 flex items-center justify-center text-xs text-slate-400 font-bold bg-slate-50 dark:bg-slate-800/30 rounded-2xl">
              لا توجد مصادر دخل مسجلة في هذه الفترة.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
