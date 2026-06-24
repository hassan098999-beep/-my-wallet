import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { parseISO, startOfMonth, endOfMonth, addMonths, subMonths, setDate, isWithinInterval, subDays, format } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function safeParseISO(dateStr: any): Date {
  if (!dateStr || typeof dateStr !== 'string') {
    return new Date();
  }
  try {
    const parsed = parseISO(dateStr);
    if (isNaN(parsed.getTime())) {
      return new Date();
    }
    return parsed;
  } catch (err) {
    console.error('safeParseISO failed:', dateStr, err);
    return new Date();
  }
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
      minimumFractionDigits: currency === 'TND' ? 3 : 0,
      maximumFractionDigits: currency === 'TND' ? 3 : 2,
    });
  }
  
  return currencyFormatters[currency].format(safeAmount);
}

export function hapticFeedback(type: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning' = 'light') {
  // Disabled as per user request
  return;
}

export const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn('localStorage access denied', e);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn('localStorage access denied', e);
    }
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn('localStorage access denied', e);
    }
  }
};

export function removeUndefinedFields<T extends Record<string, any>>(obj: T): Partial<T> {
  if (!obj || typeof obj !== 'object') return obj;
  const newObj: any = Array.isArray(obj) ? [] : {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const val = obj[key];
      if (val !== undefined) {
        if (val !== null && typeof val === 'object' && !((val as any) instanceof Date)) {
          newObj[key] = removeUndefinedFields(val);
        } else {
          newObj[key] = val;
        }
      }
    }
  }
  return newObj;
}

export async function hashPin(pin: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export function formatTunisianAmount(val: string): string {
  if (!val) return '';
  
  // If they are typing a dot, let them type it
  if (val.endsWith('.')) {
    // Only allow one dot
    const firstDotIdx = val.indexOf('.');
    if (val.lastIndexOf('.') !== firstDotIdx) {
      return val.slice(0, firstDotIdx + 1);
    }
    return val;
  }
  
  // Strip all non-digit characters except the first dot
  let clean = val.replace(/[^0-9.]/g, '');
  
  // If it has a dot, let's keep the user's custom dot placement
  if (clean.includes('.')) {
    const parts = clean.split('.');
    const integerPart = parts[0];
    let decimalPart = parts.slice(1).join('');
    // Limit decimal part to 3 digits for TND
    if (decimalPart.length > 3) {
      decimalPart = decimalPart.slice(0, 3);
    }
    return `${integerPart}.${decimalPart}`;
  }
  
  return clean;
}


