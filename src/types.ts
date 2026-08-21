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
  goalPriority?: 'family' | 'essential' | 'personal';
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

export type BudgetPeriod = 'monthly' | 'weekly';

export interface Budget {
  amount: number;
  month: string; // YYYY-MM
  period?: BudgetPeriod;
  categoryBudgets?: Record<string, number>;
  categoryWeeklyBudgets?: Record<string, Record<number, number>>;
  categoryPeriods?: Record<string, BudgetPeriod>;
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
  type: 'budget' | 'unusual_expense' | 'achievement' | 'pace_warning' | 'debt_due';
  createdAt: string;
  categoryId?: string;
  debtId?: string;
  meta?: {
    dailyRate?: number;
    safeRate?: number;
    daysLeft?: number;
    projectedSpend?: number;
    limit?: number;
  };
}

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
  paceRatio: number;
  status: 'safe' | 'moderate' | 'warning' | 'critical' | 'exceeded';
  alertTitle: string;
  alertMessage: string;
  actionAdvice: string;
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

export interface FinancialHealthAssessment {
  score: number; // 0 - 100
  grade: 'ممتاز' | 'جيد جداً' | 'متوسط' | 'يحتاج تحسين' | 'حرج';
  summary: string;
  metrics: {
    savingsRatePercent: number;
    budgetDisciplinePercent: number;
    emergencyFundMonths: number;
    needsVsWantsRatio: string;
  };
  strengths: string[];
  vulnerabilities: string[];
  actionPlan: {
    title: string;
    impact: string;
    actionType: 'budget' | 'goal' | 'expense_cut' | 'general';
    categoryTarget?: string;
    amount?: number;
  }[];
}

export interface AISavingPlan {
  goalName: string;
  targetAmount: number;
  timeframeMonths: number;
  monthlySavingsRequired: number;
  categoryReductions: {
    category: string;
    currentSpend: number;
    suggestedReduction: number;
    newMonthlySpend: number;
    tips: string[];
  }[];
  milestones: {
    month: number;
    projectedAccumulated: number;
    encouragement: string;
  }[];
  feasibilityRating: 'عالية جداً' | 'ممكنة مع التزام' | 'صعبة تحتاج تعديل';
}

export interface AIInsights {
  advice: FinancialAdvice[];
  forecast: FinancialForecast[];
  healthAssessment?: FinancialHealthAssessment;
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

export type DebtDirection = 'owed_to_me' | 'i_owe'; // لي عند فلان / علي لفلان

export interface DebtPayment {
  id: string;
  amount: number;
  date: string;
  note?: string;
}

export interface Debt {
  id: string;
  personName: string;
  direction: DebtDirection;
  totalAmount: number;
  remainingAmount: number;
  dueDate?: string;
  note?: string;
  accountId?: string; // الحساب المرتبط عند التسديد
  isSettled: boolean;
  createdAt: string;
  payments: DebtPayment[];
}

export interface AppState {
  expenses: Expense[];
  recurringExpenses: RecurringExpense[];
  categories: Category[];
  accounts: Account[];
  budgets: Budget[];
  dailyBudget: number;
  rollingBudgetEnabled: boolean;
  theme: 'light' | 'dark';
  currency: string;
  achievements: Achievement[];
  goals: Goal[];
  debts?: Debt[];
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
