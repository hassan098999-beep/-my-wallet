import { AppState, Achievement } from '../types';
import { ACHIEVEMENTS } from '../constants/achievements';
import { parseISO, isSameDay, subDays } from 'date-fns';
import { getBudgetMonth } from './index';

export const evaluateAchievements = (state: AppState): Achievement[] => {
  const evaluated: Achievement[] = [];
  
  const expenses = state.expenses || [];
  const categories = state.categories || [];
  
  for (const template of ACHIEVEMENTS) {
    let progress = 0;
    
    switch (template.id) {
      case 'first_expense':
        progress = expenses.length > 0 ? 1 : 0;
        break;
      case 'active_logger':
        progress = expenses.length;
        break;
      case 'savings_streak':
      case '7_day_streak': {
        const dates = expenses.map(e => e.date.split('T')[0]);
        const uniqueDates = Array.from(new Set(dates)).sort((a: string, b: string) => new Date(b).getTime() - new Date(a).getTime());
        
        if (uniqueDates.length === 0) {
          progress = 0;
          break;
        }

        let maxStreak = 1;
        let currentStreak = 1;
        
        for (let i = 0; i < uniqueDates.length - 1; i++) {
          const currentDate = parseISO(uniqueDates[i] as string);
          const nextDate = parseISO(uniqueDates[i + 1] as string);
          
          if (isSameDay(nextDate, subDays(currentDate, 1))) {
            currentStreak++;
            maxStreak = Math.max(maxStreak, currentStreak);
          } else {
            currentStreak = 1;
          }
        }
        
        progress = maxStreak;
        break;
      }
      case 'category_conqueror': {
        const usedCategories = new Set(expenses.map(e => e.categoryId));
        progress = usedCategories.size;
        break;
      }
      case 'budget_master': {
        if (!state.budget || state.budget.amount <= 0) {
          progress = 0;
          break;
        }
        
        const expensesByMonth = expenses.reduce((acc, e) => {
          const month = getBudgetMonth(parseISO(e.date), state.firstDayOfMonth);
          acc[month] = (acc[month] || 0) + e.amount;
          return acc;
        }, {} as Record<string, number>);
        
        const months = Object.keys(expensesByMonth).sort((a, b) => b.localeCompare(a));
        let consecutiveMonths = 0;
        
        for (const month of months) {
          if (expensesByMonth[month] <= state.budget.amount) {
            consecutiveMonths++;
          } else {
            break;
          }
        }
        progress = consecutiveMonths;
        break;
      }
      default:
        progress = 0;
    }
    
    const existing = state.achievements?.find(a => a.id === template.id);
    const maxProgress = Math.max(existing?.progress || 0, progress);
    const finalProgress = Math.min(maxProgress, template.target);
    const isEarned = finalProgress >= template.target;
    
    evaluated.push({
      ...template,
      progress: finalProgress,
      earnedAt: existing?.earnedAt || (isEarned ? new Date().toISOString() : undefined)
    });
  }
  
  return evaluated;
};
