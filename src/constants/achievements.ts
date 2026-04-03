import { Achievement } from '../types';

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_expense',
    title: 'أول مصروف',
    description: 'سجّل أول مصروف لك',
    icon: '💰',
    target: 1,
    progress: 0,
  },
  {
    id: 'ten_expenses',
    title: 'عشر مصاريف',
    description: 'سجّل 10 مصاريف',
    icon: '📊',
    target: 10,
    progress: 0,
  },
  {
    id: 'first_budget',
    title: 'أول ميزانية',
    description: 'أنشئ أول ميزانية لك',
    icon: '🎯',
    target: 1,
    progress: 0,
  },
  {
    id: 'first_goal',
    title: 'أول هدف',
    description: 'أنشئ أول هدف ادخاري',
    icon: '🏆',
    target: 1,
    progress: 0,
  },
  {
    id: 'savings_streak',
    title: 'مدخّر',
    description: 'وفّر 100 وحدة',
    icon: '⭐',
    target: 100,
    progress: 0,
  },
];
