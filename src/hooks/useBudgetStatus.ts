import { useMemo } from 'react';
import { useAppContext } from '../store/AppContext';
import { getBudgetRange, getBudgetMonth, getWeekRange } from '../utils';
import { parseISO, differenceInDays, startOfDay, endOfDay, format, addDays } from 'date-fns';
import { BudgetPeriod } from '../types';
import { analyzeAllCategoryPaces, CategoryPaceStatus } from '../utils/paceAnalysis';

export function useBudgetStatus(overrideMonth?: string) {
  const { budgets, expenses, categories, currency, firstDayOfMonth, rollingBudgetEnabled } = useAppContext();

  return useMemo(() => {
    const today = new Date();
    const activeMonth = overrideMonth || getBudgetMonth(today, firstDayOfMonth);
    const budget = budgets.find(b => b.month === activeMonth);
    const categoryBudgets = budget?.categoryBudgets || {};
    const categoryPeriods = budget?.categoryPeriods || {};
    const overallPeriod: BudgetPeriod = budget?.period || 'monthly';
    
    // Parse range for budget month
    const { start: monthStart, end: monthEnd } = getBudgetRange(activeMonth, firstDayOfMonth);
    
    // Parse range for current week
    const { start: weekStart, end: weekEnd } = getWeekRange(today, 1);
    
    // Monthly expenses (excluding transfers)
    const currentMonthExpenses = expenses.filter(e => {
      if (e.isTransfer) return false;
      const d = parseISO(e.date);
      return d >= monthStart && d <= monthEnd;
    });

    // Weekly expenses (excluding transfers)
    const currentWeekExpenses = expenses.filter(e => {
      if (e.isTransfer) return false;
      const d = parseISO(e.date);
      return d >= weekStart && d <= weekEnd;
    });

    const monthSpent = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const weekSpent = currentWeekExpenses.reduce((sum, e) => sum + e.amount, 0);
    const globalBudgetNum = budget?.amount || 0;

    // Days calculation for Month
    const daysInMonth = differenceInDays(monthEnd, monthStart) + 1;
    const todayStart = startOfDay(today);
    
    let remainingDays = 0;
    if (todayStart <= startOfDay(monthEnd)) {
      if (todayStart < startOfDay(monthStart)) {
        remainingDays = daysInMonth;
      } else {
        remainingDays = differenceInDays(startOfDay(monthEnd), todayStart) + 1; // including today
      }
    }

    // Days calculation for Week
    const daysInWeek = 7;
    const remainingDaysInWeek = Math.max(1, differenceInDays(startOfDay(weekEnd), todayStart) + 1);

    // Contextual Spending & Remaining based on overall period
    const totalSpent = overallPeriod === 'weekly' ? weekSpent : monthSpent;
    const overallPercentage = globalBudgetNum > 0 ? (totalSpent / globalBudgetNum) * 100 : 0;
    const remainingBudget = Math.max(0, globalBudgetNum - totalSpent);

    let dailyLimit = 0;
    if (overallPeriod === 'weekly') {
      if (!rollingBudgetEnabled) {
        dailyLimit = globalBudgetNum / daysInWeek;
      } else {
        dailyLimit = remainingDaysInWeek > 0 ? remainingBudget / remainingDaysInWeek : 0;
      }
    } else {
      if (todayStart <= startOfDay(monthEnd)) {
        if (!rollingBudgetEnabled) {
          dailyLimit = globalBudgetNum / daysInMonth;
        } else {
          dailyLimit = remainingDays > 0 ? remainingBudget / remainingDays : 0;
        }
      }
    }

    // Individual category sub-budget calculations
    const categoryStatuses = Object.entries(categoryBudgets || {}).map(([catId, amount]) => {
      const limit = Number(amount) || 0;
      const period: BudgetPeriod = categoryPeriods[catId] || 'monthly';

      const catMonthSpent = currentMonthExpenses
        .filter(e => e.categoryId === catId)
        .reduce((sum, e) => sum + e.amount, 0);

      const catWeekSpent = currentWeekExpenses
        .filter(e => e.categoryId === catId)
        .reduce((sum, e) => sum + e.amount, 0);

      let effectiveLimit = limit;
      let pastSurplusDeficit = 0;

      if (period === 'weekly' && rollingBudgetEnabled && limit > 0) {
        // Calculate rolling adjustment from past weeks in the active month
        const weeks: { start: Date; end: Date }[] = [];
        let curStart = new Date(monthStart);
        while (curStart <= monthEnd) {
          const curEnd = new Date(Math.min(monthEnd.getTime(), addDays(curStart, 6).getTime()));
          weeks.push({ start: curStart, end: curEnd });
          curStart = addDays(curEnd, 1);
        }

        const currentWeekIndex = weeks.findIndex(w => today >= startOfDay(w.start) && today <= endOfDay(w.end));
        if (currentWeekIndex > 0) {
          for (let k = 0; k < currentWeekIndex; k++) {
            const w = weeks[k];
            const wSpent = expenses
              .filter(e => {
                if (e.isTransfer || e.categoryId !== catId) return false;
                const d = parseISO(e.date);
                return d >= startOfDay(w.start) && d <= endOfDay(w.end);
              })
              .reduce((sum, e) => sum + e.amount, 0);
            
            pastSurplusDeficit += (limit - wSpent);
          }
          effectiveLimit = Math.max(0, limit + pastSurplusDeficit);
        }
      }

      const spent = period === 'weekly' ? catWeekSpent : catMonthSpent;
      const percentage = effectiveLimit > 0 ? (spent / effectiveLimit) * 100 : (spent > 0 ? 100 : 0);
      const remaining = effectiveLimit - spent; // Can be negative represents overspent
      const isOver = effectiveLimit > 0 && spent > effectiveLimit;

      const safeDailySpend = period === 'weekly'
        ? (remainingDaysInWeek > 0 && remaining > 0 ? remaining / remainingDaysInWeek : 0)
        : (remainingDays > 0 && remaining > 0 ? remaining / remainingDays : 0);

      const monthlyEquivalent = period === 'weekly' ? Math.round(effectiveLimit * (daysInMonth / 7)) : effectiveLimit;
      const weeklyEquivalent = period === 'monthly' ? Math.round(effectiveLimit / (daysInMonth / 7)) : effectiveLimit;
      
      return {
        categoryId: catId,
        limit,
        effectiveLimit,
        pastSurplusDeficit,
        spent,
        monthSpent: catMonthSpent,
        weekSpent: catWeekSpent,
        percentage,
        remaining,
        isOver,
        period,
        safeDailySpend,
        monthlyEquivalent,
        weeklyEquivalent
      };
    });

    const categoryStatusesLookup = categoryStatuses.reduce((acc, curr) => {
      acc[curr.categoryId] = curr;
      return acc;
    }, {} as Record<string, typeof categoryStatuses[number]>);

    // Deep pace analysis for all categories with budget
    const categoryPaces: CategoryPaceStatus[] = analyzeAllCategoryPaces({
      categories,
      budgets,
      expenses,
      firstDayOfMonth,
      currency,
      overrideMonth: activeMonth
    });

    const fastBurningPaces = categoryPaces.filter(p => p.status === 'critical' || p.status === 'warning' || p.status === 'exceeded');

    // Today's spending
    const todayStr = format(today, 'yyyy-MM-dd');
    const todaySpent = expenses
      .filter(e => !e.isTransfer && (e.date || '').split('T')[0] === todayStr)
      .reduce((sum, e) => sum + e.amount, 0);

    const remainingToday = Math.max(0, dailyLimit - todaySpent);

    return {
      globalBudgetNum,
      overallPeriod,
      totalSpent,
      monthSpent,
      weekSpent,
      overallPercentage,
      remainingBudget,
      dailyLimit,
      todaySpent,
      remainingToday,
      daysInMonth,
      remainingDays,
      daysInWeek,
      remainingDaysInWeek,
      activeMonth,
      categoryStatuses,
      categoryStatusesLookup,
      categoryPaces,
      fastBurningPaces,
      weekStart,
      weekEnd,
      monthStart,
      monthEnd
    };
  }, [budgets, expenses, categories, currency, firstDayOfMonth, rollingBudgetEnabled, overrideMonth]);
}
