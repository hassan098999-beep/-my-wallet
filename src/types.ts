export type PaymentMethod = 'cash' | 'card' | 'transfer';
export type RecurringInterval = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Account {
  id: string;
  name: string;
  balance: number;
  color: string;
  icon: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
  subcategories?: string[];
  type?: 'need' | 'want' | 'saving';
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  target: number;
  progress: number;
  earnedAt?: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string; // ISO string
  createdAt: string;
  linkedCategoryId?: string;
  isLinkedToOverallBudget?: boolean;
}

export interface Expense {
  id: string;
  amount: number;
  categoryId: string;
  subcategoryId?: string;
  accountId?: string;
  goalId?: string;
  date: string; // ISO string
  note: string;
  paymentMethod: PaymentMethod; // Keeping for backward compatibility
  createdAt: string;
}

export interface RecurringExpense {
  id: string;
  amount: number;
  categoryId: string;
  subcategoryId?: string;
  accountId?: string;
  note: string;
  paymentMethod: PaymentMethod;
  interval: RecurringInterval;
  startDate: string; // ISO string
  nextDate: string; // ISO string
  createdAt: string;
}

export interface Budget {
  amount: number;
  month: string; // YYYY-MM
  categoryBudgets?: Record<string, number>;
}

export interface Income {
  id: string;
  source: string;
  amount: number;
  accountId?: string;
  date: string; // ISO string
  createdAt: string;
}

export interface AppNotification {
  id: string;
  message: string;
  type: 'budget' | 'unusual_expense' | 'achievement';
  createdAt: string;
}

export interface AppState {
  expenses: Expense[];
  recurringExpenses: RecurringExpense[];
  categories: Category[];
  accounts: Account[];
  budget: Budget | null;
  theme: 'light' | 'dark';
  currency: string;
  achievements: Achievement[];
  goals: Goal[];
  income: Income[];
  notifications: AppNotification[];
  hasCompletedOnboarding: boolean;
}
