import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { AppState, Category, Expense, Budget, RecurringExpense, Achievement, Goal, AppNotification, Income, Account } from '../types';
import { addDays, addWeeks, addMonths, addYears, parseISO, isBefore, isSameDay, subDays } from 'date-fns';
import { ACHIEVEMENTS } from '../constants/achievements';
import { auth, db, signInWithGoogle, logout as firebaseLogout, onAuthStateChanged } from '../firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  onSnapshot, 
  updateDoc, 
  deleteDoc, 
  addDoc,
  writeBatch,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { User } from 'firebase/auth';

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
  user: User | null;
  isAuthReady: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
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
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
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

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Sync with Firestore
  useEffect(() => {
    if (!user) return;

    const userDocRef = doc(db, 'users', user.uid);
    
    // Listen to user profile
    const unsubUser = onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setState(prev => ({
          ...prev,
          currency: data.currency || prev.currency,
          theme: data.theme || prev.theme,
          hasCompletedOnboarding: data.hasCompletedOnboarding ?? prev.hasCompletedOnboarding
        }));
      } else {
        // Initialize user profile in Firestore
        setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          currency: state.currency,
          theme: state.theme,
          hasCompletedOnboarding: state.hasCompletedOnboarding
        });
      }
    });

    // Subscriptions for collections
    const collections = [
      { name: 'expenses', setter: (data: any[]) => setState(prev => ({ ...prev, expenses: data })) },
      { name: 'income', setter: (data: any[]) => setState(prev => ({ ...prev, income: data })) },
      { name: 'categories', setter: (data: any[]) => setState(prev => ({ ...prev, categories: data.length > 0 ? data : DEFAULT_CATEGORIES })) },
      { name: 'accounts', setter: (data: any[]) => setState(prev => ({ ...prev, accounts: data.length > 0 ? data : DEFAULT_ACCOUNTS })) },
      { name: 'goals', setter: (data: any[]) => setState(prev => ({ ...prev, goals: data })) },
      { name: 'recurringExpenses', setter: (data: any[]) => setState(prev => ({ ...prev, recurringExpenses: data })) },
      { name: 'budgets', setter: (data: any[]) => setState(prev => ({ ...prev, budget: data[0] || null })) },
    ];

    const unsubs = collections.map(col => {
      const q = query(collection(db, 'users', user.uid, col.name));
      return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        col.setter(data);
      });
    });

    return () => {
      unsubUser();
      unsubs.forEach(unsub => unsub());
    };
  }, [user]);

  const login = async () => {
    try {
      const result = await signInWithGoogle();
      toast.success('تم تسجيل الدخول بنجاح');
      
      // Check if we should sync local data
      if (state.expenses.length > 0) {
        const confirmSync = window.confirm('هل تود مزامنة بياناتك المحلية مع السحاب؟');
        if (confirmSync) {
          await syncLocalDataToFirestore(result.user.uid);
        }
      }
    } catch (error) {
      console.error('Login failed', error);
      toast.error('فشل تسجيل الدخول');
    }
  };

  const logout = async () => {
    try {
      await firebaseLogout();
      toast.success('تم تسجيل الخروج');
      // Optionally reset state to initial or keep local for offline
    } catch (error) {
      toast.error('فشل تسجيل الخروج');
    }
  };

  const syncLocalDataToFirestore = async (uid: string) => {
    const batch = writeBatch(db);
    
    // Sync profile
    const userDocRef = doc(db, 'users', uid);
    batch.set(userDocRef, {
      uid,
      email: auth.currentUser?.email,
      currency: state.currency,
      theme: state.theme,
      hasCompletedOnboarding: state.hasCompletedOnboarding
    });

    // Helper to add to batch
    const addToBatch = (colName: string, items: any[]) => {
      items.forEach(item => {
        const ref = doc(collection(db, 'users', uid, colName), item.id);
        batch.set(ref, { ...item, uid });
      });
    };

    addToBatch('expenses', state.expenses);
    addToBatch('income', state.income);
    addToBatch('categories', state.categories);
    addToBatch('accounts', state.accounts);
    addToBatch('goals', state.goals);
    addToBatch('recurringExpenses', state.recurringExpenses);
    if (state.budget) {
      const budgetRef = doc(collection(db, 'users', uid, 'budgets'), 'current');
      batch.set(budgetRef, { ...state.budget, uid });
    }

    await batch.commit();
    toast.success('تمت المزامنة بنجاح');
  };

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

  const addAccount = async (account: Omit<Account, 'id'>) => {
    const newAccount: Account = {
      ...account,
      id: crypto.randomUUID(),
    };

    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'accounts', newAccount.id), { ...newAccount, uid: user.uid });
      } catch (error) {
        toast.error('فشل حفظ الحساب في السحاب');
      }
    } else {
      setState((prev) => ({ ...prev, accounts: [...(prev.accounts || []), newAccount] }));
    }
  };

  const updateAccount = async (id: string, updates: Partial<Account>) => {
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid, 'accounts', id), updates);
      } catch (error) {
        toast.error('فشل تحديث الحساب في السحاب');
      }
    } else {
      setState((prev) => ({
        ...prev,
        accounts: (prev.accounts || []).map((a) => (a.id === id ? { ...a, ...updates } : a)),
      }));
    }
  };

  const deleteAccount = async (id: string) => {
    if (user) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'accounts', id));
      } catch (error) {
        toast.error('فشل حذف الحساب من السحاب');
      }
    } else {
      setState((prev) => ({
        ...prev,
        accounts: (prev.accounts || []).filter((a) => a.id !== id),
      }));
    }
  };

  const addExpense = async (expense: Omit<Expense, 'id' | 'createdAt'>) => {
    const newExpense: Expense = {
      ...expense,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };

    if (user) {
      const batch = writeBatch(db);
      const expenseRef = doc(db, 'users', user.uid, 'expenses', newExpense.id);
      batch.set(expenseRef, { ...newExpense, uid: user.uid });

      // Update account balance
      if (newExpense.accountId) {
        const accRef = doc(db, 'users', user.uid, 'accounts', newExpense.accountId);
        const accDoc = await getDoc(accRef);
        if (accDoc.exists()) {
          batch.update(accRef, { balance: accDoc.data().balance - newExpense.amount });
        }
      }

      // Update linked goal progress
      if (newExpense.goalId) {
        const goalRef = doc(db, 'users', user.uid, 'goals', newExpense.goalId);
        const goalDoc = await getDoc(goalRef);
        if (goalDoc.exists()) {
          batch.update(goalRef, { currentAmount: goalDoc.data().currentAmount + newExpense.amount });
        }
      }

      try {
        await batch.commit();
      } catch (error) {
        toast.error('فشل حفظ المصروف في السحاب');
      }
    } else {
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
    }
  };

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    if (user) {
      try {
        const batch = writeBatch(db);
        const expenseRef = doc(db, 'users', user.uid, 'expenses', id);
        const oldDoc = await getDoc(expenseRef);
        if (!oldDoc.exists()) return;
        const oldExpense = oldDoc.data() as Expense;
        const newExpense = { ...oldExpense, ...updates };

        batch.update(expenseRef, updates);

        // Update account balance
        if (oldExpense.accountId !== newExpense.accountId) {
          if (oldExpense.accountId) {
            const oldAccRef = doc(db, 'users', user.uid, 'accounts', oldExpense.accountId);
            const oldAccDoc = await getDoc(oldAccRef);
            if (oldAccDoc.exists()) batch.update(oldAccRef, { balance: oldAccDoc.data().balance + oldExpense.amount });
          }
          if (newExpense.accountId) {
            const newAccRef = doc(db, 'users', user.uid, 'accounts', newExpense.accountId);
            const newAccDoc = await getDoc(newAccRef);
            if (newAccDoc.exists()) batch.update(newAccRef, { balance: newAccDoc.data().balance - newExpense.amount });
          }
        } else if (oldExpense.accountId && oldExpense.amount !== newExpense.amount) {
          const diff = newExpense.amount - oldExpense.amount;
          const accRef = doc(db, 'users', user.uid, 'accounts', oldExpense.accountId);
          const accDoc = await getDoc(accRef);
          if (accDoc.exists()) batch.update(accRef, { balance: accDoc.data().balance - diff });
        }

        // Update linked goal progress
        if (oldExpense.goalId !== newExpense.goalId) {
          if (oldExpense.goalId) {
            const oldGoalRef = doc(db, 'users', user.uid, 'goals', oldExpense.goalId);
            const oldGoalDoc = await getDoc(oldGoalRef);
            if (oldGoalDoc.exists()) batch.update(oldGoalRef, { currentAmount: oldGoalDoc.data().currentAmount - oldExpense.amount });
          }
          if (newExpense.goalId) {
            const newGoalRef = doc(db, 'users', user.uid, 'goals', newExpense.goalId);
            const newGoalDoc = await getDoc(newGoalRef);
            if (newGoalDoc.exists()) batch.update(newGoalRef, { currentAmount: newGoalDoc.data().currentAmount + newExpense.amount });
          }
        } else if (oldExpense.goalId && oldExpense.amount !== newExpense.amount) {
          const diff = newExpense.amount - oldExpense.amount;
          const goalRef = doc(db, 'users', user.uid, 'goals', oldExpense.goalId);
          const goalDoc = await getDoc(goalRef);
          if (goalDoc.exists()) batch.update(goalRef, { currentAmount: goalDoc.data().currentAmount + diff });
        }

        await batch.commit();
      } catch (error) {
        toast.error('فشل تحديث المصروف في السحاب');
      }
    } else {
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
    }
  };

  const deleteExpense = async (id: string) => {
    if (user) {
      try {
        const batch = writeBatch(db);
        const expenseRef = doc(db, 'users', user.uid, 'expenses', id);
        const docSnap = await getDoc(expenseRef);
        if (!docSnap.exists()) return;
        const expense = docSnap.data() as Expense;

        batch.delete(expenseRef);

        if (expense.accountId) {
          const accRef = doc(db, 'users', user.uid, 'accounts', expense.accountId);
          const accDoc = await getDoc(accRef);
          if (accDoc.exists()) batch.update(accRef, { balance: accDoc.data().balance + expense.amount });
        }

        if (expense.goalId) {
          const goalRef = doc(db, 'users', user.uid, 'goals', expense.goalId);
          const goalDoc = await getDoc(goalRef);
          if (goalDoc.exists()) batch.update(goalRef, { currentAmount: goalDoc.data().currentAmount - expense.amount });
        }

        await batch.commit();
      } catch (error) {
        toast.error('فشل حذف المصروف من السحاب');
      }
    } else {
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
    }
  };

  const addRecurringExpense = async (expense: Omit<RecurringExpense, 'id' | 'createdAt'>) => {
    const newExpense: RecurringExpense = {
      ...expense,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'recurringExpenses', newExpense.id), { ...newExpense, uid: user.uid });
      } catch (error) {
        toast.error('فشل حفظ المصروف الدوري في السحاب');
      }
    } else {
      setState((prev) => ({ ...prev, recurringExpenses: [...(prev.recurringExpenses || []), newExpense] }));
    }
  };

  const updateRecurringExpense = async (id: string, updates: Partial<RecurringExpense>) => {
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid, 'recurringExpenses', id), updates);
      } catch (error) {
        toast.error('فشل تحديث المصروف الدوري في السحاب');
      }
    } else {
      setState((prev) => ({
        ...prev,
        recurringExpenses: (prev.recurringExpenses || []).map((e) => (e.id === id ? { ...e, ...updates } : e)),
      }));
    }
  };

  const deleteRecurringExpense = async (id: string) => {
    if (user) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'recurringExpenses', id));
      } catch (error) {
        toast.error('فشل حذف المصروف الدوري من السحاب');
      }
    } else {
      setState((prev) => ({
        ...prev,
        recurringExpenses: (prev.recurringExpenses || []).filter((e) => e.id !== id),
      }));
    }
  };

  const addCategory = async (category: Omit<Category, 'id'>) => {
    const newCategory: Category = {
      ...category,
      id: crypto.randomUUID(),
    };
    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'categories', newCategory.id), { ...newCategory, uid: user.uid });
      } catch (error) {
        toast.error('فشل حفظ الفئة في السحاب');
      }
    } else {
      setState((prev) => {
        let updatedAchievements = prev.achievements || [];
        let newNotifications = prev.notifications || [];
        const result = handleAchievementProgress(updatedAchievements, newNotifications, 'category_master', 1);
        return { ...prev, categories: [...prev.categories, newCategory], achievements: result.achievements, notifications: result.notifications };
      });
    }
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid, 'categories', id), updates);
      } catch (error) {
        toast.error('فشل تحديث الفئة في السحاب');
      }
    } else {
      setState((prev) => ({
        ...prev,
        categories: prev.categories.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      }));
    }
  };

  const deleteCategory = async (id: string) => {
    if (user) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'categories', id));
      } catch (error) {
        toast.error('فشل حذف الفئة من السحاب');
      }
    } else {
      setState((prev) => ({
        ...prev,
        categories: prev.categories.filter((c) => c.id !== id),
        expenses: prev.expenses.map(e => e.categoryId === id ? { ...e, categoryId: '8' } : e),
        recurringExpenses: prev.recurringExpenses.map(re => re.categoryId === id ? { ...re, categoryId: '8' } : re)
      }));
    }
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

  const addGoal = async (goal: Omit<Goal, 'id' | 'createdAt'>) => {
    const newGoal: Goal = {
      ...goal,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'goals', newGoal.id), { ...newGoal, uid: user.uid });
      } catch (error) {
        toast.error('فشل حفظ الهدف في السحاب');
      }
    } else {
      setState((prev) => ({ ...prev, goals: [...(prev.goals || []), newGoal] }));
    }
  };

  const updateGoal = async (id: string, updates: Partial<Goal>) => {
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid, 'goals', id), updates);
      } catch (error) {
        toast.error('فشل تحديث الهدف في السحاب');
      }
    } else {
      setState((prev) => ({
        ...prev,
        goals: (prev.goals || []).map((g) => (g.id === id ? { ...g, ...updates } : g)),
      }));
    }
  };

  const deleteGoal = async (id: string) => {
    if (user) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'goals', id));
      } catch (error) {
        toast.error('فشل حذف الهدف من السحاب');
      }
    } else {
      setState((prev) => ({
        ...prev,
        goals: (prev.goals || []).filter((g) => g.id !== id),
      }));
    }
  };

  const addIncome = async (income: Omit<Income, 'id' | 'createdAt'>) => {
    const newIncome: Income = {
      ...income,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };

    if (user) {
      const batch = writeBatch(db);
      const incomeRef = doc(db, 'users', user.uid, 'income', newIncome.id);
      batch.set(incomeRef, { ...newIncome, uid: user.uid });

      if (newIncome.accountId) {
        const accRef = doc(db, 'users', user.uid, 'accounts', newIncome.accountId);
        const accDoc = await getDoc(accRef);
        if (accDoc.exists()) batch.update(accRef, { balance: accDoc.data().balance + newIncome.amount });
      }

      try {
        await batch.commit();
      } catch (error) {
        toast.error('فشل حفظ الدخل في السحاب');
      }
    } else {
      setState((prev) => {
        let newAccounts = [...(prev.accounts || [])];
        if (newIncome.accountId) {
          newAccounts = newAccounts.map(acc => 
            acc.id === newIncome.accountId ? { ...acc, balance: acc.balance + newIncome.amount } : acc
          );
        }
        return { ...prev, income: [...(prev.income || []), newIncome], accounts: newAccounts };
      });
    }
  };

  const updateIncome = async (id: string, updates: Partial<Income>) => {
    if (user) {
      try {
        const batch = writeBatch(db);
        const incomeRef = doc(db, 'users', user.uid, 'income', id);
        const oldDoc = await getDoc(incomeRef);
        if (!oldDoc.exists()) return;
        const oldIncome = oldDoc.data() as Income;
        const newIncome = { ...oldIncome, ...updates };

        batch.update(incomeRef, updates);

        if (oldIncome.accountId !== newIncome.accountId) {
          if (oldIncome.accountId) {
            const oldAccRef = doc(db, 'users', user.uid, 'accounts', oldIncome.accountId);
            const oldAccDoc = await getDoc(oldAccRef);
            if (oldAccDoc.exists()) batch.update(oldAccRef, { balance: oldAccDoc.data().balance - oldIncome.amount });
          }
          if (newIncome.accountId) {
            const newAccRef = doc(db, 'users', user.uid, 'accounts', newIncome.accountId);
            const newAccDoc = await getDoc(newAccRef);
            if (newAccDoc.exists()) batch.update(newAccRef, { balance: newAccDoc.data().balance + newIncome.amount });
          }
        } else if (oldIncome.accountId && oldIncome.amount !== newIncome.amount) {
          const diff = newIncome.amount - oldIncome.amount;
          const accRef = doc(db, 'users', user.uid, 'accounts', oldIncome.accountId);
          const accDoc = await getDoc(accRef);
          if (accDoc.exists()) batch.update(accRef, { balance: accDoc.data().balance + diff });
        }

        await batch.commit();
      } catch (error) {
        toast.error('فشل تحديث الدخل في السحاب');
      }
    } else {
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
    }
  };

  const deleteIncome = async (id: string) => {
    if (user) {
      try {
        const batch = writeBatch(db);
        const incomeRef = doc(db, 'users', user.uid, 'income', id);
        const docSnap = await getDoc(incomeRef);
        if (!docSnap.exists()) return;
        const income = docSnap.data() as Income;

        batch.delete(incomeRef);

        if (income.accountId) {
          const accRef = doc(db, 'users', user.uid, 'accounts', income.accountId);
          const accDoc = await getDoc(accRef);
          if (accDoc.exists()) batch.update(accRef, { balance: accDoc.data().balance - income.amount });
        }

        await batch.commit();
      } catch (error) {
        toast.error('فشل حذف الدخل من السحاب');
      }
    } else {
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
    }
  };

  const reorderCategories = (categories: Category[]) => {
    setState((prev) => ({ ...prev, categories }));
  };

  const setBudget = async (budget: Budget) => {
    if (user) {
      try {
        const budgetRef = doc(collection(db, 'users', user.uid, 'budgets'), 'current');
        await setDoc(budgetRef, { ...budget, uid: user.uid });
      } catch (error) {
        toast.error('فشل حفظ الميزانية في السحاب');
      }
    } else {
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
    }
  };

  const setTheme = async (theme: 'light' | 'dark') => {
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { theme });
      } catch (error) {
        console.error('Failed to update theme in Firestore');
      }
    } else {
      setState((prev) => ({ ...prev, theme }));
    }
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

  const completeOnboarding = async () => {
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { hasCompletedOnboarding: true });
      } catch (error) {
        console.error('Failed to update onboarding in Firestore');
      }
    } else {
      setState(prev => ({ ...prev, hasCompletedOnboarding: true }));
    }
  };

  const setCurrency = async (currency: string) => {
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { currency });
      } catch (error) {
        console.error('Failed to update currency in Firestore');
      }
    } else {
      setState(prev => ({ ...prev, currency }));
    }
  };

  const resetData = async () => {
    if (user) {
      const confirm = window.confirm('هل أنت متأكد من مسح جميع البيانات من السحاب؟');
      if (confirm) {
        const batch = writeBatch(db);
        const collections = ['expenses', 'income', 'categories', 'accounts', 'goals', 'recurringExpenses', 'budgets'];
        
        for (const colName of collections) {
          const q = query(collection(db, 'users', user.uid, colName));
          const snapshot = await getDocs(q);
          snapshot.docs.forEach(d => batch.delete(d.ref));
        }
        
        await batch.commit();
        toast.success('تم تصفير جميع البيانات من السحاب');
      }
    } else {
      setState(INITIAL_STATE);
      toast.success('تم تصفير جميع البيانات بنجاح');
    }
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
        user,
        isAuthReady,
        login,
        logout,
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
