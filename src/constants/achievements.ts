import { Achievement } from '../types';

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_expense',
    title: 'أول خطوة',
    description: 'تسجيل أول عملية مالية لك بنجاح',
    icon: 'CheckCircle2',
    target: 1,
    progress: 0,
  },
  {
    id: 'budget_champion',
    title: 'بطل الالتزام',
    description: 'البقاء ضمن الميزانية المحددة لمدة شهر كامل',
    icon: 'Trophy',
    target: 1,
    progress: 0,
  },
  {
    id: 'category_master',
    title: 'سيد التصنيفات',
    description: 'استخدام جميع فئات المصاريف الأساسية',
    icon: 'LayoutGrid',
    target: 6, // Matches DEFAULT_CATEGORIES size
    progress: 0,
  },
  {
    id: 'savings_streak',
    title: 'سلسلة التوفير',
    description: 'عدم تجاوز حد الإنفاق اليومي لمدة 5 أيام متتالية',
    icon: 'Zap',
    target: 5,
    progress: 0,
  },
  {
    id: 'active_logger',
    title: 'الانتظام المالي',
    description: 'تسجيل المصاريف لمدة 7 أيام متتالية',
    icon: 'CalendarClock',
    target: 7,
    progress: 0,
  },
  {
    id: 'goal_getter',
    title: 'صائد الأهداف',
    description: 'إكمال أول هدف ادخار لك',
    icon: 'Target',
    target: 1,
    progress: 0,
  }
];
