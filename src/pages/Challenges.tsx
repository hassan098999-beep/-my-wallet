import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Award, Target, Zap, Medal, Star, CheckCircle, TrendingUp, Sparkles, Flame, Loader2, Bot } from 'lucide-react';
import { cn, formatCurrency, hapticFeedback } from '../utils';
import { useAppContext } from '../store/AppContext';
import toast from 'react-hot-toast';

export default function Challenges() {
  const { currency, expenses } = useAppContext();
  
  const [activeChallenges, setActiveChallenges] = useState<string[]>(['c1']);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  
  const [challenges, setChallenges] = useState([
    { id: 'c1', title: 'تحدي 30 يوم بدون مطاعم', desc: 'وفر مصاريف الأكل بالخارج واطبخ في المنزل', reward: '50 نقطة', progress: 40 },
    { id: 'c2', title: 'توفير 10% من الراتب', desc: 'اقتطع 10% فور استلام الراتب هذا الشهر', reward: 'شارة المتسوق', progress: 0 },
    { id: 'c3', title: 'أسبوع القهوة المنزلية', desc: 'استبدل قهوة الكافيه بقهوة من صنع يديك', reward: '20 نقطة', progress: 80 },
  ]);

  const toggleChallenge = (id: string) => {
    hapticFeedback('light');
    if (activeChallenges.includes(id)) {
      setActiveChallenges(activeChallenges.filter(c => c !== id));
    } else {
      setActiveChallenges([...activeChallenges, id]);
    }
  };

  const generateAIChallenges = async () => {
    hapticFeedback('medium');
    setIsLoadingAI(true);
    try {
      // Create a simplified expenses array to send
      const recentExpenses = expenses.slice(0, 50).map(e => ({
        amount: e.amount,
        category: e.categoryId,
        note: e.note,
        date: e.date
      }));

      const res = await fetch('/api/suggest-challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expenses: recentExpenses })
      });

      if (!res.ok) throw new Error('Failed to fetch AI challenges');
      
      const data = await res.json();
      
      if (data.challenges && Array.isArray(data.challenges)) {
        setChallenges(prev => {
          // Keep existing active challenges and add the new ones
          const activeExisting = prev.filter(c => activeChallenges.includes(c.id));
          return [...activeExisting, ...data.challenges];
        });
        toast.success('تم إنشاء تحديات ذكية بناءً على مصاريفك!');
      }
    } catch (error) {
      console.error(error);
      toast.error('لم نتمكن من توليد تحديات ذكية حالياً. جرب لاحقاً.');
    } finally {
      setIsLoadingAI(false);
    }
  };

  const badges = [
    { id: 'b1', title: 'بطل التوفير', desc: 'وفرت 500 دينار', icon: Award, color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', unlocked: true },
    { id: 'b2', title: 'نينجا الميزانية', desc: 'شهر بدون تجاوز الميزانية', icon: Medal, color: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', unlocked: true },
    { id: 'b3', title: 'نار الادخار', desc: 'سجل ادخار متتالي لـ 3 أشهر', icon: Flame, color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20', unlocked: false },
    { id: 'b4', title: 'المتسوق الذكي', desc: 'أقل صرف على الرفاهية', icon: Star, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', unlocked: false },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 md:pb-0" dir="rtl">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Target className="text-emerald-500" size={28} />
            التحديات والمكافآت
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">حفز نفسك وحقق أهدافك بمتعة</p>
        </div>
      </header>

      {/* Badges Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="text-indigo-500" size={20} />
          <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">أوسمة الإنجاز</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {badges.map(badge => (
            <motion.div 
              key={badge.id}
              whileHover={{ y: -4 }}
              className={cn(
                "p-4 rounded-2xl border-2 flex flex-col items-center text-center transition-all relative overflow-hidden",
                badge.unlocked ? `${badge.bg} ${badge.border}` : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60 grayscale hover:grayscale-0"
              )}
            >
              {!badge.unlocked && (
                <div className="absolute top-2 right-2">
                  <span className="text-[10px] font-black bg-slate-200 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full">مغلق</span>
                </div>
              )}
              <div className={cn("w-14 h-14 rounded-full flex items-center justify-center mb-3", badge.unlocked ? "bg-white dark:bg-slate-800 shadow-md" : "bg-slate-200 dark:bg-slate-800")}>
                <badge.icon size={28} className={badge.unlocked ? badge.color : 'text-slate-400'} />
              </div>
              <h3 className={cn("font-black text-sm mb-1", badge.unlocked ? "text-slate-900 dark:text-white" : "text-slate-500")}>{badge.title}</h3>
              <p className="text-[10px] font-bold text-slate-500 leading-tight">{badge.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Active Challenges Section */}
      <section className="mt-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-emerald-500" size={20} />
            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">تحديات الادخار المتاحة</h2>
          </div>
          <button
            onClick={generateAIChallenges}
            disabled={isLoadingAI}
            className="bg-indigo-500/10 hover:bg-indigo-500 text-indigo-600 dark:text-indigo-400 hover:text-white transition-all px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border border-indigo-500/20 active:scale-95"
          >
            {isLoadingAI ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Bot size={16} />
            )}
            تحديات مخصصة بالذكاء الاصطناعي
          </button>
        </div>
        <div className="space-y-4">
          {challenges.map(challenge => {
            const isActive = activeChallenges.includes(challenge.id);
            return (
              <div 
                key={challenge.id} 
                className={cn(
                  "p-4 rounded-2xl border-2 transition-all relative overflow-hidden group",
                  isActive ? "border-emerald-500/40 bg-emerald-50/30 dark:bg-emerald-950/20" : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                )}
              >
                {isActive && (
                  <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-bl-full -z-10" />
                )}
                
                <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-black text-slate-900 dark:text-white">{challenge.title}</h3>
                      {isActive && <span className="bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse-soft">نشط الآن</span>}
                    </div>
                    <p className="text-xs text-slate-500 font-medium mb-3">{challenge.desc}</p>
                    
                    {isActive ? (
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">التقدم: {challenge.progress}%</span>
                          <span className="text-slate-400">المكافأة: {challenge.reward}</span>
                        </div>
                        <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${challenge.progress}%` }}
                            className="h-full bg-emerald-500 rounded-full"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-[11px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 inline-block px-3 py-1 rounded-lg">
                        المكافأة: {challenge.reward}
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => toggleChallenge(challenge.id)}
                    className={cn(
                      "shrink-0 py-2.5 px-6 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 active:scale-95",
                      isActive 
                        ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                        : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                    )}
                  >
                    {isActive ? (
                      <>
                        <CheckCircle size={16} />
                        التخلي عن التحدي
                      </>
                    ) : (
                      <>
                        <Zap size={16} />
                        ابدأ التحدي
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Motivation Banner */}
      <div className="mt-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden shadow-lg shadow-indigo-500/20">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl"></div>
        <div className="relative z-10 flex items-center gap-4 text-right sm:text-right w-full sm:w-auto">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
            <Target size={24} className="text-white" />
          </div>
          <div>
            <h3 className="font-black text-lg">الاستمرارية هي سر النجاح!</h3>
            <p className="text-white/80 text-xs font-medium mt-1">أكمل تحديين إضافيين هذا الأسبوع للحصول على شارة بطل الأسبوع.</p>
          </div>
        </div>
        <button className="bg-white text-indigo-600 px-6 py-2.5 rounded-xl font-black text-sm hover:bg-indigo-50 transition-colors w-full sm:w-auto relative z-10 shadow-md">
          عرض تفاصيل التقدم
        </button>
      </div>

    </div>
  );
}
