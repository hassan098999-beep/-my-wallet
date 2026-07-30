import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Trophy, Trash2, Calendar, Target, ShieldCheck, Flame, ChevronRight, CheckSquare, Square } from 'lucide-react';
import { useAppContext } from '../store/AppContext';
import { getSmartSavingChallenge } from '../services/geminiService';
import { SmartSavingChallenge } from '../types';
import { formatCurrency, hapticFeedback, getBudgetMonth } from '../utils';
import toast from 'react-hot-toast';

export const SmartSavingChallengeCard: React.FC = () => {
  const { 
    expenses, 
    categories, 
    budgets, 
    firstDayOfMonth,
    currency, 
    activeChallenge, 
    updateActiveChallenge 
  } = useAppContext();

  const currentMonth = getBudgetMonth(new Date(), firstDayOfMonth || 1);
  const budget = budgets?.find(b => b.month === currentMonth) || null;

  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [tempChallenge, setTempChallenge] = useState<SmartSavingChallenge | null>(null);
  const [checkedTips, setCheckedTips] = useState<Record<number, boolean>>({});

  // Loading steps animation
  useEffect(() => {
    if (!loading) return;
    
    const steps = [
      'جاري فحص فئات الاستهلاك والعمليات الأخيرة... 🔍',
      'جاري تحليل نمط إنفاقك الشهري... 📊',
      'جاري تحديد فرص التوفير الذكية في تونس... 💡',
      'جاري صياغة التحدي المخصص بالذكاء الاصطناعي... ✨'
    ];
    
    let currentStep = 0;
    setLoadingStep(steps[currentStep]);
    
    const interval = setInterval(() => {
      currentStep = (currentStep + 1) % steps.length;
      setLoadingStep(steps[currentStep]);
    }, 2200);
    
    return () => clearInterval(interval);
  }, [loading]);

  // Load checked tips progress from localStorage for the active challenge
  useEffect(() => {
    if (activeChallenge) {
      const savedProgress = localStorage.getItem(`challenge_progress_${activeChallenge.title}`);
      if (savedProgress) {
        try {
          setCheckedTips(JSON.parse(savedProgress));
        } catch (e) {
          setCheckedTips({});
        }
      } else {
        setCheckedTips({});
      }
    } else {
      setCheckedTips({});
    }
  }, [activeChallenge]);

  const handleGenerate = async () => {
    hapticFeedback('medium');
    setLoading(true);
    setTempChallenge(null);
    try {
      const challenge = await getSmartSavingChallenge(expenses, categories, budget, currency);
      setTempChallenge(challenge);
    } catch (error: any) {
      console.error(error);
      toast.error('حدث خطأ أثناء الاتصال بـ Gemini API. تم استخدام تحدي بديل ذكي.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => {
    if (!tempChallenge) return;
    hapticFeedback('heavy');
    const challengeWithDate: SmartSavingChallenge = {
      ...tempChallenge,
      acceptedAt: new Date().toISOString(),
      isCompleted: false
    };
    updateActiveChallenge(challengeWithDate);
    setTempChallenge(null);
    toast.success('تم تفعيل التحدي الذكي! حظاً موفقاً 🚀');
  };

  const handleCancelTemp = () => {
    hapticFeedback('light');
    setTempChallenge(null);
  };

  const handleAbandon = async () => {
    if (!window.confirm('هل أنت متأكد من إلغاء التحدي الحالي؟ لن يتم حفظ أي تقدم.')) return;
    hapticFeedback('medium');
    updateActiveChallenge(undefined);
    toast.success('تم إلغاء التحدي الحالي.');
  };

  const handleToggleTip = (index: number) => {
    hapticFeedback('light');
    const updated = {
      ...checkedTips,
      [index]: !checkedTips[index]
    };
    setCheckedTips(updated);
    if (activeChallenge) {
      localStorage.setItem(`challenge_progress_${activeChallenge.title}`, JSON.stringify(updated));
    }
  };

  const handleComplete = () => {
    hapticFeedback('heavy');
    // Play celebratory sound or logic
    toast.success('ألف مبروك! 🎉 لقد نجحت في إكمال التحدي المالي بامتياز ووفرت ميزانيتك!', {
      duration: 6000,
      icon: '🏆'
    });
    updateActiveChallenge(undefined);
  };

  const difficultyColors = {
    'سهل': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    'متوسط': 'bg-amber-500/15 text-amber-400 border-amber-500/25',
    'صعب': 'bg-rose-500/15 text-rose-400 border-rose-500/25'
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2.5rem] shadow-2xl relative overflow-hidden text-right" dir="rtl">
      {/* Ambient glowing effect */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex items-center justify-between mb-5">
        <Sparkles size={18} className="text-violet-400 animate-pulse" />
        <div>
          <span className="text-[9px] font-black text-violet-400 uppercase tracking-widest block">الذكاء الاصطناعي والميزانية</span>
          <h4 className="text-base font-black text-white mt-0.5">تحدي التوفير الذكي (AI)</h4>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* State 1: Loading */}
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="py-12 flex flex-col items-center justify-center text-center space-y-4"
          >
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-violet-500/20 animate-ping" />
              <div className="absolute inset-2 rounded-full border-4 border-indigo-500/30 animate-pulse" />
              <div className="w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
            </div>
            <div className="space-y-1.5 px-4">
              <p className="text-xs text-slate-400 font-bold">جاري التحليل الإحصائي...</p>
              <p className="text-sm text-indigo-300 font-black leading-relaxed">{loadingStep}</p>
            </div>
          </motion.div>
        )}

        {/* State 2: Temp Preview (Ready to Accept) */}
        {!loading && tempChallenge && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-5"
          >
            <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${difficultyColors[tempChallenge.difficulty]}`}>
                  {tempChallenge.difficulty}
                </span>
                <h5 className="text-sm font-black text-indigo-300">{tempChallenge.title}</h5>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mt-1">{tempChallenge.description}</p>
            </div>

            {/* Analysis Row */}
            {tempChallenge.analysis && (
              <div className="p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800 text-xs text-slate-400 leading-relaxed">
                <span className="font-black text-violet-400 block mb-1">🔍 سبب الاختيار:</span>
                {tempChallenge.analysis}
              </div>
            )}

            {/* Target & Duration */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-center flex flex-col items-center">
                <Calendar size={15} className="text-slate-400 mb-1" />
                <span className="text-[10px] text-slate-500 font-black">المدة</span>
                <span className="text-xs font-black text-white mt-0.5">{tempChallenge.durationDays} يوم</span>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-center flex flex-col items-center">
                <Target size={15} className="text-violet-400 mb-1" />
                <span className="text-[10px] text-slate-500 font-black">التوفير المستهدف</span>
                <span className="text-xs font-black text-violet-300 mt-0.5">{formatCurrency(tempChallenge.targetAmount, currency)}</span>
              </div>
            </div>

            {/* Tips Preview */}
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 font-black block">نصائح النجاح في التحدي:</span>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {tempChallenge.tips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-right">
                    <ChevronRight size={14} className="text-indigo-400 shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Accept / Cancel Actions */}
            <div className="flex gap-2.5 pt-2">
              <button
                onClick={handleAccept}
                className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
              >
                تفعيل التحدي والبدء 🚀
              </button>
              <button
                onClick={handleCancelTemp}
                className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-black text-xs rounded-xl transition-all cursor-pointer border border-slate-700"
              >
                تراجع
              </button>
            </div>
          </motion.div>
        )}

        {/* State 3: Active Challenge Running */}
        {!loading && !tempChallenge && activeChallenge && (
          <motion.div
            key="active"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-4"
          >
            <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-950/20 to-indigo-950/30 border border-violet-500/15 space-y-3">
              <div className="flex items-center justify-between">
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${difficultyColors[activeChallenge.difficulty]}`}>
                  صعوبة: {activeChallenge.difficulty}
                </span>
                <span className="flex items-center gap-1.5 text-[10px] text-violet-400 font-black animate-pulse">
                  <Flame size={12} className="text-rose-500" />
                  تحدي نشط
                </span>
              </div>
              <div>
                <h5 className="text-sm font-black text-white">{activeChallenge.title}</h5>
                <p className="text-[11px] text-slate-400 leading-relaxed mt-1">{activeChallenge.description}</p>
              </div>
            </div>

            {/* Tracker Details */}
            <div className="grid grid-cols-2 gap-3.5">
              <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800 text-right">
                <span className="text-[9px] text-slate-500 font-black block">التوفير المستهدف</span>
                <span className="text-xs font-black text-violet-400 font-sans tracking-tight">{formatCurrency(activeChallenge.targetAmount, currency)}</span>
              </div>
              <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800 text-right">
                <span className="text-[9px] text-slate-500 font-black block">الفئة المستهدفة</span>
                <span className="text-xs font-black text-white">{activeChallenge.categoryName}</span>
              </div>
            </div>

            {/* Checklist of steps */}
            <div className="space-y-2 pt-1">
              <span className="text-[10px] text-slate-400 font-black block">قائمة المهام للنجاح:</span>
              <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                {activeChallenge.tips.map((tip, idx) => {
                  const isChecked = !!checkedTips[idx];
                  return (
                    <button
                      key={idx}
                      onClick={() => handleToggleTip(idx)}
                      className="w-full flex items-start gap-2.5 p-2 bg-slate-950/20 hover:bg-slate-950/50 border border-slate-800/60 hover:border-slate-800 rounded-xl text-right transition-all cursor-pointer text-xs"
                    >
                      <span className="shrink-0 mt-0.5">
                        {isChecked ? (
                          <CheckSquare size={15} className="text-indigo-400" />
                        ) : (
                          <Square size={15} className="text-slate-500" />
                        )}
                      </span>
                      <span className={isChecked ? 'line-through text-slate-500' : 'text-slate-300'}>
                        {tip}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions for Active */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleComplete}
                className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-500/10 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trophy size={13} />
                <span>أكملت التحدي بنجاح! 🎉</span>
              </button>
              <button
                onClick={handleAbandon}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 rounded-xl transition-all cursor-pointer border border-slate-700"
                title="إلغاء التحدي"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </motion.div>
        )}

        {/* State 4: Empty (Ready to Generate) */}
        {!loading && !tempChallenge && !activeChallenge && (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-6 flex flex-col items-center justify-center text-center space-y-4"
          >
            <div className="w-12 h-12 bg-violet-500/10 border border-violet-500/20 rounded-2xl flex items-center justify-center text-violet-400 shadow-inner">
              <Trophy size={22} className="animate-pulse" />
            </div>
            <div className="space-y-1.5 px-4">
              <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                اكتشف نمط استهلاكك الحقيقي ووفر فلوسك بذكاء! اضغط أدناه لتحليل مصاريفك وتوليد تحدي توفير أسبوعي ذكي مخصص لك بالكامل.
              </p>
            </div>
            <button
              onClick={handleGenerate}
              className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Sparkles size={13} className="animate-spin" />
              <span>توليد تحدي توفير ذكي ✨</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
