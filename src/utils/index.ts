import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { parseISO, startOfMonth, endOfMonth, addMonths, subMonths, setDate, isWithinInterval, subDays, format } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getBudgetRange(monthStr: string, firstDay: number = 1) {
  const [year, month] = monthStr.split('-').map(Number);
  const budgetMonthDate = new Date(year, month - 1, 1);
  
  if (firstDay === 1) {
    return {
      start: startOfMonth(budgetMonthDate),
      end: endOfMonth(budgetMonthDate)
    };
  }

  // If firstDay = 25, and monthStr = 2026-03
  // Start is 2026-02-25
  // End is 2026-03-24
  const start = setDate(subMonths(budgetMonthDate, 1), firstDay);
  const end = subDays(setDate(budgetMonthDate, firstDay), 1);
  
  // Set times to cover full days
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
}

export function getBudgetMonth(date: Date, firstDay: number = 1): string {
  if (firstDay === 1) return format(date, 'yyyy-MM');
  
  const day = date.getDate();
  let month = date.getMonth();
  let year = date.getFullYear();
  
  if (day >= firstDay) {
    // We are in the next budget month
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }
  
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

const currencyFormatters: Record<string, Intl.NumberFormat> = {};

export function formatCurrency(amount: number, currency: string = 'TND') {
  const safeAmount = isNaN(amount) ? 0 : amount;
  
  if (!currencyFormatters[currency]) {
    currencyFormatters[currency] = new Intl.NumberFormat('ar-TN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 3,
    });
  }
  
  return currencyFormatters[currency].format(safeAmount);
}

export function hapticFeedback(type: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning' = 'light') {
  // Disabled as per user request
  return;
}
