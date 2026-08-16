import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Target, 
  Sparkles, 
  Flame, 
  Bot, 
  Loader2, 
  Filter, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Trophy,
  Coffee,
  ShieldCheck,
  UtensilsCrossed,
  ShoppingBag
} from 'lucide-react';
import { useWeeklyChallenges } from '../hooks/useWeeklyChallenges';
import { ChallengesStatsHeader } from '../components/challenges/ChallengesStatsHeader';
import { WeeklyChallengeCard } from '../components/challenges/WeeklyChallengeCard';
import { ChallengeBadgesSection } from '../components/challenges/ChallengeBadgesSection';
import { CreateCustomChallengeModal } from '../components/challenges/CreateCustomChallengeModal';
import { CelebrationModal } from '../components/challenges/CelebrationModal';
import { useAppContext } from '../store/AppContext';
import { getSmartSavingChallenge } from '../services/geminiService';
import { formatCurrency, hapticFeedback } from '../utils';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { ar } from 'date-fns/locale';
import toast from 'react-hot-toast';

export default function Challenges() {
  const { expenses, categories, budgets, firstDayOfMonth, currency } = useAppContext();

  const {
    challenges,
    activeChallenges,
    availableChallenges,
    completedChallenges,
    points,
    badges,
    totalEstimatedSaved,
    maxStreakDays,
    celebrationChallenge,
    setCelebrationChallenge,
    startChallenge,
    abandonChallenge,
    toggleDayManualCheck,
    claimReward,
    createCustomChallenge,
    deleteChallenge,
    resetAllChallengesToDefault
  } = useWeeklyChallenges();

  // Local State
  const [activeTab, setActiveTab] = useState<'active' | 'available' | 'completed'>('active');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  // Week range string
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const weekRangeStr = `${format(weekStart, 'd MMM', { locale: ar })} - ${format(weekEnd, 'd MMM yyyy', { locale: ar })}`;

  // AI Smart Weekly Challenge Generator
  const handleGenerateAIChallenge = async () => {
    hapticFeedback('medium');
    setIsLoadingAI(true);
    try {
      const budgetMonth = format(now, 'yyyy-MM');
      const budget = budgets?.find(b => b.month === budgetMonth) || null;
      
      const aiChallenge = await getSmartSavingChallenge(expenses, categories, budget, currency);

      if (aiChallenge && aiChallenge.title) {
        createCustomChallenge({
          title: `تحدي الذكاء الاصطناعي: ${aiChallenge.title}`,
          description: aiChallenge.description || aiChallenge.analysis || 'تحدي مقترح بذكاء بناءً على أنماط نفقاتك الأخيرة.',
          type: 'custom',
          icon: 'Sparkles',
          rewardPoints: 50,
          estimatedSavingTND: aiChallenge.targetAmount || 35,
          targetDays: 7,
          tips: aiChallenge.tips || [
            'ركز على ترشيد هذه الفئة طوال أيام الأسبوع الحالي.',
            'سجل كل مصروف فوراً لتفادي تجاوز السقف.'
          ]
        });
        setActiveTab('active');
        toast.success('تم إنشاء التحدي الذكي المخصص وتفعيله للأسبوع بنجاح! ✨');
      }
    } catch (error) {
      console.error(error);
      toast.error('تعذر الاتصال بـ Gemini AI لتوليد التحدي. تم استخدام التحديات الذكية المتاحة.');
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Filter challenges based on tab and type filter
  const displayedChallenges = (
    activeTab === 'active' 
      ? activeChallenges 
      : activeTab === 'available' 
        ? availableChallenges 
        : completedChallenges
  ).filter(c => {
    if (selectedTypeFilter === 'all') return true;
    return c.type === selectedTypeFilter;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-20 md:pb-8" dir="rtl">
      {/* 1. Gamified Header & Summary Stats */}
      <ChallengesStatsHeader
        points={points}
        maxStreak={maxStreakDays}
        totalSaved={totalEstimatedSaved}
        completedCount={completedChallenges.length}
        activeCount={activeChallenges.length}
        weekRangeStr={weekRangeStr}
        onOpenCustomModal={() => {
          hapticFeedback('light');
          setIsCustomModalOpen(true);
        }}
        onResetToDefault={resetAllChallengesToDefault}
      />

      {/* 2. AI Generator & Navigation Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
          <button
            onClick={() => {
              hapticFeedback('light');
              setActiveTab('active');
            }}
            className={`flex-1 md:flex-initial px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'active'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Flame size={14} className={activeTab === 'active' ? 'text-emerald-500 animate-pulse' : ''} />
            التحديات النشطة
            <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.2 rounded-full text-[10px]">
              {activeChallenges.length}
            </span>
          </button>

          <button
            onClick={() => {
              hapticFeedback('light');
              setActiveTab('available');
            }}
            className={`flex-1 md:flex-initial px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'available'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Target size={14} />
            التحديات المتاحة
            <span className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.2 rounded-full text-[10px]">
              {availableChallenges.length}
            </span>
          </button>

          <button
            onClick={() => {
              hapticFeedback('light');
              setActiveTab('completed');
            }}
            className={`flex-1 md:flex-initial px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'completed'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Trophy size={14} className="text-amber-500" />
            المكتملة
            <span className="bg-purple-500/10 text-purple-600 dark:text-purple-400 px-1.5 py-0.2 rounded-full text-[10px]">
              {completedChallenges.length}
            </span>
          </button>
        </div>

        {/* AI Action Button */}
        <button
          onClick={handleGenerateAIChallenge}
          disabled={isLoadingAI}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 hover:from-indigo-500 hover:to-purple-600 text-indigo-600 dark:text-indigo-400 hover:text-white border border-indigo-500/20 font-black text-xs transition-all shadow-xs flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
        >
          {isLoadingAI ? (
            <Loader2 size={16} className="animate-spin text-indigo-500" />
          ) : (
            <Bot size={16} />
          )}
          <span>تحدي ذكي مخصص بالـ AI ✨</span>
        </button>
      </div>

      {/* 3. Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => {
            hapticFeedback('light');
            setSelectedTypeFilter('all');
          }}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
            selectedTypeFilter === 'all'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          كافة التحديات
        </button>

        <button
          onClick={() => {
            hapticFeedback('light');
            setSelectedTypeFilter('no_coffee');
          }}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
            selectedTypeFilter === 'no_coffee'
              ? 'bg-amber-500 text-white border-transparent shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
          }`}
        >
          <Coffee size={13} />
          أسبوع بدون قهوة
        </button>

        <button
          onClick={() => {
            hapticFeedback('light');
            setSelectedTypeFilter('no_spend');
          }}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
            selectedTypeFilter === 'no_spend'
              ? 'bg-emerald-500 text-white border-transparent shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
          }`}
        >
          <ShieldCheck size={13} />
          لا شراء / صفر مصاريف
        </button>

        <button
          onClick={() => {
            hapticFeedback('light');
            setSelectedTypeFilter('home_cooking');
          }}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
            selectedTypeFilter === 'home_cooking'
              ? 'bg-rose-500 text-white border-transparent shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
          }`}
        >
          <UtensilsCrossed size={13} />
          طبخ منزلي ومقاطعة المطاعم
        </button>

        <button
          onClick={() => {
            hapticFeedback('light');
            setSelectedTypeFilter('grocery_cap');
          }}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
            selectedTypeFilter === 'grocery_cap'
              ? 'bg-orange-500 text-white border-transparent shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
          }`}
        >
          <ShoppingBag size={13} />
          سقف قفة الأسبوع
        </button>
      </div>

      {/* 4. Challenges List */}
      <div className="space-y-4">
        {displayedChallenges.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 text-center border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
              <Target size={32} />
            </div>
            <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
              لا توجد تحديات في هذا القسم حالياً
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {activeTab === 'active'
                ? 'ليس لديك تحديات نشطة حالياً. اختر تحدياً من "التحديات المتاحة" أو أنشئ تحدياً مخصصاً!'
                : activeTab === 'completed'
                  ? 'لم تكمل أي تحدٍ بعد هذا الأسبوع. التزم بالتحديات النشطة واستلم مكافآتك!'
                  : 'تم تفعيل جميع التحديات المتاحة لهذا الأسبوع!'}
            </p>
            {activeTab === 'active' && (
              <button
                onClick={() => setActiveTab('available')}
                className="px-5 py-2.5 rounded-2xl bg-emerald-500 text-white font-black text-xs shadow-md shadow-emerald-500/20"
              >
                تصفح التحديات المتاحة
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            <AnimatePresence>
              {displayedChallenges.map(challenge => (
                <WeeklyChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  onStart={startChallenge}
                  onAbandon={abandonChallenge}
                  onToggleCheck={toggleDayManualCheck}
                  onClaim={claimReward}
                  onDelete={deleteChallenge}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* 5. Badges & Medals Section */}
      <ChallengeBadgesSection badges={badges} />

      {/* 6. Motivation Card */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6 rounded-3xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3.5 text-right">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
            <Sparkles size={24} className="text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-black">
              الانضباط الأسبوعي يصنع الثروة العائلية 📈
            </h3>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              توفير 5 إلى 10 دنانير يومياً عبر التحديات يعني أكثر من 300 دينار مدخرات إضافية شهرياً لعائلتك.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            hapticFeedback('light');
            setIsCustomModalOpen(true);
          }}
          className="px-5 py-2.5 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 font-black text-xs shrink-0 shadow-md transition-all active:scale-95 flex items-center gap-1.5"
        >
          <Plus size={15} />
          تحدي جديد
        </button>
      </div>

      {/* Custom Challenge Modal */}
      <CreateCustomChallengeModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onCreate={createCustomChallenge}
      />

      {/* Celebratory Reward Modal */}
      <CelebrationModal
        challenge={celebrationChallenge}
        onClose={() => setCelebrationChallenge(null)}
      />
    </div>
  );
}
