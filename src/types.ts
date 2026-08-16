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

export type BudgetPeriod = 'monthly' | 'weekly';

export interface Budget {
  amount: number;
  month: string; // YYYY-MM
  period?: BudgetPeriod;
  categoryBudgets?: Record<string, number>;
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
  type: 'budget' | 'unusual_expense' | 'achievement' | 'pace_warning';
  createdAt: string;
  categoryId?: string;
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

export type WeeklyChallengeType = 
  | 'no_spend' 
  | 'no_coffee' 
  | 'home_cooking' 
  | 'grocery_cap' 
  | 'freeze_wants' 
  | 'roundup_streak' 
  | 'lunchbox_hero'
  | 'walk_commute'
  | 'energy_saver'
  | 'ladder_saving'
  | 'strict_list'
  | 'cart_delay_24h'
  | 'family_pot'
  | 'custom';

export type ChallengeCategory = 'daily_habits' | 'shopping_saving' | 'lifestyle_fun' | 'family_home';

export interface WeeklyChallengeDayStatus {
  date: string; // YYYY-MM-DD
  dayLabel: string; // 'الإثنين', 'الثلاثاء', etc.
  dayShort: string; // 'إثن', 'ثلا', etc.
  spentAmount: number;
  isSuccess: boolean;
  manualChecked?: boolean;
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
  note?: string;
}

export interface WeeklyChallenge {
  id: string;
  type: WeeklyChallengeType;
  category?: ChallengeCategory;
  title: string;
  subtitle?: string;
  description: string;
  icon: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  badgeName: string;
  badgeIcon: string;
  rewardPoints: number;
  estimatedSavingTND: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  targetDays: number; // e.g. 7 or 2
  targetSpendCap?: number; // e.g. 50 TND
  targetCategoryId?: string; // e.g. '6'
  targetCategoryName?: string;
  targetKeywords?: string[];
  status: 'active' | 'completed' | 'abandoned' | 'available';
  progressPercentage: number;
  successfulDaysCount: number;
  totalSavedSoFar: number;
  days: WeeklyChallengeDayStatus[];
  completedAt?: string;
  isCustom?: boolean;
  createdAt?: string;
  tips?: string[];
}

export interface WeeklyChallengeBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  unlocked: boolean;
  unlockedAt?: string;
  challengeType?: WeeklyChallengeType;
  levelRequired?: number;
}

export interface ChallengeUserLevel {
  level: number;
  title: string;
  icon: string;
  minPoints: number;
  maxPoints: number;
  perk: string;
  color: string;
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
  budgets: Budget[];
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
  weeklyChallenges?: WeeklyChallenge[];
  challengePoints?: number;
  autoRoundUpSetting?: AutoRoundUpSetting;
}

export interface AutoRoundUpSetting {
  enabled: boolean;
  targetGoalId?: string; // target Goal to deposit "fakka"
  multiplier: number; // e.g., 1, 5, or 10 TND
}
