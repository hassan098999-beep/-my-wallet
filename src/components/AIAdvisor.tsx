import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, TrendingUp, CircleAlert, CircleCheckBig, ChevronRight, Loader2, RefreshCcw, Lightbulb, MessageSquare } from 'lucide-react';
import { useAppContext } from '../store/AppContext';
import { getFinancialAdvice, getFinancialForecast } from '../services/geminiService';
import { FinancialAdvice, FinancialForecast } from '../types';
import { formatCurrency, cn } from '../utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Link } from 'react-router-dom';

import { isSameDay } from 'date-fns';

export const AIAdvisor: React.FC = () => {
  const { expenses, income, budget, goals, accounts, currency, dailyBudget, aiInsights, updateAIInsights } = useAppContext();
  const [advice, setAdvice] = useState<FinancialAdvice[]>([]);
  const [forecast, setForecast] = useState<FinancialForecast[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [lastAttempted, setLastAttempted] = useState<Date | null>(null);

  const fetchInsights = async (force = false) => {
    // Prevent retrying too often if it failed recently (e.g., within 1 hour)
    if (!force && lastAttempted) {
      const now = new Date();
      const diffMinutes = (now.getTime() - lastAttempted.getTime()) / (1000 * 60);
      if (diffMinutes < 60 && error) return; 
    }

    // Check cache first if not forced
    if (!force && aiInsights) {
      const lastUpdate = new Date(aiInsights.lastUpdated);
      const now = new Date();
      const diffHours = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
      
      if (diffHours < 24) {
        setAdvice(aiInsights.advice);
        setForecast(aiInsights.forecast);
        setLastUpdated(lastUpdate);
        return;
      }
    }

    setIsLoading(true);
    setError(null);
    setWarning(null);
    setLastAttempted(new Date());

    const todaySpending = expenses
      .filter(e => isSameDay(new Date(e.date), new Date()))
      .reduce((sum, e) => sum + e.amount, 0);

    try {
      const [adviceData, forecastData] = await Promise.all([
        getFinancialAdvice(expenses, income, budget, goals, accounts, currency, dailyBudget, todaySpending),
        getFinancialForecast(expenses, income, accounts, currency)
      ]);
      
      setAdvice(adviceData);
      setForecast(forecastData);
      setLastUpdated(new Date());
      
      // Update global cache
      updateAIInsights({ advice: adviceData, forecast: forecastData });
    } catch (err: any) {
      console.error("Failed to fetch AI insights:", err);
      
      const isQuotaError = err?.message?.includes('429') || err?.message?.includes('RESOURCE_EXHAUSTED');
      
      if (isQuotaError) {
        if (aiInsights) {
          // Use cached data if available, but show a warning
          setAdvice(aiInsights.advice);
          setForecast(aiInsights.forecast);
          setLastUpdated(new Date(aiInsights.lastUpdated));
          setWarning('لقد تجاوزت حد الاستخدام المجاني. يتم عرض بيانات قديمة من آخر تحليل ناجح. يمكنك إضافة مفتاح API الخاص بك من الإعدادات لتجنب هذا الانقطاع.');
        } else {
          setError('لقد تجاوزت الحد المسموح به من الاستخدام المجاني حالياً. يمكنك إضافة مفتاح API الخاص بك من صفحة الإعدادات لاستمرار الخدمة.');
        }
      } else {
        setError('حدث خطأ أثناء تحليل البيانات. يرجى المحاولة مرة أخرى.');
      }
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
    <div className="space-y-8">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-4">
          <motion.div 
            animate={{ 
              boxShadow: ["0 0 0px rgba(99, 102, 241, 0)", "0 0 20px rgba(99, 102, 241, 0.3)", "0 0 0px rgba(99, 102, 241, 0)"] 
            }}
            transition={{ duration: 3, repeat: Infinity }}
            className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner"
          >
            <Sparkles size={28} />
          </motion.div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">المستشار الذكي</h2>
              <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold rounded-full border border-emerald-500/20">AI Powered</span>
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">تحليل مخصص لبياناتك المالية</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/assistant">
            <button
              className="px-4 h-12 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all shadow-sm active:scale-95"
            >
              <MessageSquare size={18} />
              <span className="hidden sm:inline">تحدث مع المستشار</span>
            </button>
          </Link>
          <button
            onClick={() => fetchInsights(true)}
            disabled={isLoading}
            className="w-12 h-12 flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 rounded-2xl transition-all disabled:opacity-50 shadow-sm active:scale-90"
          >
            <RefreshCcw className={cn("size-6", isLoading ? 'animate-spin' : '')} />
          </button>
        </div>
      </div>

      {warning && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-800/50 rounded-2xl flex items-start gap-4 text-amber-700 dark:text-amber-400 text-sm shadow-sm"
        >
          <CircleAlert className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="font-medium leading-relaxed">{warning}</p>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Financial Advice */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-500">
              <Lightbulb size={18} />
            </div>
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">نصائح ذكية</h2>
          </div>
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-24 card shadow-xs"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-20 animate-pulse" />
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="relative z-10"
                  >
                    <Loader2 className="w-12 h-12 text-indigo-500" />
                  </motion.div>
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-medium mt-6 text-xs">جاري تحليل بياناتك...</p>
              </motion.div>
            ) : error ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20 card border-rose-100 dark:border-rose-900/30 text-center px-10 shadow-xs"
              >
                <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center text-rose-500 mb-6">
                  <CircleAlert size={40} />
                </div>
                <p className="text-slate-700 dark:text-slate-300 font-semibold mb-4 leading-tight">{error}</p>
                <button 
                  onClick={() => fetchInsights(true)}
                  className="btn-secondary text-[12px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-slate-200/80 transition-all px-4 py-2"
                >
                  إعادة المحاولة
                </button>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {advice.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="card-interactive hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-base font-semibold text-slate-900 dark:text-white leading-tight">{item.title}</h3>
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-[10px] font-semibold border",
                        item.priority === 'high' ? 'text-rose-500 bg-rose-50 border-rose-100 dark:bg-rose-900/20 dark:border-rose-500/20' : 
                        item.priority === 'medium' ? 'text-amber-500 bg-amber-50 border-amber-100 dark:bg-amber-900/20 dark:border-amber-500/20' : 
                        'text-emerald-500 bg-emerald-50 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-500/20'
                      )}>
                        {item.priority === 'high' ? 'أولوية قصوى' : item.priority === 'medium' ? 'متوسط' : 'منخفض'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-5 leading-relaxed font-medium">
                      {item.advice}
                    </p>
                    <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-indigo-600 dark:text-indigo-400 border border-slate-100 dark:border-slate-700/50">
                      <CircleCheckBig className="w-5 h-5 shrink-0" />
                      <span className="text-xs font-semibold">{item.actionItem}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Financial Forecast */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-500">
              <TrendingUp size={18} />
            </div>
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">التوقعات المالية</h2>
          </div>
          <div className="card-elevated flex flex-col h-[500px]">
            {isLoading ? (
              <div className="h-full flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-6" />
                <p className="text-slate-500 dark:text-slate-400 font-medium text-xs">جاري بناء التوقعات...</p>
              </div>
            ) : error ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-10">
                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-200 mb-6">
                  <TrendingUp size={40} />
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">لا يمكن عرض التوقعات حالياً</p>
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
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.2} />
                      <XAxis 
                        dataKey="month" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 900 }}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 900 }}
                        tickFormatter={(value) => formatCurrency(value, currency)}
                        dx={-10}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#0f172a', 
                          border: 'none', 
                          borderRadius: '16px',
                          color: '#fff',
                          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
                        }}
                        itemStyle={{ color: '#fff', fontWeight: 900, fontSize: '12px' }}
                        labelStyle={{ color: '#64748b', marginBottom: '4px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}
                        formatter={(value: any) => [formatCurrency(value, currency), 'الرصيد المتوقع']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="predictedBalance" 
                        stroke="#6366f1" 
                        strokeWidth={4}
                        fillOpacity={1} 
                        fill="url(#colorBalance)" 
                        animationDuration={2000}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-1 h-full bg-indigo-500" />
                  <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold mb-1">تحليل التوقعات</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    {forecast[forecast.length - 1]?.reasoning}
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center px-10">
                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-200 mb-6">
                  <TrendingUp size={40} />
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">أضف المزيد من البيانات للحصول على توقعات دقيقة</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
