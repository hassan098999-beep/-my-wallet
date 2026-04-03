import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'DZD'): string {
  return new Intl.NumberFormat('ar-DZ', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

export function hapticFeedback(type: 'light' | 'medium' | 'heavy' = 'light') {
  if ('vibrate' in navigator) {
    const duration = type === 'light' ? 10 : type === 'medium' ? 20 : 40;
    navigator.vibrate(duration);
  }
}

export function getBudgetMonth(date?: string): string {
  const d = date ? new Date(date) : new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function getBudgetRange(month: string): { start: string; end: string } {
  const [year, mon] = month.split('-').map(Number);
  const start = new Date(year, mon - 1, 1).toISOString().split('T')[0];
  const end = new Date(year, mon, 0).toISOString().split('T')[0];
  return { start, end };
}
