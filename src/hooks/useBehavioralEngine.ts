import { useMemo } from 'react';
import { useAppContext } from '../store/AppContext';
import { Expense, Category } from '../types';
import { startOfDay, endOfDay, subDays, isWithinInterval, format, parseISO, startOfWeek, endOfWeek, subWeeks, startOfMonth, endOfMonth } from 'date-fns';

export interface BehavioralInsight {
  id: string;
  title: string;
  description: string;
  type: 'pattern' | 'warning' | 'positive' | 'prediction';
  impact?: string;
}

export const useBehavioralEngine = () => {
  const { expenses, dailyBudget, rollingBudgetEnabled, categories } = useAppContext();

  const insights = useMemo(() => {
    const list: BehavioralInsight[] = [];
    if (expenses.length === 0) return list;

    // 1. Time-based analysis
    const timeSlots = {
      morning: 0,   // 5am - 12pm
      afternoon: 0, // 12pm - 6pm
      evening: 0,   // 6pm - 10pm
      night: 0      // 10pm - 5am
    };

    expenses.forEach(e => {
      const hour = new Date(e.date).getHours();
      if (hour >= 5 && hour < 12) timeSlots.morning += e.amount;
      else if (hour >= 12 && hour < 18) timeSlots.afternoon += e.amount;
      else if (hour >= 18 && hour < 22) timeSlots.evening += e.amount;
      else timeSlots.night += e.amount;
    });

    const maxTime = Object.entries(timeSlots).reduce((a, b) => a[1] > b[1] ? a : b);
    const timeLabels: Record<string, string> = {
      morning: 'الصباح',
      afternoon: 'الظهيرة',
      evening: 'المساء',
      night: 'الليل'
    };

    list.push({
      id: 'time-pattern',
      title: `نمط الإنفاق الزمني`,
      description: `أنت تنفق معظم أموالك في فترة ${timeLabels[maxTime[0]]}.`,
      type: 'pattern'
    });

    // 2. Category Projections (Real Cost Awareness)
    const categoryTotals: Record<string, number> = {};
    const last30Days = subDays(new Date(), 30);
    
    expenses.filter(e => isWithinInterval(parseISO(e.date), { start: last30Days, end: new Date() }))
      .forEach(e => {
        categoryTotals[e.categoryId] = (categoryTotals[e.categoryId] || 0) + e.amount;
      });

    Object.entries(categoryTotals).forEach(([catId, total]) => {
      if (total > 50) { // Only show significant costs
        const category = categories.find(c => c.id === catId);
        if (category) {
          list.push({
            id: `cost-awareness-${catId}`,
            title: `تكلفة حقيقية: ${category.name}`,
            description: `أنت تنفق حوالي ${total.toFixed(1)} TND شهرياً على ${category.name}.`,
            type: 'warning',
            impact: `هذا يمثل ${( (total / (dailyBudget * 30)) * 100 ).toFixed(1)}% من ميزانيتك الشهرية.`
          });
        }
      }
    });

    // 3. Trend Prediction
    const thisWeek = expenses.filter(e => isWithinInterval(parseISO(e.date), { start: startOfWeek(new Date()), end: new Date() }))
      .reduce((sum, e) => sum + e.amount, 0);
    const lastWeek = expenses.filter(e => isWithinInterval(parseISO(e.date), { start: startOfWeek(subWeeks(new Date(), 1)), end: endOfWeek(subWeeks(new Date(), 1)) }))
      .reduce((sum, e) => sum + e.amount, 0);

    if (thisWeek > lastWeek && lastWeek > 0) {
      const diff = ((thisWeek - lastWeek) / lastWeek) * 100;
      list.push({
        id: 'trend-warning',
        title: `تحذير الاتجاه`,
        description: `إنفاقك هذا الأسبوع أعلى بنسبة ${diff.toFixed(0)}% من الأسبوع الماضي.`,
        type: 'warning'
      });
    }

    return list;
  }, [expenses, categories, dailyBudget]);

  const rollingBudget = useMemo(() => {
    if (!rollingBudgetEnabled) return dailyBudget;

    const today = startOfDay(new Date());
    const monthStart = startOfMonth(new Date());
    
    // Calculate total budget for the month so far
    const daysPassed = Math.floor((today.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const totalBudgetSoFar = dailyBudget * daysPassed;
    
    // Calculate total spent this month so far (excluding today)
    const totalSpentThisMonth = expenses
      .filter(e => {
        const d = parseISO(e.date);
        return isWithinInterval(d, { start: monthStart, end: subDays(today, 1) });
      })
      .reduce((sum, e) => sum + e.amount, 0);

    // Adjusted budget for today = (Total budget so far) - (Total spent so far)
    // This effectively carries over the remaining balance from previous days
    return Math.max(0, totalBudgetSoFar - totalSpentThisMonth);
  }, [expenses, dailyBudget, rollingBudgetEnabled]);

  return { insights, rollingBudget };
};
