import { AppState, Achievement } from '../types';
import { ACHIEVEMENTS } from '../constants/achievements';
import { parseISO, isSameDay, subDays } from 'date-fns';
import { getBudgetMonth } from './index';

export const evaluateAchievements = (state: AppState): Achievement[] => {
  const evaluated: Achievement[] = [];
  
  const expenses = state.expenses || [];
  const goals = state.goals || [];
  const dailyBudget = state.dailyBudget || 0;
  
  for (const template of ACHIEVEMENTS) {
    let progress = 0;
    
    switch (template.id) {
      case 'first_expense':
        progress = expenses.length > 0 ? 1 : 0;
        break;

      case 'active_logger': {
        const dates = expenses.map(e => e.date.split('T')[0]);
        const uniqueDates = Array.from(new Set(dates)).sort((a: string, b: string) => b.localeCompare(a));
        
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

      case 'category_master': {
        const usedCategories = new Set(expenses.map(e => e.categoryId));
        progress = usedCategories.size;
        break;
      }

      case 'budget_champion': {
        const expensesByMonth = expenses.reduce((acc, e) => {
          const month = e.date.substring(0, 7); // YYYY-MM
          acc[month] = (acc[month] || 0) + e.amount;
          return acc;
        }, {} as Record<string, number>);
        
        const currentMonth = new Date().toISOString().substring(0, 7);
        const fullMonths = Object.keys(expensesByMonth).filter(m => m < currentMonth);
        
        const keptWithinBudget = fullMonths.filter(m => {
          const mBudget = state.budgets?.find(b => b.month === m);
          if (!mBudget || mBudget.amount <= 0) return false;
          return expensesByMonth[m] <= mBudget.amount;
        });
        progress = keptWithinBudget.length > 0 ? 1 : 0;
        break;
      }

      case 'savings_streak': {
        // Not exceeding daily budget streak
        const expensesByDay = expenses.reduce((acc, e) => {
          const day = e.date.split('T')[0];
          acc[day] = (acc[day] || 0) + e.amount;
          return acc;
        }, {} as Record<string, number>);

        const sortedDays = Object.keys(expensesByDay).sort((a, b) => b.localeCompare(a));
        if (sortedDays.length === 0) {
          progress = 0;
          break;
        }

        let maxStreak = 0;
        let currentStreak = 0;

        // Iterate through all days we have data for
        // But the user might have missed days. A missed day is a "0 spend" day which is technically within budget.
        // So we should check a continuous date range.
        
        const firstDay = parseISO(sortedDays[sortedDays.length - 1] as string);
        const lastDay = new Date();
        let checkDate = lastDay;

        while (checkDate >= firstDay) {
          const dateStr = checkDate.toISOString().split('T')[0];
          const daySpend = expensesByDay[dateStr] || 0;
          
          if (daySpend <= dailyBudget) {
            currentStreak++;
            maxStreak = Math.max(maxStreak, currentStreak);
          } else {
            currentStreak = 0;
          }
          checkDate = subDays(checkDate, 1);
        }

        progress = maxStreak;
        break;
      }

      case 'goal_getter': {
        const completedGoals = goals.filter(g => g.currentAmount >= g.targetAmount && g.targetAmount > 0);
        progress = completedGoals.length;
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
