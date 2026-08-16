import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  format, 
  startOfWeek, 
  addDays, 
  isSameDay, 
  isPast, 
  isFuture 
} from 'date-fns';
import { useAppContext } from '../store/AppContext';
import { 
  WeeklyChallenge, 
  WeeklyChallengeDayStatus, 
  WeeklyChallengeBadge, 
  ChallengeUserLevel,
  WeeklyChallengeType,
  ChallengeCategory
} from '../types';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { hapticFeedback } from '../utils';

const ARABIC_DAYS = ['الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'];
const ARABIC_DAYS_SHORT = ['إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت', 'أحد'];

const STORAGE_KEY = 'mywallet_weekly_challenges_v3';
const POINTS_KEY = 'mywallet_challenge_points_v3';
const BADGES_KEY = 'mywallet_challenge_badges_v3';
const DAILY_BOX_KEY = 'mywallet_challenge_daily_box_v3';

export const USER_LEVELS: ChallengeUserLevel[] = [
  {
    level: 1,
    title: 'مقتصد طموح 🌱',
    icon: 'Sprout',
    minPoints: 0,
    maxPoints: 100,
    perk: 'بداية رحلة الانضباط المالي الذكي',
    color: 'from-emerald-400 to-teal-500'
  },
  {
    level: 2,
    title: 'حارس الميزانية 🛡️',
    icon: 'ShieldCheck',
    minPoints: 100,
    maxPoints: 250,
    perk: 'حماية الميزانية من التسربات اليومية',
    color: 'from-teal-500 to-cyan-600'
  },
  {
    level: 3,
    title: 'صائد الوفر 🎯',
    icon: 'Target',
    minPoints: 250,
    maxPoints: 450,
    perk: 'اقتناص فرص التوفير وتنمية الحصالة',
    color: 'from-indigo-500 to-blue-600'
  },
  {
    level: 4,
    title: 'شيف التوفير 👨‍🍳',
    icon: 'UtensilsCrossed',
    minPoints: 450,
    maxPoints: 700,
    perk: 'إتقان إدارة مشتريات البيت والطعام',
    color: 'from-amber-500 to-orange-600'
  },
  {
    level: 5,
    title: 'خبير الاستقرار 💎',
    icon: 'Gem',
    minPoints: 700,
    maxPoints: 1050,
    perk: 'بناء وسادة أمان مالية صلبة ومستدامة',
    color: 'from-purple-500 to-pink-600'
  },
  {
    level: 6,
    title: 'وزير مالية البيت 👑',
    icon: 'Crown',
    minPoints: 1050,
    maxPoints: 1500,
    perk: 'تحقيق توازن مالي عالي وانضباط تام',
    color: 'from-amber-400 via-rose-500 to-purple-600'
  },
  {
    level: 7,
    title: 'مايسترو الثروة 🌟',
    icon: 'Sparkles',
    minPoints: 1500,
    maxPoints: 99999,
    perk: 'حرية مالية واستثمار ذكي للمدخرات',
    color: 'from-yellow-400 via-amber-500 to-emerald-500'
  }
];

export const DEFAULT_BADGES: WeeklyChallengeBadge[] = [
  {
    id: 'badge_coffee_master',
    title: 'سيد فنجان البيت ☕',
    description: 'أكملت أسبوع قهوة الدار ووفرت مصاريف المقاهي الخارجية',
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
    description: 'أكملت تحدي الـ 48 ساعة بصفر مصاريف استهلاكية',
    icon: 'ShieldCheck',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    unlocked: false,
    challengeType: 'no_spend'
  },
  {
    id: 'badge_lunchbox_hero',
    title: 'بطل ساندويتش الدوام 🥪',
    description: 'حضرت غداء العمل والجامعة من البيت طوال الأسبوع',
    icon: 'Sandwich',
    color: 'text-amber-600',
    bgColor: 'bg-amber-600/10',
    borderColor: 'border-amber-600/30',
    unlocked: false,
    challengeType: 'lunchbox_hero'
  },
  {
    id: 'badge_home_chef',
    title: 'شيف العائلة المقتصد 👨‍🍳',
    description: 'أكملت أسبوع الطبخ المنزلي وقاطعت مطاعم الوجبات السريعة',
    icon: 'UtensilsCrossed',
    color: 'text-rose-500',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/30',
    unlocked: false,
    challengeType: 'home_cooking'
  },
  {
    id: 'badge_ladder_master',
    title: 'فارس السلم المالي 🪜',
    description: 'أتقنت تحدي الادخار التصاعدي وجمعت سلم الأسبوع كاملاً',
    icon: 'TrendingUp',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    unlocked: false,
    challengeType: 'ladder_saving'
  },
  {
    id: 'badge_walk_hero',
    title: 'بطل خطوات التوفير 🚶‍♂️',
    description: 'استبدلت التاكسي بالمشي للمسافات القريبة طوال 7 أيام',
    icon: 'Footprints',
    color: 'text-teal-500',
    bgColor: 'bg-teal-500/10',
    borderColor: 'border-teal-500/30',
    unlocked: false,
    challengeType: 'walk_commute'
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
    id: 'badge_strict_list',
    title: 'حارس القائمة المغلقة 📝',
    description: 'قضيت مشترياتك وفق القائمة الورقية المحددة دون أي اندفاع',
    icon: 'FileCheck',
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500/30',
    unlocked: false,
    challengeType: 'strict_list'
  },
  {
    id: 'badge_freeze_ninja',
    title: 'نينجا الانضباط المالي 🥷',
    description: 'جمدت كافة الكماليات والرغبات لمدة أسبوع كامل',
    icon: 'Flame',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-600/10',
    borderColor: 'border-indigo-600/30',
    unlocked: false,
    challengeType: 'freeze_wants'
  },
  {
    id: 'badge_energy_saver',
    title: 'صديق طاقة البيت ⚡',
    description: 'رشّدت استهلاك الكهرباء والماء وساهمت في خفض الفاتورة',
    icon: 'Zap',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    unlocked: false,
    challengeType: 'energy_saver'
  },
  {
    id: 'badge_fakka_master',
    title: 'مروّض الفكة الذهبية 🪙',
    description: 'فرغت فكة الحسابات للحصالة يومياً طوال 7 أيام متتالية',
    icon: 'PiggyBank',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-600/10',
    borderColor: 'border-yellow-600/30',
    unlocked: false,
    challengeType: 'roundup_streak'
  },
  {
    id: 'badge_family_pot',
    title: 'بركة طبخة العائلة 🍲',
    description: 'أعددت وجبة عائلية غنية واقتصادية كفت يومين بنجاح',
    icon: 'Soup',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-600/10',
    borderColor: 'border-emerald-600/30',
    unlocked: false,
    challengeType: 'family_pot'
  },
  {
    id: 'badge_weekly_champion',
    title: 'بطل التحديات الأسبوعية 👑',
    description: 'أكملت 3 تحديات مالية وحققت استقراراً مبهراً للميزانية',
    icon: 'Trophy',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    unlocked: false
  }
];

const DAILY_TIPS = [
  'كل دينار تتركه في جيبك اليوم هو بذرة لاستثمار الغد 🌱',
  'قاعدة الـ 48 ساعة قبل الشراء توفر عليك أكثر من 30% من الكماليات ⏳',
  'تجهيز وجبة الغداء للعمل مسبقاً يوفر عليك أكثر من 120 د.ت شهرياً 🥪',
  'فنجان قهوة الدار يمنحك نفس التركيز وبخُمس التكلفة ☕',
  'المشي للمشاوير القريبة يكسبك صحة ويوفر بنزين وتاكسي 🚶‍♂️',
  'كتابة قائمة مشتريات السوق قبل الخروج تحميك من الفخاخ التسويقية 📝',
  'تفريغ فكة اليوم في الحصالة يجعل الادخار عادة تلقائية ممتعة 🪙'
];

export function useWeeklyChallenges() {
  const { expenses, categories, dailyBudget, currency } = useAppContext();

  // 1. Current Week Boundaries (Monday to Sunday)
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

  // Rich, Diversified Challenges Generator
  const generateDefaultTemplates = useCallback((): WeeklyChallenge[] => {
    return [
      {
        id: 'challenge_no_coffee_week',
        type: 'no_coffee',
        category: 'daily_habits',
        title: 'أسبوع قهوة الدار ☕',
        subtitle: 'فنجان بن بيتي منعش وتوفير مصاريف الكافيهات',
        description: 'استبدل قهوة المقاهي الخارجية بفنجان قهوة محضر في البيت ووفّر مصاريف المشروبات طوال الأسبوع.',
        icon: 'Coffee',
        difficulty: 'easy',
        badgeName: 'سيد فنجان البيت ☕',
        badgeIcon: 'Coffee',
        rewardPoints: 45,
        estimatedSavingTND: 25.000,
        startDate: weekStartStr,
        endDate: weekEndStr,
        targetDays: 7,
        targetCategoryId: '6',
        targetKeywords: ['قهوة', 'كافيه', 'cafe', 'coffee', 'express', 'direct', 'شاي', 'قهوة الصباح', 'direct'],
        status: 'active', // Active by default
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
        category: 'lifestyle_fun',
        title: 'تحدي الـ 48 ساعة بلا شراء 🛑',
        subtitle: 'يومان كاملان بصفر مصاريف استهلاكية',
        description: 'قضاء يومين كاملين في الأسبوع بدون تسجيل أي مصروف مالي استهلاكي والاعتماد التام على المخزون المنزلي.',
        icon: 'ShieldCheck',
        difficulty: 'medium',
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
          'تجنب المرور بالمحلات والمغازات في أيام التحدي بدون هدف مسبق.',
          'استمتع بأنشطة مجانية كالقراءة والمشي في الهواء الطلق.'
        ]
      },
      {
        id: 'challenge_lunchbox_hero',
        type: 'lunchbox_hero',
        category: 'daily_habits',
        title: 'بطل ساندويتش الدوام 🥪',
        subtitle: 'تحضير غداء العمل والجامعة منزلياً طوال الأسبوع',
        description: 'جهّز ساندويتش أو وجبة الغداء في علبة طعام من البيت وتجنب شراء السندويشات والوجبات السريعة المكلفة أثناء العمل.',
        icon: 'Sandwich',
        difficulty: 'easy',
        badgeName: 'بطل ساندويتش الدوام 🥪',
        badgeIcon: 'Sandwich',
        rewardPoints: 45,
        estimatedSavingTND: 30.000,
        startDate: weekStartStr,
        endDate: weekEndStr,
        targetDays: 5,
        targetKeywords: ['كسكروت', 'سندويش', 'شاورما', 'ملاوي', 'طعام عمل', 'غداء عمل', 'وجبة سريعة'],
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
          'جهّز مكونات الساندويتش بالليل (تونة، بيض، جبن، سلطة مشوية) لتوفير الوقت صباحاً.',
          'علبة غداء محكمة الإغلاق تحافظ على طزاجة طعامك وصحتك.',
          'وفر 5 إلى 8 دنانير يومياً كانت تضيع في أكلات الشارع غير الصحية.'
        ]
      },
      {
        id: 'challenge_ladder_saving',
        type: 'ladder_saving',
        category: 'lifestyle_fun',
        title: 'تحدي السلم المالي التراكمي 🪜',
        subtitle: 'وفر 1 الإثنين، 2 الثلاثاء.. حتى 7 دنانير الأحد (28 د.ت)',
        description: 'لعبة ادخار تصاعدية ممتعة: حول 1 د.ت الإثنين، 2 الثلاثاء، 3 الأربعاء، 4 الخميس، 5 الجمعة، 6 السبت، 7 الأحد للحصالة لتجمع 28 د.ت أسبوعياً!',
        icon: 'TrendingUp',
        difficulty: 'hard',
        badgeName: 'فارس السلم المالي 🪜',
        badgeIcon: 'TrendingUp',
        rewardPoints: 75,
        estimatedSavingTND: 28.000,
        startDate: weekStartStr,
        endDate: weekEndStr,
        targetDays: 7,
        status: 'available',
        progressPercentage: 0,
        successfulDaysCount: 0,
        totalSavedSoFar: 0,
        days: currentWeekDays.map((d, idx) => ({
          date: d.date,
          dayLabel: d.dayLabel,
          dayShort: d.dayShort,
          spentAmount: 0,
          isSuccess: true,
          isToday: d.isToday,
          isPast: d.isPast,
          isFuture: d.isFuture,
          note: `هدف اليوم: ${idx + 1} د.ت 🪙`
        })),
        tips: [
          'حوّل المبلغ اليومي مباشرة إلى الحصالة في تطبيقك.',
          'التدرج النفسي يجعل الادخار خفيفاً ومشوقاً.',
          'في نهاية الشهر ستجد أكثر من 112 دينار إضافية محققة!'
        ]
      },
      {
        id: 'challenge_walk_commute',
        type: 'walk_commute',
        category: 'daily_habits',
        title: 'بطل خطوات التوفير 🚶‍♂️',
        subtitle: 'المشي للمشاوير القريبة بدل التاكسي والوقود',
        description: 'امشِ للمشاوير الأقل من 2 كم (السوق، المخبزة، المسجد، العمل القريب) واكسب صحتك ووفر مصاريف النقل والتاكسي الفردي.',
        icon: 'Footprints',
        difficulty: 'easy',
        badgeName: 'بطل خطوات التوفير 🚶‍♂️',
        badgeIcon: 'Footprints',
        rewardPoints: 40,
        estimatedSavingTND: 20.000,
        startDate: weekStartStr,
        endDate: weekEndStr,
        targetDays: 7,
        targetKeywords: ['تاكسي', 'taxi', 'bolt', 'نقل', 'بنزين'],
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
          'ابدأ مشوارك أبكر بـ 10 دقائق لتستمتع بالمشي والنشاط الصباحي.',
          'تجنب التاكسي الفردي للمشاوير القصيرة ذات الكلفة المرتفعة.',
          'امشِ 5000 خطوة يومياً وحافظ على لياقتك ومحفظتك.'
        ]
      },
      {
        id: 'challenge_home_cooking',
        type: 'home_cooking',
        category: 'lifestyle_fun',
        title: 'أسبوع الطبخ المنزلي ومقاطعة الدليفري 🍳',
        subtitle: 'أكل بيتي صحي 100% وتجميد الوجبات السريعة',
        description: 'الاعتماد 100% على الوجبات المنزلية الصحية وتجميد طلبات الأكل الجاهز والمطاعم والوجبات السريعة طوال الأسبوع.',
        icon: 'UtensilsCrossed',
        difficulty: 'medium',
        badgeName: 'شيف العائلة المقتصد 👨‍🍳',
        badgeIcon: 'UtensilsCrossed',
        rewardPoints: 55,
        estimatedSavingTND: 40.000,
        startDate: weekStartStr,
        endDate: weekEndStr,
        targetDays: 7,
        targetKeywords: ['مطعم', 'fast food', 'delivery', 'دليفري', 'سندويش', 'شاورما', 'بيتزا', 'كسكروت', 'طعام جاهز'],
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
          'استمتع بتحضير وجبات تونسية سريعة كالعجة والكسكسي والسلطات.',
          'الطعام البيتي أوفر 3 مرات من أي مطعم خارجي.'
        ]
      },
      {
        id: 'challenge_strict_list',
        type: 'strict_list',
        category: 'shopping_saving',
        title: 'حارس القائمة المغلقة 📝',
        subtitle: 'التسوق بالورقة والقلم دون شراء أي شيء إضافي',
        description: 'اكتب قائمة مشترياتك المنزلية مسبقاً قبل دخول أي سوبرماركت أو سوق، والتزم بعدم وضع أي غرض خارج القائمة في السلة.',
        icon: 'FileCheck',
        difficulty: 'medium',
        badgeName: 'حارس القائمة المغلقة 📝',
        badgeIcon: 'FileCheck',
        rewardPoints: 50,
        estimatedSavingTND: 35.000,
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
          'لا تتسوق أبداً وأنت جائع حتى لا تقع في فخ المشتريات الاندفاعية.',
          'التزم فقط بما هو مسجل حرفياً في الورقة.',
          'المحلات تصمم الممرات لإغرائك، القائمة هي درع حمايتك.'
        ]
      },
      {
        id: 'challenge_grocery_cap',
        type: 'grocery_cap',
        category: 'shopping_saving',
        title: 'سقف قفة وسوق الأسبوع 🛒',
        subtitle: 'الالتزام بسقف 60.000 د.ت لقضية وسوق الخضار',
        description: 'الالتزام بسقف مالي محدد لمشتريات السوق وقفة الأسبوع (سقف 60.000 د.ت) وتجنب الشراء الزائد عن الحاجة.',
        icon: 'ShoppingBag',
        difficulty: 'medium',
        badgeName: 'خبير قفة السوق 🥕',
        badgeIcon: 'ShoppingBag',
        rewardPoints: 45,
        estimatedSavingTND: 30.000,
        startDate: weekStartStr,
        endDate: weekEndStr,
        targetDays: 7,
        targetSpendCap: 60.000,
        targetCategoryId: '1',
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
          'اشترِ الخضار والغلال الموسمية الطازجة من سوق الخضر البلدي مباشرة.',
          'احسب ثمن المشتريات تقريبياً وأنت تتنقل بين الباعة.',
          'الطبخ بمكونات موسمية أوفر وألذ وأصح.'
        ]
      },
      {
        id: 'challenge_freeze_wants',
        type: 'freeze_wants',
        category: 'shopping_saving',
        title: 'تحدي تجميد الكماليات (Wants Freeze) ❄️',
        subtitle: 'قصر الصرف على الضروريات فقط وتجميد الرغبات',
        description: 'صرف الاحتياجات الأساسية فقط (الأكل، الفواتير، الرضيع، الصحة) وتجميد كافة الرغبات والمشتريات الترفيهية.',
        icon: 'Flame',
        difficulty: 'hard',
        badgeName: 'نينجا الانضباط المالي 🥷',
        badgeIcon: 'Flame',
        rewardPoints: 65,
        estimatedSavingTND: 45.000,
        startDate: weekStartStr,
        endDate: weekEndStr,
        targetDays: 7,
        targetCategoryId: '6',
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
          'ميّز دائماً بين "أحتاج" و"أرغب".',
          'كل دينار يُحفظ من الكماليات يقوي صمودك المالي.',
          'الراحة النفسية تأتي من انعدام الديون والسيطرة على الجيب.'
        ]
      },
      {
        id: 'challenge_energy_saver',
        type: 'energy_saver',
        category: 'family_home',
        title: 'صديق طاقة البيت وفاتورة الستاغ ⚡',
        subtitle: 'ترشيد استهلاك الكهرباء والماء طوال أيام الأسبوع',
        description: 'أطفئ المصابيح في الغرف الفارغة، افصل شواحن الأجهزة بعد الاستعمال، ورشّد استهلاك السخان والمكيف لخفض فاتورة STEG.',
        icon: 'Zap',
        difficulty: 'easy',
        badgeName: 'صديق طاقة البيت ⚡',
        badgeIcon: 'Zap',
        rewardPoints: 40,
        estimatedSavingTND: 20.000,
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
          'استخدم الإنارة الطبيعية نهاراً وأطفئ الأجهزة في وضع الاستعداد (Standby).',
          'غسيل الملابس بالماء الفاتر أو البارد يقلل استهلاك الكهرباء 40%.',
          'الترشيد اليومي البسيط يظهر جلياً في الفاتورة الشهرية القادمة.'
        ]
      },
      {
        id: 'challenge_family_pot',
        type: 'family_pot',
        category: 'family_home',
        title: 'بركة طبخة العائلة 🍲',
        subtitle: 'إعداد وجبة عائلية اقتصادية تكفي وجبتين لذيذتين',
        description: 'طبخ وجبة عائلية تقليدية غنية (مرقة خضار، عدس، كسكسي، ملوخية) تكفي ليومين، لتوفير الوقت والغاز ومصاريف التسوق اليومي.',
        icon: 'Soup',
        difficulty: 'easy',
        badgeName: 'بركة طبخة العائلة 🍲',
        badgeIcon: 'Soup',
        rewardPoints: 40,
        estimatedSavingTND: 25.000,
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
          'أكلات الحبوب والخضار غنية بالفيتامينات وتدوم يومين بسهولة.',
          'الطبخ بكميات مضاعفة يقلل الهدر ويوفر مجهودك اليومي.',
          'لمّة العائلة على طعام بيتي نعمة وبركة.'
        ]
      },
      {
        id: 'challenge_fakka_sweep',
        type: 'roundup_streak',
        category: 'daily_habits',
        title: 'مروّض الفكة الذهبية 🪙',
        subtitle: 'تفريغ فكة الحسابات للحصالة يومياً طوال 7 أيام',
        description: 'تفريغ مليمات وفكة الحسابات إلى الحصالة يومياً طوال أيام الأسبوع لترسيخ عادة الادخار التراكمي غير المحسوس.',
        icon: 'PiggyBank',
        difficulty: 'easy',
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
          'استخدم ميزة تفريغ الفكة السريعة من الصفحة الرئيسية.',
          'كل مليم ينمو ككرة الثلج مع مرور الأسابيع.',
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
    return saved ? Number(saved) || 0 : 85; // Starting balance with welcome onboarding points
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

  const [lastDailyBoxDate, setLastDailyBoxDate] = useState<string>(() => {
    return localStorage.getItem(DAILY_BOX_KEY) || '';
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

  useEffect(() => {
    localStorage.setItem(DAILY_BOX_KEY, lastDailyBoxDate);
  }, [lastDailyBoxDate]);

  // Level Progression Calculation
  const currentLevel = useMemo((): ChallengeUserLevel => {
    for (let i = USER_LEVELS.length - 1; i >= 0; i--) {
      if (points >= USER_LEVELS[i].minPoints) {
        return USER_LEVELS[i];
      }
    }
    return USER_LEVELS[0];
  }, [points]);

  const nextLevel = useMemo(() => {
    const currentIndex = USER_LEVELS.findIndex(l => l.level === currentLevel.level);
    if (currentIndex < USER_LEVELS.length - 1) {
      return USER_LEVELS[currentIndex + 1];
    }
    return null;
  }, [currentLevel]);

  const levelProgressPercentage = useMemo(() => {
    if (!nextLevel) return 100;
    const currentRange = nextLevel.minPoints - currentLevel.minPoints;
    const gained = points - currentLevel.minPoints;
    return Math.min(100, Math.max(0, Math.round((gained / currentRange) * 100)));
  }, [points, currentLevel, nextLevel]);

  // Daily Mystery Box availability
  const todayDateStr = format(new Date(), 'yyyy-MM-dd');
  const isDailyBoxAvailable = lastDailyBoxDate !== todayDateStr;

  // Real-time calculation engine that syncs challenges with real recorded expenses!
  const computedChallenges = useMemo(() => {
    const validExpenses = expenses.filter(e => !e.isTransfer);

    return challenges.map(ch => {
      let totalSpentInChallenge = 0;
      let successfulDaysCount = 0;

      const updatedDays: WeeklyChallengeDayStatus[] = currentWeekDays.map(weekDay => {
        const dayExpenses = validExpenses.filter(e => e.date && e.date.split('T')[0] === weekDay.date);
        
        let spentOnThisDay = 0;
        let isSuccess = true;
        let dayNote = '';

        const existingDay = ch.days?.find(d => d.date === weekDay.date);
        const manualChecked = existingDay?.manualChecked;

        switch (ch.type) {
          case 'no_spend': {
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
            const coffeeExpenses = dayExpenses.filter(e => {
              const noteLower = (e.note || '').toLowerCase();
              const isCat6 = e.categoryId === '6';
              const hasKeyword = (ch.targetKeywords || []).some(k => noteLower.includes(k.toLowerCase()));
              return (isCat6 && (hasKeyword || !e.note)) || hasKeyword;
            });
            spentOnThisDay = coffeeExpenses.reduce((sum, e) => sum + e.amount, 0);
            if (spentOnThisDay > 0 && !manualChecked) {
              isSuccess = false;
              dayNote = `مقهى ومشروبات: ${spentOnThisDay.toFixed(3)} ${currency}`;
            } else {
              isSuccess = true;
              dayNote = 'قهوة الدار ☕';
            }
            break;
          }

          case 'home_cooking':
          case 'lunchbox_hero': {
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
              dayNote = 'طعام بيتي صحي 🥪';
            }
            break;
          }

          case 'walk_commute': {
            const transportExpenses = dayExpenses.filter(e => {
              const noteLower = (e.note || '').toLowerCase();
              return (ch.targetKeywords || []).some(k => noteLower.includes(k.toLowerCase()));
            });
            spentOnThisDay = transportExpenses.reduce((sum, e) => sum + e.amount, 0);
            if (spentOnThisDay > 0 && !manualChecked) {
              isSuccess = false;
              dayNote = `نقل/تاكسي: ${spentOnThisDay.toFixed(3)} ${currency}`;
            } else {
              isSuccess = true;
              dayNote = 'مشاوير مشي صحية 🚶‍♂️';
            }
            break;
          }

          case 'grocery_cap': {
            const marketExpenses = dayExpenses.filter(e => e.categoryId === '1' || e.categoryId === ch.targetCategoryId);
            spentOnThisDay = marketExpenses.reduce((sum, e) => sum + e.amount, 0);
            isSuccess = true;
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

          case 'roundup_streak':
          case 'ladder_saving': {
            const transferExpenses = expenses.filter(e => 
              e.isTransfer && 
              e.date && 
              e.date.split('T')[0] === weekDay.date && 
              ((e.note || '').includes('حصالة') || (e.note || '').includes('فكة') || (e.note || '').includes('🪙') || (e.note || '').includes('سلم'))
            );
            spentOnThisDay = transferExpenses.reduce((sum, e) => sum + e.amount, 0);
            isSuccess = spentOnThisDay > 0 || !!manualChecked;
            dayNote = isSuccess ? 'تم التحويل للحصالة 🪙' : 'في انتظار التحويل';
            break;
          }

          case 'energy_saver':
          case 'family_pot':
          case 'strict_list':
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
            dayNote = isSuccess ? 'ملتزم بالهدف ✨' : `مصروف: ${spentOnThisDay.toFixed(3)} ${currency}`;
            break;
          }
        }

        totalSpentInChallenge += spentOnThisDay;

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
        progressPercentage = Math.min(100, Math.round((successfulDaysCount / (ch.targetDays || 2)) * 100));
        totalSaved = successfulDaysCount * (dailyBudget > 0 ? dailyBudget : 15);
      } else {
        progressPercentage = Math.min(100, Math.round((successfulDaysCount / (ch.targetDays || 7)) * 100));
        totalSaved = (ch.estimatedSavingTND / (ch.targetDays || 7)) * successfulDaysCount;
      }

      return {
        ...ch,
        days: updatedDays,
        successfulDaysCount,
        progressPercentage,
        totalSavedSoFar: Math.round(totalSaved * 1000) / 1000,
        status: ch.status
      };
    });
  }, [challenges, expenses, currentWeekDays, categories, dailyBudget, currency]);

  // Actions
  const startChallenge = useCallback((challengeId: string) => {
    hapticFeedback('medium');
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.8 }
    });
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
        toast('تم إرجاع التحدي للقائمة المتاحة.');
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
              confetti({
                particleCount: 25,
                spread: 50,
                origin: { y: 0.7 }
              });
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

    // Fire big celebration confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    const reward = ch.rewardPoints || 50;
    setPoints(prev => prev + reward);

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

    setCelebrationChallenge(ch);
    toast.success(`ألف مبروك! 🎉 ربحت ${reward} نقطة ووسام الإنجاز!`);
  }, [computedChallenges]);

  const openDailyMysteryBox = useCallback(() => {
    if (!isDailyBoxAvailable) {
      toast('لقد استلمت هدية الصندوق اليومي بالفعل! عد غداً للحصول على مكافأة جديدة 🎁');
      return;
    }

    hapticFeedback('heavy');
    confetti({
      particleCount: 80,
      spread: 90,
      origin: { y: 0.5 }
    });

    const bonusPoints = Math.floor(Math.random() * 16) + 10; // 10 to 25 pts
    const randomTip = DAILY_TIPS[Math.floor(Math.random() * DAILY_TIPS.length)];

    setPoints(prev => prev + bonusPoints);
    setLastDailyBoxDate(todayDateStr);

    toast.success(`🎁 فتحت صندوق الحظ! ربحت +${bonusPoints} نقطة مجانية!\n\n💡 نصيحة اليوم: ${randomTip}`, {
      duration: 6000
    });
  }, [isDailyBoxAvailable, todayDateStr]);

  const createCustomChallenge = useCallback((custom: {
    title: string;
    description: string;
    type: WeeklyChallengeType;
    category?: ChallengeCategory;
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
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.7 }
    });
    const newId = `custom_challenge_${Date.now()}`;
    const newChallenge: WeeklyChallenge = {
      id: newId,
      type: custom.type,
      category: custom.category || 'lifestyle_fun',
      title: custom.title,
      description: custom.description,
      icon: custom.icon || 'Target',
      difficulty: 'medium',
      badgeName: `وسام ${custom.title}`,
      badgeIcon: custom.icon || 'Medal',
      rewardPoints: custom.rewardPoints || 45,
      estimatedSavingTND: custom.estimatedSavingTND || 25,
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
    currentLevel,
    nextLevel,
    levelProgressPercentage,
    badges,
    isDailyBoxAvailable,
    totalEstimatedSaved,
    maxStreakDays,
    currentWeekDays,
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
  };
}
