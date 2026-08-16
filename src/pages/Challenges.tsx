import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Target, 
  Sparkles, 
  Flame, 
  Bot, 
  Loader2, 
  Trophy,
  Coffee,
  ShieldCheck,
  UtensilsCrossed,
  ShoppingBag,
  Award,
  Sandwich,
  TrendingUp,
  Footprints,
  FileCheck,
  Zap,
  Soup,
  PiggyBank,
  Plus,
  RotateCcw,
  Search,
  CheckCircle2
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
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function Challenges() {
  const { expenses, categories, budgets, currency } = useAppContext();

  const {
    challenges,
    activeChallenges,
    availableChallenges,
    completedChallenges,
    points,
    currentLevel,
    nextLevel,
    levelProgressPercentage,
    badges,
    isDailyBoxAvailable,
    totalEstimatedSaved,
    maxStreakDays,
    celebrationChallenge,
    setCelebrationChallenge,
    startChallenge,
    abandonChallenge,
    toggleDayManualCheck,
    claimReward,
    openDailyMysteryBox,
    createCustomChallenge,
    deleteChallenge,
    resetAllChallengesToDefault
  } = useWeeklyChallenges();

  // Local Navigation State
  const [mainTab, setMainTab] = useState<'active' | 'available' | 'badges' | 'completed'>('active');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  // AI Smart Weekly Challenge Generator
  const handleGenerateAIChallenge = async () => {
    hapticFeedback('medium');
    setIsLoadingAI(true);
    try {
      const now = new Date();
      const budgetMonth = format(now, 'yyyy-MM');
      const budget = budgets?.find(b => b.month === budgetMonth) || null;
      
      const aiChallenge = await getSmartSavingChallenge(expenses, categories, budget, currency);

      if (aiChallenge && aiChallenge.title) {
        createCustomChallenge({
          title: `تحدي الذكاء الاصطناعي: ${aiChallenge.title}`,
          description: aiChallenge.description || aiChallenge.analysis || 'تحدي مقترح بذكاء بناءً على أنماط نفقاتك الأخيرة.',
          type: 'custom',
          category: 'lifestyle_fun',
          icon: 'Sparkles',
          rewardPoints: 55,
          estimatedSavingTND: aiChallenge.targetAmount || 35,
          targetDays: 7,
          tips: aiChallenge.tips || [
            'ركز على ترشيد هذه الفئة طوال أيام الأسبوع الحالي.',
            'سجل كل مصروف فوراً لتفادي تجاوز السقف.'
          ]
        });
        setMainTab('active');
        toast.success('تم إنشاء التحدي الذكي وتفعيله للأسبوع بنجاح! ✨');
      }
    } catch (error) {
      console.error(error);
      toast.error('تعذر الاتصال بـ Gemini AI لتوليد التحدي. تم استخدام التحديات الذكية المتاحة.');
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Filter challenges
  const getFilteredList = () => {
    let list = activeChallenges;
    if (mainTab === 'available') list = availableChallenges;
    if (mainTab === 'completed') list = completedChallenges;
    if (mainTab === 'badges') return [];

    return list.filter(c => {
      // Category filter
      if (selectedCategoryFilter !== 'all') {
        if (selectedCategoryFilter === 'daily_habits' && c.category !== 'daily_habits') return false;
        if (selectedCategoryFilter === 'shopping_saving' && c.category !== 'shopping_saving') return false;
        if (selectedCategoryFilter === 'lifestyle_fun' && c.category !== 'lifestyle_fun') return false;
        if (selectedCategoryFilter === 'family_home' && c.category !== 'family_home') return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = c.title.toLowerCase().includes(q);
        const matchDesc = c.description.toLowerCase().includes(q);
        const matchSub = (c.subtitle || '').toLowerCase().includes(q);
        return matchTitle || matchDesc || matchSub;
      }
      return true;
    });
  };

  const displayedChallenges = getFilteredList();
  const unlockedBadgesCount = badges.filter(b => b.unlocked).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-20 md:pb-8" dir="rtl">
      {/* 1. Header & Level Dashboard */}
      <ChallengesStatsHeader
        points={points}
        currentLevel={currentLevel}
        nextLevel={nextLevel}
        levelProgressPercentage={levelProgressPercentage}
        maxStreakDays={maxStreakDays}
        totalEstimatedSaved={totalEstimatedSaved}
        unlockedBadgesCount={unlockedBadgesCount}
        totalBadgesCount={badges.length}
        isDailyBoxAvailable={isDailyBoxAvailable}
        onOpenDailyBox={openDailyMysteryBox}
        onOpenCreateCustom={() => {
          hapticFeedback('light');
          setIsCustomModalOpen(true);
        }}
        onOpenAISmartModal={handleGenerateAIChallenge}
      />

      {/* 2. Main Navigation Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-3 sm:p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Navigation Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
          <button
            onClick={() => {
              hapticFeedback('light');
              setMainTab('active');
            }}
            className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              mainTab === 'active'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs ring-1 ring-emerald-500/20'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Flame size={14} className={mainTab === 'active' ? 'text-emerald-500 animate-pulse' : ''} />
            النشطة
            <span className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.2 rounded-full text-[10px] font-black">
              {activeChallenges.length}
            </span>
          </button>

          <button
            onClick={() => {
              hapticFeedback('light');
              setMainTab('available');
            }}
            className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              mainTab === 'available'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs ring-1 ring-indigo-500/20'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles size={14} className="text-indigo-500" />
            تحديات ممتعة
            <span className="bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.2 rounded-full text-[10px] font-black">
              {availableChallenges.length}
            </span>
          </button>

          <button
            onClick={() => {
              hapticFeedback('light');
              setMainTab('badges');
            }}
            className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              mainTab === 'badges'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs ring-1 ring-amber-500/20'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Award size={14} className="text-amber-500" />
            الأوسمة والرتب
            <span className="bg-amber-500/15 text-amber-700 dark:text-amber-300 px-1.5 py-0.2 rounded-full text-[10px] font-black">
              {unlockedBadgesCount}
            </span>
          </button>

          <button
            onClick={() => {
              hapticFeedback('light');
              setMainTab('completed');
            }}
            className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              mainTab === 'completed'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs ring-1 ring-purple-500/20'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Trophy size={14} className="text-purple-500" />
            المكتملة
            <span className="bg-purple-500/15 text-purple-700 dark:text-purple-300 px-1.5 py-0.2 rounded-full text-[10px] font-black">
              {completedChallenges.length}
            </span>
          </button>
        </div>

        {/* AI Quick Button & Reset */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateAIChallenge}
            disabled={isLoadingAI}
            className="flex-1 md:flex-initial px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500/10 to-indigo-500/10 hover:from-emerald-500 hover:to-indigo-600 text-emerald-700 dark:text-emerald-300 hover:text-white border border-emerald-500/30 font-black text-xs transition-all shadow-xs flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {isLoadingAI ? (
              <Loader2 size={14} className="animate-spin text-emerald-500" />
            ) : (
              <Bot size={14} />
            )}
            <span>تحدي ذكي بـ AI ✨</span>
          </button>

          <button
            onClick={() => {
              if (window.confirm('هل تريد استرجاع جميع التحديات الأسبوعية المبتكرة الافتراضية؟')) {
                resetAllChallengesToDefault();
              }
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="استرجاع التحديات الافتراضية"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* 3. Sub-Category Chips & Search Filter (When in Active, Available, or Completed) */}
      {mainTab !== 'badges' && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => {
                hapticFeedback('light');
                setSelectedCategoryFilter('all');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all border ${
                selectedCategoryFilter === 'all'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              الكل ({mainTab === 'active' ? activeChallenges.length : mainTab === 'available' ? availableChallenges.length : completedChallenges.length})
            </button>

            <button
              onClick={() => {
                hapticFeedback('light');
                setSelectedCategoryFilter('daily_habits');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                selectedCategoryFilter === 'daily_habits'
                  ? 'bg-amber-500 text-white border-transparent shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
              }`}
            >
              <Coffee size={13} />
              عادات يومية
            </button>

            <button
              onClick={() => {
                hapticFeedback('light');
                setSelectedCategoryFilter('shopping_saving');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                selectedCategoryFilter === 'shopping_saving'
                  ? 'bg-orange-500 text-white border-transparent shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
              }`}
            >
              <ShoppingBag size={13} />
              تسوق وقفة السوق
            </button>

            <button
              onClick={() => {
                hapticFeedback('light');
                setSelectedCategoryFilter('lifestyle_fun');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                selectedCategoryFilter === 'lifestyle_fun'
                  ? 'bg-emerald-500 text-white border-transparent shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
              }`}
            >
              <TrendingUp size={13} />
              أسلوب حياة وتوفير
            </button>

            <button
              onClick={() => {
                hapticFeedback('light');
                setSelectedCategoryFilter('family_home');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                selectedCategoryFilter === 'family_home'
                  ? 'bg-teal-500 text-white border-transparent shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
              }`}
            >
              <Soup size={13} />
              البيت والعائلة
            </button>
          </div>

          {/* Search Input */}
          <div className="relative shrink-0 sm:w-56">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث في التحديات..."
              className="w-full pl-3 pr-8 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            />
            <Search size={13} className="absolute right-2.5 top-2.5 text-slate-400" />
          </div>
        </div>
      )}

      {/* 4. Main Content Area */}
      {mainTab === 'badges' ? (
        <ChallengeBadgesSection badges={badges} currentLevel={currentLevel} />
      ) : (
        <div className="space-y-4">
          {displayedChallenges.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 text-center border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <Target size={32} />
              </div>
              <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
                لا توجد تحديات تطابق المعايير المختارة
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
                {mainTab === 'active'
                  ? 'ليس لديك تحديات نشطة حالياً. اختر من "تحديات ممتعة" أو ابتكر تحديك المخصص الآن!'
                  : mainTab === 'completed'
                    ? 'لم تكمل أي تحدٍ بعد هذا الأسبوع. التزم بالتحديات النشطة واستلم المكافآت!'
                    : 'جرب تغيير فئة التصفية أو البحث للعثور على تحديات أخرى.'}
              </p>
              {mainTab === 'active' && (
                <button
                  onClick={() => setMainTab('available')}
                  className="px-5 py-2.5 rounded-2xl bg-emerald-500 text-white font-black text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
                >
                  استعراض التحديات المتاحة ✨
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      )}

      {/* 5. Motivation Footer Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950 text-white p-5 sm:p-6 rounded-3xl border border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3.5 text-right">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
            <Sparkles size={24} className="text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-black">
              التحديات الصغيرة تصنع القفزات المالية الكبيرة 🚀
            </h3>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              توفير 5 إلى 10 دنانير يومياً يتيح لك تحقيق أكثر من 300 دينار مدخرات شهرية إضافية في ميزانيتك.
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
          ابتكار تحدي جديد
        </button>
      </div>

      {/* Custom Challenge Modal */}
      <CreateCustomChallengeModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onCreate={createCustomChallenge}
      />

      {/* Celebration Modal */}
      <CelebrationModal
        challenge={celebrationChallenge}
        onClose={() => setCelebrationChallenge(null)}
      />
    </div>
  );
}
