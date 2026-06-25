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
  order?: number;
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
  monthlySavingsTarget?: number;
  isEmergencyFund?: boolean;
  isPhysicalPiggyBank?: boolean;
}

export type Mood = 'happy' | 'neutral' | 'sad' | 'stressed' | 'excited';

export interface Expense {
  id: string;
  amount: number;
  categoryId: string;
  subcategoryId?: string;
  accountId?: string;
  goalId?: string;
  date: string; // ISO string
  parsedDate?: Date; // Pre-parsed date for performance
  note: string;
  paymentMethod: PaymentMethod; // Keeping for backward compatibility
  createdAt: string;
  mood?: Mood;
  isTransfer?: boolean;
  transferId?: string;
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

export interface GamaeyaPayment {
  monthIndex: number; // 1 to memberCount
  date: string; // YYYY-MM
  paid: boolean;
  expenseId?: string;
  payoutReceived: boolean;
  incomeId?: string;
}

export interface Gamaeya {
  id: string;
  name: string;
  monthlyAmount: number;
  memberCount: number;
  payoutMonth: number; // 1-indexed
  startDate: string; // YYYY-MM
  accountId?: string;
  status: 'active' | 'completed';
  payments: GamaeyaPayment[];
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
  goalId?: string;
  date: string; // ISO string
  parsedDate?: Date; // Pre-parsed date for performance
  createdAt: string;
  isTransfer?: boolean;
  transferId?: string;
}

export interface AppNotification {
  id: string;
  message: string;
  type: 'budget' | 'unusual_expense' | 'achievement';
  createdAt: string;
}

export interface FinancialAdvice {
  title: string;
  advice: string;
  actionItem: string;
  priority: 'low' | 'medium' | 'high';
}

export interface FinancialForecast {
  month: string;
  predictedBalance: number;
  confidence: number;
  reasoning: string;
}

export interface AIInsights {
  advice: FinancialAdvice[];
  forecast: FinancialForecast[];
  lastUpdated: string; // ISO string
}

export interface SmartSavingChallenge {
  title: string;
  description: string;
  targetAmount: number;
  durationDays: number;
  tips: string[];
  categoryName: string;
  difficulty: 'سهل' | 'متوسط' | 'صعب';
  analysis?: string;
  acceptedAt?: string; // ISO string
  isCompleted?: boolean;
}

export interface BackupRecord {
  id: string;
  createdAt: string;
  name: string;
  version: string;
  data: string;
}

export interface AppState {
  expenses: Expense[];
  recurringExpenses: RecurringExpense[];
  categories: Category[];
  accounts: Account[];
  budget: Budget | null;
  dailyBudget: number;
  rollingBudgetEnabled: boolean;
  theme: 'light' | 'dark';
  currency: string;
  achievements: Achievement[];
  goals: Goal[];
  income: Income[];
  notifications: AppNotification[];
  hasCompletedOnboarding: boolean;
  userName?: string;
  firstDayOfMonth: number;
  aiInsights?: AIInsights;
  bestStreak: number;
  offlineMode: boolean;
  gamaeyas?: Gamaeya[];
  activeChallenge?: SmartSavingChallenge;
  autoRoundUpSetting?: AutoRoundUpSetting;
}

export interface AutoRoundUpSetting {
  enabled: boolean;
  targetGoalId?: string; // target Goal to deposit "fakka"
  multiplier: number; // e.g., 1, 5, or 10 TND
}
