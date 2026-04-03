import { Achievement } from '../types';

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_expense',
    title: 'أول مصروف',
    description: 'تسجيل أول عملية مالية لك',
    icon: 'PlusCircle',
    target: 1,
    progress: 0,
  },
  {
    id: 'budget_master',
    title: 'خبير الميزانية',
    description: 'البقاء ضمن الميزانية الشهرية لـ 3 أشهر متتالية',
    icon: 'Target',
    target: 3,
    progress: 0,
  },
  {
    id: 'savings_streak',
    title: 'سلسلة التوفير',
    description: 'تسجيل المصاريف يومياً لمدة أسبوع',
    icon: 'Flame',
    target: 7,
    progress: 0,
  },
  {
    id: 'category_conqueror',
    title: 'قاهر الفئات',
    description: 'تسجيل مصروف في كل فئة من الفئات الأساسية',
    icon: 'Layers',
    target: 8, // Assuming 8 default categories
    progress: 0,
  },
  {
    id: 'active_logger',
    title: 'مسجل نشط',
    description: 'تسجيل المصاريف بانتظام (7 عمليات)',
    icon: 'PenTool',
    target: 7,
    progress: 0,
  }
];
