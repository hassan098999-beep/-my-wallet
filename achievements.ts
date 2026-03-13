import { Achievement } from '../types';

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_expense',
    title: 'أول خطوة',
    description: 'تسجيل أول عملية مالية لك',
    icon: 'PlusCircle',
    target: 1,
    progress: 0,
  },
  {
    id: 'budget_master',
    title: 'خبير الميزانية',
    description: 'تحديد ميزانية شهرية والالتزام بها',
    icon: 'Target',
    target: 1,
    progress: 0,
  },
  {
    id: 'no_spend_day',
    title: 'يوم بلا إنفاق',
    description: 'عدم تسجيل أي مصروف لمدة يوم كامل',
    icon: 'ShieldCheck',
    target: 1,
    progress: 0,
  },
  {
    id: 'active_logger',
    title: 'مسجل نشط',
    description: 'تسجيل المصاريف بانتظام (7 عمليات)',
    icon: 'PenTool',
    target: 7,
    progress: 0,
  },
  {
    id: 'category_master',
    title: 'منظم الفئات',
    description: 'إضافة فئة مخصصة لتنظيم مصاريفك',
    icon: 'Layers',
    target: 1,
    progress: 0,
  },
  {
    id: 'first_month_under_budget',
    title: 'أول شهر تحت الميزانية',
    description: 'إنهاء شهر كامل دون تجاوز الميزانية المحددة',
    icon: 'CheckCircle2',
    target: 1,
    progress: 0,
  },
  {
    id: '7_day_streak',
    title: 'سلسلة 7 أيام',
    description: 'تسجيل المصاريف لمدة 7 أيام متتالية',
    icon: 'Flame',
    target: 7,
    progress: 0,
  },
  {
    id: 'category_spending_master',
    title: 'خبير إنفاق الفئات',
    description: 'الالتزام بميزانية فئة معينة لمدة شهر',
    icon: 'Target',
    target: 1,
    progress: 0,
  }
];
