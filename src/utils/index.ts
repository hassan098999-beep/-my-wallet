import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = 'TND') {
  return new Intl.NumberFormat('ar-TN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(amount);
}

export function hapticFeedback(type: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning' = 'light') {
  if (!window.navigator || !window.navigator.vibrate) return;

  switch (type) {
    case 'light':
      window.navigator.vibrate(10);
      break;
    case 'medium':
      window.navigator.vibrate(20);
      break;
    case 'heavy':
      window.navigator.vibrate(40);
      break;
    case 'success':
      window.navigator.vibrate([10, 30, 10]);
      break;
    case 'error':
      window.navigator.vibrate([50, 50, 50]);
      break;
    case 'warning':
      window.navigator.vibrate([30, 50, 30]);
      break;
  }
}
