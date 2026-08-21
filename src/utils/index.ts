import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import currency from 'currency.js';
import { parseISO, startOfMonth, endOfMonth, addMonths, subMonths, setDate, isWithinInterval, subDays, format, startOfWeek, endOfWeek } from 'date-fns';

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

export function getWeekRange(date: Date = new Date(), weekStartsOn: 0 | 1 | 6 = 1) {
  const start = startOfWeek(date, { weekStartsOn });
  const end = endOfWeek(date, { weekStartsOn });
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function getBudgetRange(monthStr: string, firstDay: number = 1) {
  const [year, month] = monthStr.split('-').map(Number);
  const budgetMonthDate = new Date(year, month - 1, 1);
  
  if (firstDay === 1) {
    const start = startOfMonth(budgetMonthDate);
    const end = endOfMonth(budgetMonthDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
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
  return format(date, 'yyyy-MM');
}

export function formatCurrency(amount: number, currencyCode: string = 'TND', customPrecision?: number) {
  const safeAmount = isNaN(amount) ? 0 : amount;
  
  let symbol = ' د.ت';
  let precision = customPrecision ?? (currencyCode === 'TND' ? 3 : 2);

  if (currencyCode === 'USD' || currencyCode === '$') {
    symbol = ' $';
  } else if (currencyCode === 'EUR' || currencyCode === '€') {
    symbol = ' €';
  } else if (currencyCode === 'SAR' || currencyCode === 'ر.س') {
    symbol = ' ر.س';
  } else if (currencyCode === 'AED' || currencyCode === 'د.إ') {
    symbol = ' د.إ';
  } else if (currencyCode === 'TND' || currencyCode === 'د.ت') {
    symbol = ' د.ت';
  } else if (currencyCode) {
    symbol = ` ${currencyCode}`;
  }

  const formattedNumber = currency(safeAmount, {
    symbol: '',
    separator: ',',
    decimal: '.',
    precision: precision,
  }).format();

  return `${formattedNumber}${symbol}`;
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


