import React, { createContext, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AppState, Category, Expense, Budget, RecurringExpense, Achievement, Goal, AppNotification, Income, Account } from '../types';
import { addDays, addWeeks, addMonths, addYears, parseISO, isBefore, isSameDay, subDays } from 'date-fns';
import { ACHIEVEMENTS } from '../constants/achievements';

const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'طعام', color: '#ef4444', icon: 'Utensils', subcategories: ['بقالة', 'مطاعم'], type: 'need' },
  { id: '2', name: 'قهوة', color: '#f97316', icon: 'Coffee', type: 'want' },
  { id: '3', name: 'نقل', color: '#3b82f6', icon: 'Car', type: 'need' },
  { id: '4', name: 'بيت', color: '#10b981', icon: 'Home', type: 'need' },
  { id: '5', name: 'فواتير', color: '#8b5cf6', icon: 'FileText', type: 'need' },
  { id: '6', name: 'ترفيه', color: '#ec4899', icon: 'Gamepad2', type: 'want' },
  { id: '7', name: 'صحة', color: '#14b8a6', icon: 'HeartPulse', type: 'need' },
  { id: '8', name: 'أخرى', color: '#64748b', icon: 'MoreHorizontal', type: 'want' },
];

const DEFAULT_ACCOUNTS: Account[] = [
  { id: 'cash', name: 'كاش', balance: 0, color: '#10b981', icon: 'Banknote' },
  { id: 'bank', name: 'بنك', balance: 0, color: '#3b82f6', icon: 'Landmark' },
];

const INITIAL_STATE: AppState = {
  expenses: [],
  recurringExpenses: [],
  categories: DEFAULT_CATEGORIES,
  accounts: DEFAULT_ACCOUNTS,
  budget: null,
  theme: 'light',
  currency: 'TND',
  achievements: [],
  goals: [],
  income: [],
  notifications: [],
  hasCompletedOnboarding: false,
};

interface AppContextProps extends AppState {
  isAddModalOpen: boolean;
  setIsAddModalOpen: (isOpen: boolean) => void;
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  updateExpense: (id: string, expense: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  addRecurringExpense: (expense: Omit<RecurringExpense, 'id' | 'createdAt'>) => void;
  updateRecurringExpense: (id: string, expense: Partial<RecurringExpense>) => void;
  deleteRecurringExpense: (id: string) => void;
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  reorderCategories: (categories: Category[]) => void;
  addAccount: (account: Omit<Account, 'id'>) => void;
  updateAccount: (id: string, account: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  transferAccount: (fromAccountId: string, toAccountId: string, amount: number) => void;
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => void;
  updateGoal: (id: string, goal: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  addIncome: (income: Omit<Income, 'id' | 'createdAt'>) => void;
  updateIncome: (id: string, income: Partial<Income>) => void;
  deleteIncome: (id: string) => void;
  setBudget: (budget: Budget) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  exportData: () => void;
  importData: (data: string) => void;
  updateAchievement: (id: string, progress: number) => void;
  addNotification: (message: string, type: 'budget' | 'unusual_expense') => void;
  removeNotification: (id: string) => void;
  completeOnboarding: () => void;
  setCurrency: (currency: string) => void;
  resetData: () => void;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

const getUpdatedAchievements = (achievements: Achievement[], id: string, progress: number): Achievement[] => {
  const existing = achievements.find(a => a.id === id);
  if (existing) {
    return achievements.map((a) =>
      a.id === id 
        ? { 
            ...a, 
            progress: Math.max(a.progress, Math.min(a.target, progress)), 
            earnedAt: (progress >= a.target && !a.earnedAt) ? new Date().toISOString() : a.earnedAt 
          } 
        : a
    );
  } else {
    const constant = ACHIEVEMENTS.find(a => a.id === id);
    if (!constant) return achievements;
    return [...achievements, { 
      ...constant, 
      progress: Math.min(constant.target, progress), 
      earnedAt: progress >= constant.target ? new Date().toISOString() : undefined 
    }];
  }
};

const handleAchievementProgress = (achievements: Achievement[], notifications: AppNotification[], id: string, progress: number) => {
  const oldAchievement = achievements.find(a => a.id === id);
  const updatedAchievements = getUpdatedAchievements(achievements, id, progress);
  const newAchievement = updatedAchievements.find(a => a.id === id);
  
  let newNotifications = [...notifications];
  if ((!oldAchievement || oldAchievement.progress < oldAchievement.target) && newAchievement && newAchievement.progress >= newAchievement.target) {
    newNotifications.push({
      id: crypto.randomUUID(),
      message: `🎉 تم تحقيق إنجاز: ${newAchievement.title}`,
      type: 'achievement',
      createdAt: new Date().toISOString()
    });
  }
  
  return { achievements: updatedAchievements, notifications: newNotifications };
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('masarifi_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...INITIAL_STATE, ...parsed, recurringExpenses: parsed.recurringExpenses || [] };
      } catch (e) {
        console.error('Failed to parse saved data', e);
      }
    }
    return INITIAL_STATE;
  });

  useEffect(() => {
    setState(prev => {
      const today = new Date();
      let hasUpdates = false;
      let newExpenses: Expense[] = [];
      let updatedRecurring = [...(prev.recurringExpenses || [])];

      updatedRecurring = updatedRecurring.map(recurring => {
        let nextDate = parseISO(recurring.nextDate);
        let currentRec = { ...recurring };

        let count = 0;
        while ((isBefore(nextDate, today) || isSameDay(nextDate, today)) && count < 90) {
          newExpenses.push({
            id: crypto.randomUUID(),
            amount: currentRec.amount,
            categoryId: currentRec.categoryId,
            date: currentRec.nextDate,
            note: currentRec.note,
            paymentMethod: currentRec.paymentMethod,
            createdAt: new Date().toISOString(),
          });

          if (currentRec.interval === 'daily') {
            nextDate = addDays(nextDate, 1);
          } else if (currentRec.interval === 'weekly') {
            nextDate = addWeeks(nextDate, 1);
          } else if (currentRec.interval === 'monthly') {
            nextDate = addMonths(nextDate, 1);
          } else if (currentRec.interval === 'yearly') {
            nextDate = addYears(nextDate, 1);
          }

          currentRec.nextDate = nextDate.toISOString().split('T')[0];
          hasUpdates = true;
          count++;
        }

        return currentRec;
      });

      let updatedAchievements = prev.achievements || [];
      let newNotifications = prev.notifications || [];
      const noSpendDay = updatedAchievements.find(a => a.id === 'no_spend_day');
      
      if (!noSpendDay || noSpendDay.progress < noSpendDay.target) {
        if (prev.expenses.length > 0) {
          const firstExpenseDate = new Date(Math.min(...prev.expenses.map(e => new Date(e.date).getTime())));
          const yesterday = addDays(today, -1);
          
          if (isBefore(firstExpenseDate, yesterday) || isSameDay(firstExpenseDate, yesterday)) {
            const yesterdayStr = yesterday.toISOString().split('T')[0];
            const hasExpenseYesterday = prev.expenses.some(e => e.date.startsWith(yesterdayStr));
            
            if (!hasExpenseYesterday) {
              const result = handleAchievementProgress(updatedAchievements, newNotifications, 'no_spend_day', 1);
              updatedAchievements = result.achievements;
              newNotifications = result.notifications;
              hasUpdates = true;
            }
          }
        }
      }

      // Recurring Expenses Notifications
      const sendPushNotification = (title: string, body: string) => {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(title, { body, icon: '/icon-192.png' });
        }
      };

      updatedRecurring.forEach(recurring => {
        const nextDate = parseISO(recurring.nextDate);
        const today = new Date();
        const threeDaysFromNow = addDays(today, 3);
        
        // Check if due within 3 days and not already past due (past due is handled by the while loop above)
        if (isBefore(nextDate, threeDaysFromNow) && !isBefore(nextDate, today)) {
          const categoryName = prev.categories.find(c => c.id === recurring.categoryId)?.name || 'مصروف';
          const msg = `تذكير: موعد ${categoryName} (${recurring.note || ''}) يقترب في ${recurring.nextDate}`;
          
          // Avoid duplicate notifications for the same day
          const alreadyNotified = prev.notifications?.some(n => n.message === msg && n.createdAt.startsWith(today.toISOString().split('T')[0]));
          
          if (!alreadyNotified) {
            newNotifications.push({
              id: crypto.randomUUID(),
              message: msg,
              type: 'budget',
              createdAt: today.toISOString()
            });
            sendPushNotification("تذكير بمصروف دوري", msg);
            hasUpdates = true;
          }
        }
      });

      if (hasUpdates) {
        return {
          ...prev,
          expenses: [...newExpenses, ...prev.expenses],
          recurringExpenses: updatedRecurring,
          achievements: updatedAchievements,
          notifications: newNotifications
        };
      }
      return prev;
    });
  }, []);

  useEffect(() => {
    localStorage.setItem('masarifi_data', JSON.stringify(state));
    if (state.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state]);

  const addNotification = (message: string, type: 'budget' | 'unusual_expense') => {
    const newNotification: AppNotification = {
      id: crypto.randomUUID(),
      message,
      type,
      createdAt: new Date().toISOString(),
    };
    setState(prev => ({ ...prev, notifications: [...(prev.notifications || []), newNotification] }));
  };

  const removeNotification = (id: string) => {
    setState(prev => ({ ...prev, notifications: (prev.notifications || []).filter(n => n.id !== id) }));
  };

  const addAccount = (account: Omit<Account, 'id'>) => {
    const newAccount: Account = {
      ...account,
      id: crypto.randomUUID(),
    };
    setState((prev) => ({ ...prev, accounts: [...(prev.accounts || []), newAccount] }));
  };

  const updateAccount = (id: string, updates: Partial<Account>) => {
    setState((prev) => ({
      ...prev,
      accounts: (prev.accounts || []).map((a) => (a.id === id ? { ...a, ...updates } : a)),
    }));
  };

  const deleteAccount = (id: string) => {
    setState((prev) => ({
      ...prev,
      accounts: (prev.accounts || []).filter((a) => a.id !== id),
    }));
  };

  const addExpense = (expense: Omit<Expense, 'id' | 'createdAt'>) => {
    const newExpense: Expense = {
      ...expense,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setState((prev) => {
      let newState = { ...prev, expenses: [newExpense, ...prev.expenses] };
      let newNotifications = [...(prev.notifications || [])];

      // Update account balance
      if (newExpense.accountId) {
        newState.accounts = (newState.accounts || []).map(acc => 
          acc.id === newExpense.accountId ? { ...acc, balance: acc.balance - newExpense.amount } : acc
        );
      }

      // Update linked goal progress
      if (newExpense.goalId) {
        newState.goals = (newState.goals || []).map(goal => 
          goal.id === newExpense.goalId ? { ...goal, currentAmount: goal.currentAmount + newExpense.amount } : goal
        );
      }

      // Logic for budget alerts
      const currentMonth = new Date().toISOString().slice(0, 7);
      const monthlyExpenses = newState.expenses.filter(e => e.date.startsWith(currentMonth));
      const totalSpent = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
      const budget = newState.budget?.amount || 0;
      
      const sendPushNotification = (title: string, body: string) => {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(title, { body, icon: '/icon-192.png' });
        }
      };

      if (budget > 0) {
        if (totalSpent > budget && totalSpent - newExpense.amount <= budget) {
          const msg = "تنبيه: لقد تجاوزت ميزانيتك الشهرية!";
          newNotifications.push({ id: crypto.randomUUID(), message: msg, type: 'budget', createdAt: new Date().toISOString() });
          sendPushNotification("تنبيه الميزانية", msg);
        } else if (totalSpent > budget * 0.8 && totalSpent - newExpense.amount <= budget * 0.8) {
          const msg = "تنبيه: لقد قاربت على تجاوز ميزانيتك الشهرية!";
          newNotifications.push({ id: crypto.randomUUID(), message: msg, type: 'budget', createdAt: new Date().toISOString() });
          sendPushNotification("تنبيه الميزانية", msg);
        }
      }

      // Category budget alerts
      if (newState.budget?.categoryBudgets?.[newExpense.categoryId]) {
        const catBudget = newState.budget.categoryBudgets[newExpense.categoryId];
        const catSpent = monthlyExpenses.filter(e => e.categoryId === newExpense.categoryId).reduce((sum, e) => sum + e.amount, 0);
        const categoryName = newState.categories.find(c => c.id === newExpense.categoryId)?.name || 'هذه الفئة';

        if (catSpent > catBudget && catSpent - newExpense.amount <= catBudget) {
          const msg = `تنبيه: لقد تجاوزت ميزانية فئة ${categoryName}!`;
          newNotifications.push({ id: crypto.randomUUID(), message: msg, type: 'budget', createdAt: new Date().toISOString() });
          sendPushNotification("تنبيه الميزانية", msg);
        } else if (catSpent > catBudget * 0.8 && catSpent - newExpense.amount <= catBudget * 0.8) {
          const msg = `تنبيه: لقد قاربت على تجاوز ميزانية فئة ${categoryName}!`;
          newNotifications.push({ id: crypto.randomUUID(), message: msg, type: 'budget', createdAt: new Date().toISOString() });
          sendPushNotification("تنبيه الميزانية", msg);
        }
      }

      // Logic for unusual expense
      const avg = prev.expenses.reduce((sum, e) => sum + e.amount, 0) / (prev.expenses.length || 1);
      if (newExpense.amount > avg * 3) {
        newNotifications.push({ id: crypto.randomUUID(), message: "تنبيه: مصروف غير معتاد!", type: 'unusual_expense', createdAt: new Date().toISOString() });
      }

      // تحديث الإنجازات
      let updatedAchievements = newState.achievements || [];
      
      const firstExpenseResult = handleAchievementProgress(updatedAchievements, newNotifications, 'first_expense', 1);
      updatedAchievements = firstExpenseResult.achievements;
      newNotifications = firstExpenseResult.notifications;
      
      const activeLogger = updatedAchievements.find(a => a.id === 'active_logger');
      const activeLoggerResult = handleAchievementProgress(updatedAchievements, newNotifications, 'active_logger', (activeLogger?.progress || 0) + 1);
      updatedAchievements = activeLoggerResult.achievements;
      newNotifications = activeLoggerResult.notifications;

      // 7-day streak
      const dates = newState.expenses.map(e => e.date.split('T')[0]);
      const uniqueDates = Array.from(new Set(dates)).sort((a: string, b: string) => new Date(b).getTime() - new Date(a).getTime());
      let streak = 0;
      let lastDate = new Date();
      
      for (const date of uniqueDates) {
        const d = parseISO(date as string);
        if (streak === 0 && isSameDay(d, lastDate)) {
          streak++;
        } else if (streak > 0 && isSameDay(d, subDays(lastDate, 1))) {
          streak++;
          lastDate = d;
        } else {
          break;
        }
      }
      const streakResult = handleAchievementProgress(updatedAchievements, newNotifications, '7_day_streak', streak);
      updatedAchievements = streakResult.achievements;
      newNotifications = streakResult.notifications;
      
      return { ...newState, achievements: updatedAchievements, notifications: newNotifications };
    });
  };

  const updateExpense = (id: string, updates: Partial<Expense>) => {
    setState((prev) => {
      const oldExpense = prev.expenses.find(e => e.id === id);
      if (!oldExpense) return prev;
      
      const newExpense = { ...oldExpense, ...updates };
      let newAccounts = [...(prev.accounts || [])];
      
      if (oldExpense.accountId !== newExpense.accountId) {
        if (oldExpense.accountId) {
          newAccounts = newAccounts.map(acc => acc.id === oldExpense.accountId ? { ...acc, balance: acc.balance + oldExpense.amount } : acc);
        }
        if (newExpense.accountId) {
          newAccounts = newAccounts.map(acc => acc.id === newExpense.accountId ? { ...acc, balance: acc.balance - newExpense.amount } : acc);
        }
      } else if (oldExpense.accountId && oldExpense.amount !== newExpense.amount) {
        const diff = newExpense.amount - oldExpense.amount;
        newAccounts = newAccounts.map(acc => acc.id === oldExpense.accountId ? { ...acc, balance: acc.balance - diff } : acc);
      }

      let newGoals = [...(prev.goals || [])];
      if (oldExpense.goalId !== newExpense.goalId) {
        if (oldExpense.goalId) {
          newGoals = newGoals.map(goal => goal.id === oldExpense.goalId ? { ...goal, currentAmount: goal.currentAmount - oldExpense.amount } : goal);
        }
        if (newExpense.goalId) {
          newGoals = newGoals.map(goal => goal.id === newExpense.goalId ? { ...goal, currentAmount: goal.currentAmount + newExpense.amount } : goal);
        }
      } else if (oldExpense.goalId && oldExpense.amount !== newExpense.amount) {
        const diff = newExpense.amount - oldExpense.amount;
        newGoals = newGoals.map(goal => goal.id === oldExpense.goalId ? { ...goal, currentAmount: goal.currentAmount + diff } : goal);
      }

      return {
        ...prev,
        expenses: prev.expenses.map((e) => (e.id === id ? newExpense : e)),
        accounts: newAccounts,
        goals: newGoals
      };
    });
  };

  const deleteExpense = (id: string) => {
    setState((prev) => {
      const expense = prev.expenses.find(e => e.id === id);
      if (!expense) return prev;
      
      let newAccounts = [...(prev.accounts || [])];
      if (expense.accountId) {
        newAccounts = newAccounts.map(acc => acc.id === expense.accountId ? { ...acc, balance: acc.balance + expense.amount } : acc);
      }

      let newGoals = [...(prev.goals || [])];
      if (expense.goalId) {
        newGoals = newGoals.map(goal => goal.id === expense.goalId ? { ...goal, currentAmount: goal.currentAmount - expense.amount } : goal);
      }

      return {
        ...prev,
        expenses: prev.expenses.filter((e) => e.id !== id),
        accounts: newAccounts,
        goals: newGoals
      };
    });
  };

  const addRecurringExpense = (expense: Omit<RecurringExpense, 'id' | 'createdAt'>) => {
    const newExpense: RecurringExpense = {
      ...expense,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setState((prev) => ({ ...prev, recurringExpenses: [...(prev.recurringExpenses || []), newExpense] }));
  };

  const updateRecurringExpense = (id: string, updates: Partial<RecurringExpense>) => {
    setState((prev) => ({
      ...prev,
      recurringExpenses: (prev.recurringExpenses || []).map((e) => (e.id === id ? { ...e, ...updates } : e)),
    }));
  };

  const deleteRecurringExpense = (id: string) => {
    setState((prev) => ({
      ...prev,
      recurringExpenses: (prev.recurringExpenses || []).filter((e) => e.id !== id),
    }));
  };

  const addCategory = (category: Omit<Category, 'id'>) => {
    const newCategory: Category = {
      ...category,
      id: crypto.randomUUID(),
    };
    setState((prev) => {
      let updatedAchievements = prev.achievements || [];
      let newNotifications = prev.notifications || [];
      const result = handleAchievementProgress(updatedAchievements, newNotifications, 'category_master', 1);
      return { ...prev, categories: [...prev.categories, newCategory], achievements: result.achievements, notifications: result.notifications };
    });
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    setState((prev) => ({
      ...prev,
      categories: prev.categories.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }));
  };

  const deleteCategory = (id: string) => {
    setState((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c.id !== id),
      expenses: prev.expenses.map(e => e.categoryId === id ? { ...e, categoryId: '8' } : e),
      recurringExpenses: prev.recurringExpenses.map(re => re.categoryId === id ? { ...re, categoryId: '8' } : re)
    }));
  };

  const transferAccount = (fromAccountId: string, toAccountId: string, amount: number) => {
    setState((prev) => {
      let newAccounts = [...(prev.accounts || [])];
      const fromAcc = newAccounts.find(a => a.id === fromAccountId);
      const toAcc = newAccounts.find(a => a.id === toAccountId);
      
      if (!fromAcc || !toAcc || fromAcc.balance < amount) return prev;

      const transferId = crypto.randomUUID();
      const date = new Date().toISOString().split('T')[0];

      const expenseEntry: Expense = {
        id: crypto.randomUUID(),
        amount,
        categoryId: '8', // Other
        date,
        note: `تحويل إلى ${toAcc.name}`,
        paymentMethod: 'cash',
        accountId: fromAccountId,
        createdAt: new Date().toISOString()
      };

      const incomeEntry: Income = {
        id: crypto.randomUUID(),
        source: `تحويل من ${fromAcc.name}`,
        amount,
        date,
        accountId: toAccountId,
        createdAt: new Date().toISOString()
      };

      newAccounts = newAccounts.map(acc => {
        if (acc.id === fromAccountId) return { ...acc, balance: acc.balance - amount };
        if (acc.id === toAccountId) return { ...acc, balance: acc.balance + amount };
        return acc;
      });

      return { 
        ...prev, 
        accounts: newAccounts,
        expenses: [expenseEntry, ...prev.expenses],
        income: [incomeEntry, ...prev.income]
      };
    });
  };

  const addGoal = (goal: Omit<Goal, 'id' | 'createdAt'>) => {
    const newGoal: Goal = {
      ...goal,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setState((prev) => ({ ...prev, goals: [...(prev.goals || []), newGoal] }));
  };

  const updateGoal = (id: string, updates: Partial<Goal>) => {
    setState((prev) => ({
      ...prev,
      goals: (prev.goals || []).map((g) => (g.id === id ? { ...g, ...updates } : g)),
    }));
  };

  const deleteGoal = (id: string) => {
    setState((prev) => ({
      ...prev,
      goals: (prev.goals || []).filter((g) => g.id !== id),
    }));
  };

  const addIncome = (income: Omit<Income, 'id' | 'createdAt'>) => {
    const newIncome: Income = {
      ...income,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setState((prev) => {
      let newAccounts = [...(prev.accounts || [])];
      if (newIncome.accountId) {
        newAccounts = newAccounts.map(acc => 
          acc.id === newIncome.accountId ? { ...acc, balance: acc.balance + newIncome.amount } : acc
        );
      }
      return { ...prev, income: [...(prev.income || []), newIncome], accounts: newAccounts };
    });
  };

  const updateIncome = (id: string, updates: Partial<Income>) => {
    setState((prev) => {
      const oldIncome = (prev.income || []).find(i => i.id === id);
      if (!oldIncome) return prev;
      
      const newIncome = { ...oldIncome, ...updates };
      let newAccounts = [...(prev.accounts || [])];
      
      if (oldIncome.accountId !== newIncome.accountId) {
        if (oldIncome.accountId) {
          newAccounts = newAccounts.map(acc => acc.id === oldIncome.accountId ? { ...acc, balance: acc.balance - oldIncome.amount } : acc);
        }
        if (newIncome.accountId) {
          newAccounts = newAccounts.map(acc => acc.id === newIncome.accountId ? { ...acc, balance: acc.balance + newIncome.amount } : acc);
        }
      } else if (oldIncome.accountId && oldIncome.amount !== newIncome.amount) {
        const diff = newIncome.amount - oldIncome.amount;
        newAccounts = newAccounts.map(acc => acc.id === oldIncome.accountId ? { ...acc, balance: acc.balance + diff } : acc);
      }

      return {
        ...prev,
        income: (prev.income || []).map((i) => (i.id === id ? newIncome : i)),
        accounts: newAccounts
      };
    });
  };

  const deleteIncome = (id: string) => {
    setState((prev) => {
      const income = (prev.income || []).find(i => i.id === id);
      if (!income) return prev;
      
      let newAccounts = [...(prev.accounts || [])];
      if (income.accountId) {
        newAccounts = newAccounts.map(acc => acc.id === income.accountId ? { ...acc, balance: acc.balance - income.amount } : acc);
      }

      return {
        ...prev,
        income: (prev.income || []).filter((i) => i.id !== id),
        accounts: newAccounts
      };
    });
  };

  const reorderCategories = (categories: Category[]) => {
    setState((prev) => ({ ...prev, categories }));
  };

  const setBudget = (budget: Budget) => {
    setState((prev) => {
      let updatedAchievements = prev.achievements || [];
      let newNotifications = prev.notifications || [];
      
      const result = handleAchievementProgress(updatedAchievements, newNotifications, 'budget_master', 1);
      updatedAchievements = result.achievements;
      newNotifications = result.notifications;

      const monthlyExpenses = prev.expenses.filter(e => e.date.startsWith(budget.month));
      const totalSpent = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);

      if (totalSpent <= budget.amount) {
        const budgetResult = handleAchievementProgress(updatedAchievements, newNotifications, 'first_month_under_budget', 1);
        updatedAchievements = budgetResult.achievements;
        newNotifications = budgetResult.notifications;
      }

      if (budget.categoryBudgets) {
        Object.entries(budget.categoryBudgets).forEach(([catId, catBudget]) => {
          const catSpent = monthlyExpenses.filter(e => e.categoryId === catId).reduce((sum, e) => sum + e.amount, 0);
          if (catSpent <= catBudget) {
            const catResult = handleAchievementProgress(updatedAchievements, newNotifications, 'category_spending_master', 1);
            updatedAchievements = catResult.achievements;
            newNotifications = catResult.notifications;
          }
        });
      }

      return { ...prev, budget, achievements: updatedAchievements, notifications: newNotifications };
    });
  };

  const setTheme = (theme: 'light' | 'dark') => {
    setState((prev) => ({ ...prev, theme }));
  };

  const exportData = () => {
    const dataStr = JSON.stringify(state);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `masarifi_backup_${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importData = (dataStr: string) => {
    try {
      const parsed = JSON.parse(dataStr);
      if (parsed.expenses && parsed.categories) {
        setState({ ...INITIAL_STATE, ...parsed });
        toast.success('تم استعادة البيانات بنجاح');
      } else {
        toast.error('ملف النسخة الاحتياطية غير صالح');
      }
    } catch (e) {
      toast.error('حدث خطأ أثناء قراءة الملف');
    }
  };

  const completeOnboarding = () => {
    setState(prev => ({ ...prev, hasCompletedOnboarding: true }));
  };

  const setCurrency = (currency: string) => {
    setState(prev => ({ ...prev, currency }));
  };

  const resetData = () => {
    setState(INITIAL_STATE);
    toast.success('تم تصفير جميع البيانات بنجاح');
  };

  const updateAchievement = (id: string, progress: number) => {
    setState((prev) => {
      const achievements = prev.achievements || [];
      const existing = achievements.find(a => a.id === id);
      
      if (existing) {
        return {
          ...prev,
          achievements: achievements.map((a) =>
            a.id === id 
              ? { 
                  ...a, 
                  progress: Math.max(a.progress, Math.min(a.target, progress)), 
                  earnedAt: (progress >= a.target && !a.earnedAt) ? new Date().toISOString() : a.earnedAt 
                } 
              : a
          ),
        };
      } else {
        const constant = ACHIEVEMENTS.find(a => a.id === id);
        if (!constant) return prev;
        return {
          ...prev,
          achievements: [...achievements, { 
            ...constant, 
            progress: Math.min(constant.target, progress), 
            earnedAt: progress >= constant.target ? new Date().toISOString() : undefined 
          }]
        };
      }
    });
  };

  return (
    <AppContext.Provider
      value={{
        ...state,
        isAddModalOpen,
        setIsAddModalOpen,
        addExpense,
        updateExpense,
        deleteExpense,
        addRecurringExpense,
        updateRecurringExpense,
        deleteRecurringExpense,
        addCategory,
        updateCategory,
        deleteCategory,
        reorderCategories,
        addAccount,
        updateAccount,
        deleteAccount,
        transferAccount,
        addGoal,
        updateGoal,
        deleteGoal,
        addIncome,
        updateIncome,
        deleteIncome,
        setBudget,
        setTheme,
        exportData,
        importData,
        updateAchievement,
        addNotification,
        removeNotification,
        completeOnboarding,
        setCurrency,
        resetData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
