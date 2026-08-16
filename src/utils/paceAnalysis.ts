import { differenceInDays, startOfDay, parseISO, isSameDay } from 'date-fns';
import { Category, Expense, BudgetPeriod, Budget } from '../types';
import { getBudgetRange, getBudgetMonth, getWeekRange, safeParseISO, formatCurrency } from '../utils';

export interface CategoryPaceStatus {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  period: BudgetPeriod;
  limit: number;
  spent: number;
  remaining: number;
  daysInPeriod: number;
  daysElapsed: number;
  remainingDays: number;
  currentDailyRate: number;
  safeDailyRate: number;
  adjustedDailyRate: number;
  projectedSpend: number;
  projectedOverrun: number;
  projectedPercentage: number;
  daysUntilExhaustion: number | null;
  paceRatio: number; // currentDailyRate / safeDailyRate (1.0 = on target, >1.0 = faster than planned)
  status: 'safe' | 'moderate' | 'warning' | 'critical' | 'exceeded';
  alertTitle: string;
  alertMessage: string;
  actionAdvice: string;
}

/**
 * Calculates the spending velocity (daily burn rate) and overrun forecast for a single category
 */
export function calculateCategoryPace({
  category,
  limit,
  period,
  expenses,
  rangeStart,
  rangeEnd,
  now = new Date(),
  currency = 'د.ت'
}: {
  category: Category;
  limit: number;
  period: BudgetPeriod;
  expenses: Expense[];
  rangeStart: Date;
  rangeEnd: Date;
  now?: Date;
  currency?: string;
}): CategoryPaceStatus | null {
  if (!limit || limit <= 0) return null;

  const todayStart = startOfDay(now);
  const pStart = startOfDay(rangeStart);
  const pEnd = startOfDay(rangeEnd);

  // Total days in period
  const daysInPeriod = Math.max(1, differenceInDays(pEnd, pStart) + 1);

  // Days elapsed so far (inclusive of today)
  let daysElapsed = 1;
  if (todayStart > pEnd) {
    daysElapsed = daysInPeriod;
  } else if (todayStart >= pStart) {
    daysElapsed = Math.max(1, differenceInDays(todayStart, pStart) + 1);
  }

  // Remaining days including today
  let remainingDays = Math.max(1, differenceInDays(pEnd, todayStart) + 1);
  if (todayStart > pEnd) remainingDays = 0;

  // Filter category expenses for current period
  const categoryExpenses = expenses.filter(e => {
    if (e.isTransfer || e.categoryId !== category.id) return false;
    const d = safeParseISO(e.date);
    return d >= rangeStart && d <= rangeEnd;
  });

  const spent = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
  const remaining = limit - spent;

  // Daily rates
  const currentDailyRate = spent > 0 ? spent / daysElapsed : 0;
  const safeDailyRate = limit / daysInPeriod;
  const adjustedDailyRate = remaining > 0 && remainingDays > 0 ? remaining / remainingDays : 0;

  // Forecast projection
  // Projected total spend = spent so far + projected spending for remaining days
  const projectedSpend = spent + (currentDailyRate * Math.max(0, remainingDays - 1));
  const projectedOverrun = Math.max(0, projectedSpend - limit);
  const projectedPercentage = limit > 0 ? (projectedSpend / limit) * 100 : 0;
  const paceRatio = safeDailyRate > 0 ? currentDailyRate / safeDailyRate : 0;

  // Days until budget exhaustion at current rate
  let daysUntilExhaustion: number | null = null;
  if (remaining <= 0) {
    daysUntilExhaustion = 0;
  } else if (currentDailyRate > 0) {
    daysUntilExhaustion = Math.max(1, Math.floor(remaining / currentDailyRate));
  }

  // Determine status & severity
  let status: CategoryPaceStatus['status'] = 'safe';
  let alertTitle = 'الإنفاق ضمن المعدل الآمن';
  let alertMessage = `معدل إنفاقك اليومي (${formatCurrency(currentDailyRate, currency)}/يوم) متوازن ومناسب للميزانية.`;
  let actionAdvice = `يمكنك مواصلة الصرف بحدود ${formatCurrency(adjustedDailyRate, currency)} يومياً.`;

  const periodName = period === 'weekly' ? 'الأسبوع' : 'الشهر';

  if (remaining <= 0) {
    status = 'exceeded';
    alertTitle = `تجاوز ميزانية ${category.name}! 🛑`;
    alertMessage = `لقد استنفدت كامل سقف ميزانية "${category.name}" المحدد بـ ${formatCurrency(limit, currency)}، مع عجز قدره ${formatCurrency(Math.abs(remaining), currency)}.`;
    actionAdvice = `يُرجى تجميد مصاريف هذه الفئة أو تعويض العجز من بنود الرفاهية الأخرى.`;
  } else if (
    (daysUntilExhaustion !== null && daysUntilExhaustion < remainingDays && (daysUntilExhaustion <= 4 || projectedPercentage >= 130)) ||
    (paceRatio >= 1.6 && spent >= limit * 0.4)
  ) {
    status = 'critical';
    alertTitle = `خطر نفاد ميزانية ${category.name} سريعاً! ⚡🚨`;
    alertMessage = `بمعدل صرفك الحالي (${formatCurrency(currentDailyRate, currency)}/يوم)، ستنفد الميزانية المتبقية (${formatCurrency(remaining, currency)}) خلال ${daysUntilExhaustion} أيام فقط، أي قبل نهاية ${periodName} بـ ${remainingDays - (daysUntilExhaustion || 0)} يوماً!`;
    actionAdvice = `لتفادي العجز، قلّص إنفاقك اليومي لهذه الفئة إلى ${formatCurrency(adjustedDailyRate, currency)}/يوم كحد أقصى.`;
  } else if (
    (projectedSpend > limit && daysUntilExhaustion !== null && daysUntilExhaustion < remainingDays) ||
    projectedPercentage >= 100 ||
    (paceRatio >= 1.25 && spent >= limit * 0.3)
  ) {
    status = 'warning';
    alertTitle = `تنبيه: وتيرة إنفاق مرتفعة في ${category.name} ⚠️`;
    alertMessage = `معدل إنفاقك اليومي (${formatCurrency(currentDailyRate, currency)}/يوم) أعلى من المعدل المخطط (${formatCurrency(safeDailyRate, currency)}/يوم). المتوقع تجاوز الميزانية بمقدار ${formatCurrency(projectedOverrun, currency)} بنهاية ${periodName}.`;
    actionAdvice = `المعدل اليومي الآمن المتبقي لتجنب التجاوز هو ${formatCurrency(adjustedDailyRate, currency)}/يوم.`;
  } else if (projectedPercentage >= 85 || paceRatio >= 1.1) {
    status = 'moderate';
    alertTitle = `ملاحظة: اقتراب من سقف ${category.name} 📊`;
    alertMessage = `أنت في حدود مقبولة لكن وتيرة الصرف الحالية تقترب من %${Math.round(projectedPercentage)} من السقف المخصص.`;
    actionAdvice = `احرص على ألا يتعدى صرفك اليومي ${formatCurrency(adjustedDailyRate, currency)}/يوم.`;
  }

  return {
    categoryId: category.id,
    categoryName: category.name,
    categoryIcon: category.icon || 'Layers',
    categoryColor: category.color || '#6366f1',
    period,
    limit,
    spent,
    remaining,
    daysInPeriod,
    daysElapsed,
    remainingDays,
    currentDailyRate,
    safeDailyRate,
    adjustedDailyRate,
    projectedSpend,
    projectedOverrun,
    projectedPercentage,
    daysUntilExhaustion,
    paceRatio,
    status,
    alertTitle,
    alertMessage,
    actionAdvice
  };
}

/**
 * Analyzes spending pace for all categories with an active budget
 */
export function analyzeAllCategoryPaces({
  categories,
  budgets,
  expenses,
  firstDayOfMonth = 1,
  currency = 'د.ت',
  overrideMonth
}: {
  categories: Category[];
  budgets: Budget[];
  expenses: Expense[];
  firstDayOfMonth?: number;
  currency?: string;
  overrideMonth?: string;
}): CategoryPaceStatus[] {
  const now = new Date();
  const currentMonth = overrideMonth || getBudgetMonth(now, firstDayOfMonth);
  const budget = budgets.find(b => b.month === currentMonth);
  if (!budget || !budget.categoryBudgets) return [];

  const categoryBudgets = budget.categoryBudgets;
  const categoryPeriods = budget.categoryPeriods || {};

  const { start: monthStart, end: monthEnd } = getBudgetRange(currentMonth, firstDayOfMonth);
  const { start: weekStart, end: weekEnd } = getWeekRange(now, 1);

  const results: CategoryPaceStatus[] = [];

  for (const [catId, limitVal] of Object.entries(categoryBudgets)) {
    const limit = Number(limitVal) || 0;
    if (limit <= 0) continue;

    const cat = categories.find(c => c.id === catId);
    if (!cat) continue;

    const period: BudgetPeriod = categoryPeriods[catId] || 'monthly';
    const isWeekly = period === 'weekly';

    const rangeStart = isWeekly ? weekStart : monthStart;
    const rangeEnd = isWeekly ? weekEnd : monthEnd;

    const pace = calculateCategoryPace({
      category: cat,
      limit,
      period,
      expenses,
      rangeStart,
      rangeEnd,
      now,
      currency
    });

    if (pace) {
      results.push(pace);
    }
  }

  // Sort by priority: exceeded > critical > warning > moderate > safe
  const priorityOrder = { exceeded: 0, critical: 1, warning: 2, moderate: 3, safe: 4 };
  return results.sort((a, b) => priorityOrder[a.status] - priorityOrder[b.status]);
}

/**
 * Triggers native browser push notification for pace alert if permitted and not duplicated today
 */
export function notifyPaceAlertIfAppropriate(pace: CategoryPaceStatus, currency: string) {
  if (typeof window === 'undefined') return;

  const isEnabled = localStorage.getItem('masarifi_pace_alerts_enabled') !== 'false';
  if (!isEnabled) return;

  // Only trigger for warning, critical, or exceeded
  if (pace.status !== 'critical' && pace.status !== 'warning' && pace.status !== 'exceeded') return;

  const todayStr = new Date().toISOString().split('T')[0];
  const notifKey = `masarifi_pace_notified_${pace.categoryId}_${todayStr}_${pace.status}`;
  const alreadyNotified = localStorage.getItem(notifKey);

  if (alreadyNotified) return;

  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(pace.alertTitle, {
        body: `${pace.alertMessage}\n💡 ${pace.actionAdvice}`,
        icon: '/icon-192.png',
        tag: `pace-${pace.categoryId}`
      });
      localStorage.setItem(notifKey, new Date().toISOString());
    } catch (err) {
      console.warn('Pace push notification failed:', err);
    }
  }
}
