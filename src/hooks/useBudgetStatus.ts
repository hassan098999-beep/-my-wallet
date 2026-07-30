import { useMemo } from 'react';
import { useAppContext } from '../store/AppContext';
import { getBudgetRange, getBudgetMonth } from '../utils';
import { parseISO, differenceInDays, startOfDay } from 'date-fns';

export function useBudgetStatus(overrideMonth?: string) {
  const { budgets, expenses, firstDayOfMonth, rollingBudgetEnabled } = useAppContext();

  return useMemo(() => {
    const today = new Date();
    const activeMonth = overrideMonth || getBudgetMonth(today, firstDayOfMonth);
    const budget = budgets.find(b => b.month === activeMonth);
    const categoryBudgets = budget?.categoryBudgets || {};
    
    // Parse range for budget month
    const { start, end } = getBudgetRange(activeMonth, firstDayOfMonth);
    
    // Monthly expenses (excluding transfers)
    const currentMonthExpenses = expenses.filter(e => {
      if (e.isTransfer) return false;
      const d = parseISO(e.date);
      return d >= start && d <= end;
    });

    const totalSpent = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const globalBudgetNum = budget?.amount || 0;
    const overallPercentage = globalBudgetNum > 0 ? (totalSpent / globalBudgetNum) * 100 : 0;
    const remainingBudget = Math.max(0, globalBudgetNum - totalSpent);

    // Individual category sub-budget calculations
    const categoryStatuses = Object.entries(categoryBudgets || {}).map(([catId, amount]) => {
      const limit = Number(amount) || 0;
      const spent = currentMonthExpenses
        .filter(e => e.categoryId === catId)
        .reduce((sum, e) => sum + e.amount, 0);
      const percentage = limit > 0 ? (spent / limit) * 100 : 0;
      const remaining = limit - spent; // Can be negative represents overspent
      
      return {
        categoryId: catId,
        limit,
        spent,
        percentage,
        remaining
      };
    });

    const categoryStatusesLookup = categoryStatuses.reduce((acc, curr) => {
      acc[curr.categoryId] = curr;
      return acc;
    }, {} as Record<string, { categoryId: string, limit: number, spent: number, percentage: number, remaining: number }>);

    // Days calculation
    const daysInMonth = differenceInDays(end, start) + 1;
    const todayStart = startOfDay(today);
    
    let remainingDays = 0;
    if (todayStart <= startOfDay(end)) {
      if (todayStart < startOfDay(start)) {
        remainingDays = daysInMonth;
      } else {
        remainingDays = differenceInDays(startOfDay(end), todayStart) + 1; // including today
      }
    }

    let dailyLimit = 0;
    if (todayStart <= startOfDay(end)) {
      if (!rollingBudgetEnabled) {
        dailyLimit = globalBudgetNum / daysInMonth;
      } else {
        dailyLimit = remainingDays > 0 ? remainingBudget / remainingDays : 0;
      }
    }

    // Today's spending
    const todayStr = today.toISOString().split('T')[0];
    const todaySpent = expenses
      .filter(e => !e.isTransfer && e.date === todayStr)
      .reduce((sum, e) => sum + e.amount, 0);

    const remainingToday = Math.max(0, dailyLimit - todaySpent);

    return {
      globalBudgetNum,
      totalSpent,
      overallPercentage,
      remainingBudget,
      dailyLimit,
      todaySpent,
      remainingToday,
      daysInMonth,
      remainingDays,
      activeMonth,
      categoryStatuses,
      categoryStatusesLookup
    };
  }, [budgets, expenses, firstDayOfMonth, rollingBudgetEnabled, overrideMonth]);
}
