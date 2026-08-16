import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  format, 
  startOfWeek, 
  addDays, 
  isSameDay, 
  parseISO, 
  isPast, 
  isFuture, 
  isToday 
} from 'date-fns';
import { useAppContext } from '../store/AppContext';
import { 
  WeeklyChallenge, 
  WeeklyChallengeDayStatus, 
  WeeklyChallengeBadge, 
  Expense,
  WeeklyChallengeType
} from '../types';
import { getSmartSavingChallenge } from '../services/geminiService';
import toast from 'react-hot-toast';
import { hapticFeedback } from '../utils';

const ARABIC_DAYS = ['الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'];
const ARABIC_DAYS_SHORT = ['إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت', 'أحد'];

const STORAGE_KEY = 'mywallet_weekly_challenges_v2';
const POINTS_KEY = 'mywallet_challenge_points_v2';
const BADGES_KEY = 'mywallet_challenge_badges_v2';

const DEFAULT_BADGES: WeeklyChallengeBadge[] = [
  {
    id: 'badge_coffee_master',
    title: 'سيد فنجان البيت ☕',
    description: 'أكملت تحدي أسبوع قهوة الدار ووفرت مصاريف المقاهي',
    icon: 'Coffee',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    unlocked: false,
    challengeType: 'no_coffee'
  },
  {
    id: 'badge_no_spend_shield',
    title: 'درع التوفير الخارق 🛡️',
    description: 'أكملت تحدي الـ 48 ساعة بدون أي مصروف استهلاكي',
    icon: 'ShieldCheck',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    unlocked: false,
    challengeType: 'no_spend'
  },
  {
    id: 'badge_home_chef',
    title: 'شيف العائلة المقتصد 👨‍🍳',
    description: 'أكملت أسبوع الطبخ المنزلي ومقاطعة الوجبات السريعة',
    icon: 'UtensilsCrossed',
    color: 'text-rose-500',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/30',
    unlocked: false,
    challengeType: 'home_cooking'
  },
  {
    id: 'badge_market_expert',
    title: 'خبير قفة السوق 🥕',
    description: 'التزمت بسقف ميزانية قفة وسوق الأسبوع بنجاح',
    icon: 'ShoppingBag',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    unlocked: false,
    challengeType: 'grocery_cap'
  },
  {
    id: 'badge_freeze_ninja',
    title: 'نينجا الانضباط المالي 🥷',
    description: 'جمدت كافة الكماليات والرغبات لمدة أسبوع كامل',
    icon: 'Flame',
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500/30',
    unlocked: false,
    challengeType: 'freeze_wants'
  },
  {
    id: 'badge_fakka_master',
    title: 'مروّض الفكة الذهبية 🪙',
    description: 'فرغت فكة الحسابات للحصالة يومياً طوال 7 أيام',
    icon: 'PiggyBank',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    unlocked: false,
    challengeType: 'roundup_streak'
  },
  {
    id: 'badge_weekly_champion',
    title: 'بطل التحديات الأسبوعية 👑',
    description: 'أكملت 3 تحديات مالية أسبوعية وحققت استقراراً ممتازاً',
    icon: 'Trophy',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    unlocked: false
  }
];

export function useWeeklyChallenges() {
  const { expenses, categories, dailyBudget, currency, budgets } = useAppContext();

  // 1. Calculate Current Week Boundaries (Monday to Sunday)
  const currentWeekDays = useMemo(() => {
    const now = new Date();
    const monday = startOfWeek(now, { weekStartsOn: 1 });
    
    return Array.from({ length: 7 }).map((_, i) => {
      const d = addDays(monday, i);
      const dateStr = format(d, 'yyyy-MM-dd');
      return {
        date: dateStr,
        dayLabel: ARABIC_DAYS[i],
        dayShort: ARABIC_DAYS_SHORT[i],
        isToday: isSameDay(d, now),
        isPast: isPast(d) && !isSameDay(d, now),
        isFuture: isFuture(d) && !isSameDay(d, now)
      };
    });
  }, []);

  const weekStartStr = currentWeekDays[0]?.date || format(new Date(), 'yyyy-MM-dd');
  const weekEndStr = currentWeekDays[6]?.date || format(new Date(), 'yyyy-MM-dd');

  // Default Template Generator for the active week
  const generateDefaultTemplates = useCallback((): WeeklyChallenge[] => {
    return [
      {
        id: 'challenge_no_coffee_week',
        type: 'no_coffee',
        title: 'أسبوع قهوة الدار ☕',
        description: 'استبدل قهوة المقاهي الخارجية بفنجان قهوة محضر في البيت ووفّر مصاريف المشروبات طوال الأسبوع.',
        icon: 'Coffee',
        badgeName: 'سيد فنجان البيت ☕',
        badgeIcon: 'Coffee',
        rewardPoints: 45,
        estimatedSavingTND: 25.000,
        startDate: weekStartStr,
        endDate: weekEndStr,
        targetDays: 7,
        targetCategoryId: '6',
        targetKeywords: ['قهوة', 'كافيه', 'cafe', 'coffee', 'express', 'direct', 'شاي', 'قهوة الصباح'],
        status: 'active', // Default active so user can see it right away!
        progressPercentage: 0,
        successfulDaysCount: 0,
        totalSavedSoFar: 0,
        days: currentWeekDays.map(d => ({
          date: d.date,
          dayLabel: d.dayLabel,
          dayShort: d.dayShort,
          spentAmount: 0,
          isSuccess: true,
          isToday: d.isToday,
          isPast: d.isPast,
          isFuture: d.isFuture
        })),
        tips: [
          'اشترِ بن مطحون عالي الجودة وحضّره بطريقتك المفضلة قبل مغادرة المنزل.',
          'استخدم مج حراري لحمل قهوتك معك للعمل أو الجامعة.',
          'كل فنجان توفره يعني 3 إلى 5 دنانير إضافية في ميزانيتك.'
        ]
      },
      {
        id: 'challenge_no_spend_48h',
        type: 'no_spend',
        title: 'تحدي الـ 48 ساعة بدون شراء 🛑',
        description: 'قضاء يومين كاملين في الأسبوع بدون تسجيل أي مصروف مالي استهلاكي نهائياً والاعتماد على المخزون المنزلي.',
        icon: 'ShieldCheck',
        badgeName: 'درع التوفير الخارق 🛡️',
        badgeIcon: 'ShieldCheck',
        rewardPoints: 60,
        estimatedSavingTND: 35.000,
        startDate: weekStartStr,
        endDate: weekEndStr,
        targetDays: 2, // Needs 2 successful zero spend days
        status: 'active',
        progressPercentage: 0,
        successfulDaysCount: 0,
        totalSavedSoFar: 0,
        days: currentWeekDays.map(d => ({
          date: d.date,
          dayLabel: d.dayLabel,
          dayShort: d.dayShort,
          spentAmount: 0,
          isSuccess: true,
          isToday: d.isToday,
          isPast: d.isPast,
          isFuture: d.isFuture
        })),
        tips: [
          'استغل الأطعمة والمكونات الموجودة في الثلاجة والمؤونة المنزلية.',
          'تجنب المرور بالمحلات والمغازات في أيام التحدي بدون هدف محدد.',
          'استمتع بأنشطة مجانية كالقراءة والمشي في الهواء الطلق.'
        ]
      },
      {
        id: 'challenge_home_cooking',
        type: 'home_cooking',
        title: 'أسبوع الطبخ المنزلي ومقاطعة الدليفري 🍳',
        description: 'الاعتماد 100% على الوجبات المنزلية الصحية وتجميد طلبات الأكل الجاهز والمطاعم والوجبات السريعة.',
        icon: 'UtensilsCrossed',
        badgeName: 'شيف العائلة المقتصد 👨‍🍳',
        badgeIcon: 'UtensilsCrossed',
        rewardPoints: 50,
        estimatedSavingTND: 40.000,
        startDate: weekStartStr,
        endDate: weekEndStr,
        targetDays: 7,
        targetKeywords: ['مطعم', 'fast food', 'delivery', 'دليفري', 'سندويش', 'شاورما', 'بيتزا', 'كسكروت', 'ملاوي', 'طعام جاهز', 'غداء عمل'],
        status: 'available',
        progressPercentage: 0,
        successfulDaysCount: 0,
        totalSavedSoFar: 0,
        days: currentWeekDays.map(d => ({
          date: d.date,
          dayLabel: d.dayLabel,
          dayShort: d.dayShort,
          spentAmount: 0,
          isSuccess: true,
          isToday: d.isToday,
          isPast: d.isPast,
          isFuture: d.isFuture
        })),
        tips: [
          'حضّر جدول الوجبات الأسبوعية مسبقاً في عطلة نهاية الأسبوع.',
          'جهّز وجبة الغداء للعمل مسبقاً في علبة طعام محكمة الإغلاق.',
          'استمتع بتحضير وجبات عائلية سريعة كالعجة والكسكسي والسلطات.'
        ]
      },
      {
        id: 'challenge_grocery_cap',
        type: 'grocery_cap',
        title: 'تحدي سقف قفة وسوق الأسبوع 🛒',
        description: 'الالتزام بسقف مالي محدد لمشتريات السوق وقفة الأسبوع (سقف 60.000 د.ت) وتجنب الشراء الاندفاعي.',
        icon: 'ShoppingBag',
        badgeName: 'خبير قفة السوق 🥕',
        badgeIcon: 'ShoppingBag',
        rewardPoints: 40,
        estimatedSavingTND: 30.000,
        startDate: weekStartStr,
        endDate: weekEndStr,
        targetDays: 7,
        targetSpendCap: 60.000,
        targetCategoryId: '1', // قضية السوق والقفة
        targetCategoryName: 'قضية السوق والقفة',
        status: 'available',
        progressPercentage: 0,
        successfulDaysCount: 0,
        totalSavedSoFar: 0,
        days: currentWeekDays.map(d => ({
          date: d.date,
          dayLabel: d.dayLabel,
          dayShort: d.dayShort,
          spentAmount: 0,
          isSuccess: true,
          isToday: d.isToday,
          isPast: d.isPast,
          isFuture: d.isFuture
        })),
        tips: [
          'اكتب قائمة مشتريات محددة ولا تخرج عنها مهما كانت العروض مغرية.',
          'اشترِ الخضار والغلال الموسمية من سوق الخضر البلدي أو الشاحنات المباشرة.',
          'قارن الأسعار بين المحلات ولا تدفع أكثر من السعر المعقول.'
        ]
      },
      {
        id: 'challenge_freeze_wants',
        type: 'freeze_wants',
        title: 'تحدي تجميد الكماليات (Wants Freeze) ❄️',
        description: 'صرف الاحتياجات الأساسية فقط (الأكل، الفواتير، الرضيع، الصحة) وتجميد كافة الرغبات غير العاجلة.',
        icon: 'Flame',
        badgeName: 'نينجا الانضباط المالي 🥷',
        badgeIcon: 'Flame',
        rewardPoints: 55,
        estimatedSavingTND: 45.000,
        startDate: weekStartStr,
        endDate: weekEndStr,
        targetDays: 7,
        targetCategoryId: '6', // ترفيه ومقهى ومواسم
        status: 'available',
        progressPercentage: 0,
        successfulDaysCount: 0,
        totalSavedSoFar: 0,
        days: currentWeekDays.map(d => ({
          date: d.date,
          dayLabel: d.dayLabel,
          dayShort: d.dayShort,
          spentAmount: 0,
          isSuccess: true,
          isToday: d.isToday,
          isPast: d.isPast,
          isFuture: d.isFuture
        })),
        tips: [
          'طبّق قاعدة الـ 48 ساعة قبل شراء أي غرض غير ضروري.',
          'ركز على سداد الالتزامات الضرورية وتعزيز مدخرات الطوارئ.',
          'الراحة المالية تبدأ من إيقاف التسربات الصغيرة غير المحسوبة.'
        ]
      },
      {
        id: 'challenge_fakka_sweep',
        type: 'roundup_streak',
        title: 'تحدي تجميع الفكة 7 أيام متتالية 🪙',
        description: 'تفريغ فكة الحسابات إلى الحصالة يومياً طوال أيام الأسبوع لتعزيز عادة الادخار التراكمي.',
        icon: 'PiggyBank',
        badgeName: 'مروّض الفكة الذهبية 🪙',
        badgeIcon: 'PiggyBank',
        rewardPoints: 35,
        estimatedSavingTND: 15.000,
        startDate: weekStartStr,
        endDate: weekEndStr,
        targetDays: 7,
        status: 'available',
        progressPercentage: 0,
        successfulDaysCount: 0,
        totalSavedSoFar: 0,
        days: currentWeekDays.map(d => ({
          date: d.date,
          dayLabel: d.dayLabel,
          dayShort: d.dayShort,
          spentAmount: 0,
          isSuccess: true,
          isToday: d.isToday,
          isPast: d.isPast,
          isFuture: d.isFuture
        })),
        tips: [
          'استخدم ميزة تفريغ الفكة اليومية السريعة من الصفحة الرئيسية.',
          'كل مليم يتم تحويله للحصالة ينمو مع الوقت ليصبح هدفاً محققاً.',
          'اجعل تفريغ الفكة طقساً مسائياً قبل النوم.'
        ]
      }
    ];
  }, [currentWeekDays, weekStartStr, weekEndStr]);

  // State
  const [challenges, setChallenges] = useState<WeeklyChallenge[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse saved challenges:', e);
      }
    }
    return generateDefaultTemplates();
  });

  const [points, setPoints] = useState<number>(() => {
    const saved = localStorage.getItem(POINTS_KEY);
    return saved ? Number(saved) || 0 : 75; // Starting balance with onboarding welcome points
  });

  const [badges, setBadges] = useState<WeeklyChallengeBadge[]>(() => {
    const saved = localStorage.getItem(BADGES_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse badges:', e);
      }
    }
    return DEFAULT_BADGES;
  });

  const [celebrationChallenge, setCelebrationChallenge] = useState<WeeklyChallenge | null>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(challenges));
  }, [challenges]);

  useEffect(() => {
    localStorage.setItem(POINTS_KEY, points.toString());
  }, [points]);

  useEffect(() => {
    localStorage.setItem(BADGES_KEY, JSON.stringify(badges));
  }, [badges]);

  // Real-time calculation engine that syncs challenges with real recorded expenses!
  const computedChallenges = useMemo(() => {
    // Non-transfer expenses
    const validExpenses = expenses.filter(e => !e.isTransfer);

    return challenges.map(ch => {
      // Build 7 days status
      let totalSpentInChallenge = 0;
      let successfulDaysCount = 0;

      const updatedDays: WeeklyChallengeDayStatus[] = currentWeekDays.map(weekDay => {
        const dayExpenses = validExpenses.filter(e => e.date && e.date.split('T')[0] === weekDay.date);
        
        let spentOnThisDay = 0;
        let isSuccess = true;
        let dayNote = '';

        // Find existing day state to keep manual checks
        const existingDay = ch.days?.find(d => d.date === weekDay.date);
        const manualChecked = existingDay?.manualChecked;

        switch (ch.type) {
          case 'no_spend': {
            // Day is successful if total expenses = 0, or manualChecked
            spentOnThisDay = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
            if (spentOnThisDay > 0 && !manualChecked) {
              isSuccess = false;
              dayNote = `صرفت ${spentOnThisDay.toFixed(3)} ${currency}`;
            } else {
              isSuccess = true;
              dayNote = spentOnThisDay === 0 ? 'يوم صفر مصاريف 🌟' : 'تم التأكيد يدوياً ✨';
            }
            break;
          }

          case 'no_coffee': {
            // Check coffee / cafe expenses
            const coffeeExpenses = dayExpenses.filter(e => {
              const noteLower = (e.note || '').toLowerCase();
              const isCat6 = e.categoryId === '6';
              const hasKeyword = (ch.targetKeywords || []).some(k => noteLower.includes(k.toLowerCase()));
              return (isCat6 && (hasKeyword || !e.note)) || hasKeyword;
            });
            spentOnThisDay = coffeeExpenses.reduce((sum, e) => sum + e.amount, 0);
            if (spentOnThisDay > 0 && !manualChecked) {
              isSuccess = false;
              dayNote = `قهوة ومشروبات: ${spentOnThisDay.toFixed(3)} ${currency}`;
            } else {
              isSuccess = true;
              dayNote = 'قهوة الدار ☕';
            }
            break;
          }

          case 'home_cooking': {
            // Check takeout / restaurant expenses
            const takeoutExpenses = dayExpenses.filter(e => {
              const noteLower = (e.note || '').toLowerCase();
              return (ch.targetKeywords || []).some(k => noteLower.includes(k.toLowerCase()));
            });
            spentOnThisDay = takeoutExpenses.reduce((sum, e) => sum + e.amount, 0);
            if (spentOnThisDay > 0 && !manualChecked) {
              isSuccess = false;
              dayNote = `أكل جاهز: ${spentOnThisDay.toFixed(3)} ${currency}`;
            } else {
              isSuccess = true;
              dayNote = 'طبخ بيتي لذيذ 🍳';
            }
            break;
          }

          case 'grocery_cap': {
            // Grocery expenses
            const marketExpenses = dayExpenses.filter(e => e.categoryId === '1' || e.categoryId === ch.targetCategoryId);
            spentOnThisDay = marketExpenses.reduce((sum, e) => sum + e.amount, 0);
            // In grocery cap, we track daily spend; weekly limit is evaluated across all days
            isSuccess = true; // Evaluated at weekly aggregate
            dayNote = spentOnThisDay > 0 ? `قضية السوق: ${spentOnThisDay.toFixed(3)} ${currency}` : 'لا مصاريف سوق';
            break;
          }

          case 'freeze_wants': {
            const wantsExpenses = dayExpenses.filter(e => {
              const cat = categories.find(c => c.id === e.categoryId);
              return cat?.type === 'want' || e.categoryId === '6';
            });
            spentOnThisDay = wantsExpenses.reduce((sum, e) => sum + e.amount, 0);
            if (spentOnThisDay > 0 && !manualChecked) {
              isSuccess = false;
              dayNote = `كماليات: ${spentOnThisDay.toFixed(3)} ${currency}`;
            } else {
              isSuccess = true;
              dayNote = 'تجميد ناجح ❄️';
            }
            break;
          }

          case 'roundup_streak': {
            // Check if any transfer to piggy bank was made
            const transferExpenses = expenses.filter(e => 
              e.isTransfer && 
              e.date && 
              e.date.split('T')[0] === weekDay.date && 
              ((e.note || '').includes('حصالة') || (e.note || '').includes('فكة') || (e.note || '').includes('🪙'))
            );
            spentOnThisDay = transferExpenses.reduce((sum, e) => sum + e.amount, 0);
            isSuccess = spentOnThisDay > 0 || !!manualChecked;
            dayNote = isSuccess ? 'تم تحويل الفكة 🪙' : 'في انتظار التحويل';
            break;
          }

          case 'custom':
          default: {
            if (ch.targetCategoryId) {
              const catExpenses = dayExpenses.filter(e => e.categoryId === ch.targetCategoryId);
              spentOnThisDay = catExpenses.reduce((sum, e) => sum + e.amount, 0);
              if (ch.targetSpendCap && ch.targetSpendCap > 0) {
                isSuccess = spentOnThisDay <= (ch.targetSpendCap / 7) || !!manualChecked;
              } else {
                isSuccess = spentOnThisDay === 0 || !!manualChecked;
              }
            } else {
              isSuccess = !dayExpenses.length || !!manualChecked;
            }
            dayNote = isSuccess ? 'ملتزم بالتحدي ✨' : `مصروف: ${spentOnThisDay.toFixed(3)} ${currency}`;
            break;
          }
        }

        totalSpentInChallenge += spentOnThisDay;

        // If day is future and not manually verified, it's pending/open
        if (isSuccess && (!weekDay.isFuture || manualChecked)) {
          successfulDaysCount++;
        }

        return {
          date: weekDay.date,
          dayLabel: weekDay.dayLabel,
          dayShort: weekDay.dayShort,
          spentAmount: spentOnThisDay,
          isSuccess,
          manualChecked: !!manualChecked,
          isToday: weekDay.isToday,
          isPast: weekDay.isPast,
          isFuture: weekDay.isFuture,
          note: dayNote
        };
      });

      // Special calculation for grocery_cap and budget caps
      let progressPercentage = 0;
      let totalSaved = 0;

      if (ch.type === 'grocery_cap' && ch.targetSpendCap) {
        const cap = ch.targetSpendCap;
        const remaining = Math.max(0, cap - totalSpentInChallenge);
        progressPercentage = totalSpentInChallenge <= cap 
          ? Math.min(100, Math.round(((cap - totalSpentInChallenge) / cap) * 100) || 100)
          : Math.max(0, Math.round((1 - ((totalSpentInChallenge - cap) / cap)) * 100));
        totalSaved = Math.max(0, remaining);
      } else if (ch.type === 'no_spend') {
        // Target is e.g. 2 days
        progressPercentage = Math.min(100, Math.round((successfulDaysCount / (ch.targetDays || 2)) * 100));
        totalSaved = successfulDaysCount * (dailyBudget > 0 ? dailyBudget : 15);
      } else {
        progressPercentage = Math.min(100, Math.round((successfulDaysCount / (ch.targetDays || 7)) * 100));
        totalSaved = (ch.estimatedSavingTND / (ch.targetDays || 7)) * successfulDaysCount;
      }

      // Check if auto-complete condition met
      let currentStatus = ch.status;
      if (ch.status === 'active' && progressPercentage >= 100 && (ch.type === 'no_spend' ? successfulDaysCount >= (ch.targetDays || 2) : successfulDaysCount >= (ch.targetDays || 7))) {
        // Challenge reached completion threshold
      }

      return {
        ...ch,
        days: updatedDays,
        successfulDaysCount,
        progressPercentage,
        totalSavedSoFar: Math.round(totalSaved * 1000) / 1000,
        status: currentStatus
      };
    });
  }, [challenges, expenses, currentWeekDays, categories, dailyBudget, currency]);

  // Actions
  const startChallenge = useCallback((challengeId: string) => {
    hapticFeedback('medium');
    setChallenges(prev => prev.map(ch => {
      if (ch.id === challengeId) {
        toast.success(`تم بدء "${ch.title}" بنجاح! حظاً موفقاً 🚀`);
        return {
          ...ch,
          status: 'active',
          startDate: weekStartStr,
          endDate: weekEndStr
        };
      }
      return ch;
    }));
  }, [weekStartStr, weekEndStr]);

  const abandonChallenge = useCallback((challengeId: string) => {
    hapticFeedback('light');
    setChallenges(prev => prev.map(ch => {
      if (ch.id === challengeId) {
        toast('تم إلغاء التحدي وإعادته للقائمة المتاحة.');
        return {
          ...ch,
          status: 'available'
        };
      }
      return ch;
    }));
  }, []);

  const toggleDayManualCheck = useCallback((challengeId: string, dayDate: string) => {
    hapticFeedback('light');
    setChallenges(prev => prev.map(ch => {
      if (ch.id === challengeId) {
        const updatedDays = ch.days.map(d => {
          if (d.date === dayDate) {
            const newChecked = !d.manualChecked;
            if (newChecked) {
              toast.success(`تم تأكيد التزامك بيوم ${d.dayLabel} 🎯`);
            }
            return {
              ...d,
              manualChecked: newChecked,
              isSuccess: newChecked || d.spentAmount === 0
            };
          }
          return d;
        });
        return {
          ...ch,
          days: updatedDays
        };
      }
      return ch;
    }));
  }, []);

  const claimReward = useCallback((challengeId: string) => {
    hapticFeedback('heavy');
    const ch = computedChallenges.find(c => c.id === challengeId);
    if (!ch) return;

    // Add points
    const reward = ch.rewardPoints || 50;
    setPoints(prev => prev + reward);

    // Mark completed
    setChallenges(prev => prev.map(c => {
      if (c.id === challengeId) {
        return {
          ...c,
          status: 'completed',
          completedAt: new Date().toISOString()
        };
      }
      return c;
    }));

    // Unlock matching badge
    setBadges(prev => prev.map(b => {
      if (b.challengeType === ch.type || b.title === ch.badgeName) {
        return {
          ...b,
          unlocked: true,
          unlockedAt: new Date().toISOString()
        };
      }
      return b;
    }));

    // Trigger celebratory popup
    setCelebrationChallenge(ch);
    toast.success(`ألف مبروك! 🎉 ربحت ${reward} نقطة ووسام الإنجاز!`);
  }, [computedChallenges]);

  const createCustomChallenge = useCallback((custom: {
    title: string;
    description: string;
    type: WeeklyChallengeType;
    icon: string;
    rewardPoints: number;
    estimatedSavingTND: number;
    targetDays: number;
    targetSpendCap?: number;
    targetCategoryId?: string;
    targetCategoryName?: string;
    tips?: string[];
  }) => {
    hapticFeedback('medium');
    const newId = `custom_challenge_${Date.now()}`;
    const newChallenge: WeeklyChallenge = {
      id: newId,
      type: custom.type,
      title: custom.title,
      description: custom.description,
      icon: custom.icon || 'Target',
      badgeName: `وسام ${custom.title}`,
      badgeIcon: custom.icon || 'Medal',
      rewardPoints: custom.rewardPoints || 40,
      estimatedSavingTND: custom.estimatedSavingTND || 20,
      startDate: weekStartStr,
      endDate: weekEndStr,
      targetDays: custom.targetDays || 7,
      targetSpendCap: custom.targetSpendCap,
      targetCategoryId: custom.targetCategoryId,
      targetCategoryName: custom.targetCategoryName,
      status: 'active',
      progressPercentage: 0,
      successfulDaysCount: 0,
      totalSavedSoFar: 0,
      isCustom: true,
      createdAt: new Date().toISOString(),
      days: currentWeekDays.map(d => ({
        date: d.date,
        dayLabel: d.dayLabel,
        dayShort: d.dayShort,
        spentAmount: 0,
        isSuccess: true,
        isToday: d.isToday,
        isPast: d.isPast,
        isFuture: d.isFuture
      })),
      tips: custom.tips || [
        'التزم بالهدف اليومي وتابع تقدمك بانتظام.',
        'سجل مصاريفك فور حدوثها للحفاظ على دقة التتبع.'
      ]
    };

    setChallenges(prev => [newChallenge, ...prev]);
    toast.success('تم إنشاء التحدي المخصص وتفعيله للأسبوع الحالي! 🎯');
  }, [currentWeekDays, weekStartStr, weekEndStr]);

  const deleteChallenge = useCallback((challengeId: string) => {
    hapticFeedback('light');
    setChallenges(prev => prev.filter(c => c.id !== challengeId));
    toast('تم حذف التحدي.');
  }, []);

  const resetAllChallengesToDefault = useCallback(() => {
    hapticFeedback('medium');
    const fresh = generateDefaultTemplates();
    setChallenges(fresh);
    toast.success('تمت إعادة ضبط التحديات الأسبوعية إلى الإعدادات الافتراضية.');
  }, [generateDefaultTemplates]);

  // Overall Stats
  const activeChallenges = useMemo(() => 
    computedChallenges.filter(c => c.status === 'active'),
    [computedChallenges]
  );

  const availableChallenges = useMemo(() => 
    computedChallenges.filter(c => c.status === 'available'),
    [computedChallenges]
  );

  const completedChallenges = useMemo(() => 
    computedChallenges.filter(c => c.status === 'completed'),
    [computedChallenges]
  );

  const totalEstimatedSaved = useMemo(() => 
    computedChallenges.reduce((sum, c) => sum + (c.totalSavedSoFar || 0), 0),
    [computedChallenges]
  );

  const maxStreakDays = useMemo(() => {
    if (activeChallenges.length === 0) return 0;
    return Math.max(...activeChallenges.map(c => c.successfulDaysCount || 0), 0);
  }, [activeChallenges]);

  return {
    challenges: computedChallenges,
    activeChallenges,
    availableChallenges,
    completedChallenges,
    points,
    badges,
    totalEstimatedSaved,
    maxStreakDays,
    currentWeekDays,
    celebrationChallenge,
    setCelebrationChallenge,
    startChallenge,
    abandonChallenge,
    toggleDayManualCheck,
    claimReward,
    createCustomChallenge,
    deleteChallenge,
    resetAllChallengesToDefault
  };
}
