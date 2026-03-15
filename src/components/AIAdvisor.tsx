import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, TrendingUp, AlertCircle, CheckCircle2, ChevronRight, Loader2, RefreshCw } from 'lucide-react';
import { useAppContext } from '../store/AppContext';
import { getFinancialAdvice, getFinancialForecast, FinancialAdvice, FinancialForecast } from '../services/geminiService';
import { formatCurrency } from '../utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export const AIAdvisor: React.FC = () => {
  const { expenses, income, budget, goals, accounts, currency } = useAppContext();
  const [advice, setAdvice] = useState<FinancialAdvice[]>([]);
  const [forecast, setForecast] = useState<FinancialForecast[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchInsights = async () => {
    setIsLoading(true);
    try {
      const [adviceData, forecastData] = await Promise.all([
        getFinancialAdvice(expenses, income, budget, goals, accounts, currency),
        getFinancialForecast(expenses, income, accounts, currency)
      ]);
      setAdvice(adviceData);
      setForecast(forecastData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch AI insights:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (expenses.length > 0 && !lastUpdated) {
      fetchInsights();
    }
  }, [expenses.length]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500 bg-red-50 dark:bg-red-900/20';
      case 'medium': return 'text-amber-500 bg-amber-50 dark:bg-amber-900/20';
      case 'low': return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20';
      default: return 'text-slate-500 bg-slate-50 dark:bg-slate-900/20';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">المستشار المالي الذكي</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">نصائح وتوقعات مخصصة لك بناءً على بياناتك</p>
          </div>
        </div>
        <button
          onClick={fetchInsights}
          disabled={isLoading}
          className="p-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial Advice */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-indigo-500" />
            نصائح ذكية
          </h3>
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700"
              >
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
                <p className="text-slate-500 dark:text-slate-400">جاري تحليل بياناتك المالية...</p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {advice.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-bold text-slate-900 dark:text-white">{item.title}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getPriorityColor(item.priority)}`}>
                        {item.priority === 'high' ? 'أولوية قصوى' : item.priority === 'medium' ? 'متوسط' : 'منخفض'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">
                      {item.advice}
                    </p>
                    <div className="flex items-center gap-2 p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-indigo-600 dark:text-indigo-400 text-xs font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{item.actionItem}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Financial Forecast */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-500" />
            التوقعات المالية
          </h3>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 h-[400px]">
            {isLoading ? (
              <div className="h-full flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
                <p className="text-slate-500 dark:text-slate-400">جاري بناء التوقعات...</p>
              </div>
            ) : forecast.length > 0 ? (
              <div className="h-full flex flex-col">
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={forecast}>
                      <defs>
                        <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="month" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#64748b' }}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        tickFormatter={(value) => formatCurrency(value, currency)}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1e293b', 
                          border: 'none', 
                          borderRadius: '12px',
                          color: '#fff'
                        }}
                        formatter={(value: number) => [formatCurrency(value, currency), 'الرصيد المتوقع']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="predictedBalance" 
                        stroke="#6366f1" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorBalance)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mb-1">تحليل التوقعات</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {forecast[forecast.length - 1]?.reasoning}
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 dark:text-slate-400">
                أضف المزيد من البيانات للحصول على توقعات دقيقة
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
