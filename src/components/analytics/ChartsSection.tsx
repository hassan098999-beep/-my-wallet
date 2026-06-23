import React from 'react';
import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { ChartColumn as BarChart3, TrendingUp, ChartPie as PieChartIcon, Activity } from 'lucide-react';
import { formatCurrency, cn } from '../../utils';
import { DynamicIcon } from '../DynamicIcon';

interface ChartsSectionProps {
  chartSubTab: 'daily' | 'monthly';
  setChartSubTab: (tab: 'daily' | 'monthly') => void;
  isReady: boolean;
  dailyData: any[];
  monthlyData: any[];
  dailyPerformance: { data: any[]; overBudgetDays: number; performanceScore: number; avgDailySpending: number };
  categoryData: any[];
  incomeSourceData: any[];
  totalMonthlyExpense: number;
  totalMonthlyIncome: number;
  dailyBudget: number;
  currency: string;
  width: number;
  itemVariants: any;
}

export const ChartsSection: React.FC<ChartsSectionProps> = ({
  chartSubTab,
  setChartSubTab,
  isReady,
  dailyData,
  monthlyData,
  dailyPerformance,
  categoryData,
  incomeSourceData,
  totalMonthlyExpense,
  totalMonthlyIncome,
  dailyBudget,
  currency,
  width,
  itemVariants,
}) => {
  return (
    <div className="space-y-6">
      {/* Dynamic Top Graph Container */}
      <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-3xl border border-slate-100 dark:border-slate-850 shadow-sm relative overflow-hidden group">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-505/10 rounded-xl text-indigo-500 bg-indigo-500/10">
              <BarChart3 size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">الرسم التفاعلي الرئيس</h3>
              <p className="text-[9px] font-bold text-slate-400">انقر لتغيير التباين بين اليومي والسنوي</p>
            </div>
          </div>

          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl w-full sm:w-auto self-stretch sm:self-auto border border-slate-200/40 dark:border-slate-700/40">
            {['daily', 'monthly'].map((tab) => (
              <button
                key={tab}
                onClick={() => setChartSubTab(tab as any)}
                className={cn(
                  "flex-1 sm:flex-none px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all",
                  chartSubTab === tab ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                )}
              >
                {tab === 'daily' ? 'يومي' : 'سنوي'}
              </button>
            ))}
          </div>
        </div>

        <div className="h-56 md:h-64 w-full">
          {isReady ? (
            <ResponsiveContainer width="100%" height="100%">
              {chartSubTab === 'daily' ? (
                <BarChart data={dailyData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.4} />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: width < 640 ? 7 : 9, fontWeight: 700, fill: '#94a3b8' }}
                    interval={width < 640 ? 5 : 3}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: width < 640 ? 7 : 9, fontWeight: 700, fill: '#94a3b8' }}
                    width={width < 640 ? 25 : 35}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc', opacity: 0.1 }}
                    contentStyle={{ borderRadius: '14px', background: '#1e293b', border: 'none', color: '#fff', fontSize: '10px', direction: 'rtl' }}
                    formatter={(value: any, name: any) => [formatCurrency(value, currency), name === 'incomeAmount' ? 'الدخل' : 'المصاريف']}
                  />
                  <Bar dataKey="incomeAmount" name="الدخل" fill="#10b981" radius={[3, 3, 0, 0]} barSize={width < 640 ? 4 : 10} />
                  <Bar dataKey="expenseAmount" name="المصاريف" fill="#f43f5e" radius={[3, 3, 0, 0]} barSize={width < 640 ? 4 : 10} />
                </BarChart>
              ) : (
                <BarChart data={monthlyData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.4} />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: width < 640 ? 7 : 9, fontWeight: 700, fill: '#94a3b8' }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: width < 640 ? 7 : 9, fontWeight: 700, fill: '#94a3b8' }}
                    width={width < 640 ? 25 : 35}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc', opacity: 0.1 }}
                    contentStyle={{ borderRadius: '14px', background: '#1e293b', border: 'none', color: '#fff', fontSize: '10px', direction: 'rtl' }}
                    formatter={(value: any, name: any) => [formatCurrency(value, currency), name]}
                  />
                  <Bar dataKey="income" name="الدخل السنوي" fill="#10b981" radius={[3, 3, 0, 0]} barSize={width < 640 ? 6 : 14} />
                  <Bar dataKey="expense" name="المصاريف السنوية" fill="#f43f5e" radius={[3, 3, 0, 0]} barSize={width < 640 ? 6 : 14} />
                </BarChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-50/50 dark:bg-slate-800/10 rounded-2xl animate-pulse text-xs text-slate-400 font-bold">
              تحديث البيانات البيانية...
            </div>
          )}
        </div>
      </motion.div>

      {/* Side-By-Side Distribution Circle Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expenses Category Distribution Share */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-850 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-rose-500/10 rounded-lg text-rose-500">
              <PieChartIcon size={16} />
            </div>
            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase leading-none">توزيع فئات المصاريف</h4>
          </div>

          {categoryData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <div className="h-44 relative md:col-span-6 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '10px', background: '#334155', border: 'none', color: '#fff', fontSize: '9px' }}
                      formatter={(v) => formatCurrency(Number(v), currency)}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="text-[8px] font-black text-slate-400 leading-none">الإجمالي</span>
                  <span className="text-xs font-black text-slate-900 dark:text-white mt-1">
                    {formatCurrency(totalMonthlyExpense, currency)}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 md:col-span-6 max-h-44 overflow-y-auto pr-1">
                {categoryData.slice(0, 5).map((cat, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px] p-1.5 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      <span className="font-bold text-slate-700 dark:text-slate-300 truncate max-w-[90px]">{cat.name}</span>
                    </div>
                    <span className="font-black text-slate-800 dark:text-slate-200">
                      {((cat.value / (totalMonthlyExpense || 1)) * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-44 flex items-center justify-center text-xs text-slate-400 font-bold">
              لا توجد عمليات صرف مسجلة لهذه الفترة.
            </div>
          )}
        </motion.div>

        {/* Income Source Distribution Share */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-850 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-emerald-505/10 rounded-lg text-emerald-500 bg-emerald-500/10">
              <PieChartIcon size={16} />
            </div>
            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase leading-none">توزيع مصادر الدخل</h4>
          </div>

          {incomeSourceData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <div className="h-44 relative md:col-span-6 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={incomeSourceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {incomeSourceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '10px', background: '#334155', border: 'none', color: '#fff', fontSize: '9px' }}
                      formatter={(v) => formatCurrency(Number(v), currency)}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="text-[8px] font-black text-slate-400 leading-none">الإجمالي</span>
                  <span className="text-xs font-black text-slate-900 dark:text-white mt-1">
                    {formatCurrency(totalMonthlyIncome, currency)}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 md:col-span-6 max-h-44 overflow-y-auto pr-1">
                {incomeSourceData.slice(0, 5).map((source, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px] p-1.5 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: source.color }} />
                      <span className="font-bold text-slate-700 dark:text-slate-300 truncate max-w-[90px]">{source.name}</span>
                    </div>
                    <span className="font-black text-slate-800 dark:text-slate-200">
                      {((source.value / (totalMonthlyIncome || 1)) * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-44 flex items-center justify-center text-xs text-slate-400 font-bold">
              لا توجد مصادر دخل مسجلة لهذه الفترة.
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};
