import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { AppState, Category, Expense, Budget, RecurringExpense, Achievement, Goal, AppNotification, Income, Account } from '../types';
import { evaluateAchievements } from '../utils/achievements';
import { getBudgetMonth, safeStorage } from '../utils';
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
  orderBy,
  disableNetwork,
  enableNetwork
} from 'firebase/firestore';
import { User } from 'firebase/auth';

const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'قضية السوق والقفة', color: '#ef4444', icon: 'UtensilsCrossed', type: 'need', subcategories: ['قضية السوق (خضار وغلال)', 'العطار وعزيزة والمغازات', 'خبز وحليب الصباح', 'لحوم وأسماك'] },
  { id: '2', name: 'لوازم ومصروف الرضيع', color: '#06b6d4', icon: 'Baby', type: 'need', subcategories: ['حفاضات وحليب الرضع', 'روضة ومحضنة', 'ألعاب ومستلزمات البيبي', 'ملابس الرضيع'] },
  { id: '3', name: 'البيت والفواتير', color: '#10b981', icon: 'House', type: 'need', subcategories: ['إيجار المنزل', 'فاتورة الستاغ (STEG)', 'فاتورة الصوناد (SONEDE)', 'إنترنت واشتراك هاتف'] },
  { id: '4', name: 'نقل وتنقل', color: '#3b82f6', icon: 'BusFront', type: 'need', subcategories: ['وقود وبنزين السيارة', 'تاكسي ولوواج ونقل عمومي', 'تصليح وصيانة السيارة', 'تأمين ومعلوم جولان'] },
  { id: '5', name: 'صحة وطبيب الأطفال', color: '#ec4899', icon: 'HeartPulse', type: 'need', subcategories: ['فيزيتا طبيب الأطفال', 'تلاقيح وأدوية الصيدلية', 'تحاليل وصور طبية', 'كشف وعلاج العائلة'] },
  { id: '6', name: 'ترفيه ومقهى ومواسم', color: '#f59e0b', icon: 'Coffee', type: 'want', subcategories: ['مقهى وشاي', 'خرجة عائلية ومنزه', 'أعياد ومناسبات', 'أخرى وطارئة'] },
];

const DEFAULT_ACCOUNTS: Account[] = [
  { id: 'cash', name: 'كاش', balance: 0, color: '#10b981', icon: 'Banknote' },
  { id: 'bank', name: 'بنك', balance: 0, color: '#3b82f6', icon: 'Building2' },
];

const INITIAL_STATE: AppState = {
  expenses: [],
  recurringExpenses: [],
  categories: DEFAULT_CATEGORIES,
  accounts: DEFAULT_ACCOUNTS,
  budget: null,
  dailyBudget: 25, // default daily budget in Dinars is around 25 TND for a Tunisian family
  rollingBudgetEnabled: true,
  theme: 'light',
  currency: 'TND',
  achievements: [],
  goals: [],
  income: [],
  notifications: [],
  hasCompletedOnboarding: false,
  userName: '',
  firstDayOfMonth: 1,
  bestStreak: 0,
  offlineMode: false,
  aiInsights: {
    advice: [
      {
        title: 'استراتيجية شراء مستلزمات الرضيع',
        advice: 'شراء الحفاضات (الكوش) وحليب الأطفال بالعلب الكبيرة ومن مغازات الجملة يوفر ما بين 15% إلى 20% مقارنة بالصيدليات أو محلات العطارة الصغيرة.',
        actionItem: 'قم بجدولة كميات شهرية واشترِ من فضاءات البيع بالجملة الكبرى.',
        priority: 'high'
      },
      {
        title: 'ترشيد استهلاك الكهرباء (STEG)',
        advice: 'فواتير الشركة التونسية للكهرباء والغاز ترتفع بسرعة عند تجاوز الشريحة الاقتصادية. افصل الأجهزة ومكيفات الهواء في الغرف غير المستخدمة لتجنب فاتورة الستاغ التقديرية المرتفعة.',
        actionItem: 'تثبيت استهلاك الطاقة واحرص على تسجيل قراءة العداد بانتظام.',
        priority: 'medium'
      },
      {
        title: 'صندوق طوارئ لرعاية الرضيع والصحة',
        advice: 'بوجود رضيع صغير، تعتبر مصاريف طبيب الأطفال والأدوية والصيدلية أساسية ومفاجئة. ننصح بتخصيص 10% إلى 15% من الدخل كصندوق طوارئ صحي غير قابل للمس.',
        actionItem: 'افتح حساب توفير فرعي باسم "الرضيع والصحة" وضع فيه مبلغاً ثابتاً شهرياً.',
        priority: 'high'
      },
      {
        title: 'التخطيط لقفة العائلة الأسبوعية',
        advice: 'التسوق من "سوق السبت والأحد" للخضار والغلال واللحوم بدلاً من المغازات الكبرى يوفر مبالغ قيمة جداً في تونس وينشط الاقتصاد المحلي.',
        actionItem: 'حدد يوماً أسبوعياً للتسوق من السوق الأسبوعي الشعبي بقرية قريبة أو حيكم.',
        priority: 'medium'
      }
    ],
    forecast: [
      {
        month: 'المستقبل القريب',
        predictedBalance: 120,
        confidence: 85,
        reasoning: 'بالالتزام بحدود الإنفاق الموصى بها لمصاريف الرضيع والقفة، ستتمكن العائلة التونسية من تحقيق توازن مالي وادخار إيجابي شهرياً.'
      }
    ],
    lastUpdated: new Date().toISOString()
  }
};

interface AppContextProps extends AppState {
  user: User | null;
  isAuthReady: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  isAddModalOpen: boolean;
  setIsAddModalOpen: (isOpen: boolean) => void;
  editingExpense: Expense | null;
  setEditingExpense: (expense: Expense | null) => void;
  initialGoalId: string | null;
  setInitialGoalId: (id: string | null) => void;
  toggleOfflineMode: (enabled: boolean) => void;
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
  transferAccount: (fromAccountId: string, toAccountId: string, amount: number, date?: string, note?: string) => void;
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => void;
  updateGoal: (id: string, goal: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  addIncome: (income: Omit<Income, 'id' | 'createdAt'>) => void;
  updateIncome: (id: string, income: Partial<Income>) => void;
  deleteIncome: (id: string) => void;
  setBudget: (budget: Budget) => void;
  setDailyBudget: (amount: number) => void;
  setRollingBudgetEnabled: (enabled: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  repeatExpense: (id: string) => Promise<void>;
  exportData: (format?: 'json' | 'csv') => void;
  importData: (data: string) => void;
  updateAchievement: (id: string, progress: number) => void;
  addNotification: (message: string, type: 'budget' | 'unusual_expense') => void;
  removeNotification: (id: string) => void;
  completeOnboarding: () => void;
  setCurrency: (currency: string) => void;
  resetData: () => void;
  setUserName: (name: string) => void;
  setFirstDayOfMonth: (day: number) => void;
  updateAIInsights: (insights: { advice: any[], forecast: any[] }) => void;
  applyTunisianFamilyTemplate: () => Promise<void>;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

const showNotification = (title: string, options?: NotificationOptions) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  
  try {
    new Notification(title, options);
  } catch (e) {
    // Fallback for browsers that don't allow the Notification constructor (e.g. Chrome on Android)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(title, options);
      }).catch(err => {
        console.warn('ServiceWorker showNotification failed', err);
      });
    } else {
      console.warn('Notification constructor failed and no ServiceWorker available', e);
    }
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [initialGoalId, setInitialGoalId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [state, setState] = useState<AppState>(() => {
    const saved = safeStorage.getItem('masarifi_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const expenses = (parsed.expenses || []).map((e: any) => ({ ...e, parsedDate: parseISO(e.date) }));
        const income = (parsed.income || []).map((i: any) => ({ ...i, parsedDate: parseISO(i.date) }));
        return { ...INITIAL_STATE, ...parsed, expenses, income, recurringExpenses: parsed.recurringExpenses || [] };
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
          hasCompletedOnboarding: data.hasCompletedOnboarding ?? prev.hasCompletedOnboarding,
          userName: data.userName || prev.userName,
          firstDayOfMonth: data.firstDayOfMonth || prev.firstDayOfMonth,
          dailyBudget: data.dailyBudget || prev.dailyBudget,
          rollingBudgetEnabled: data.rollingBudgetEnabled ?? prev.rollingBudgetEnabled,
          bestStreak: data.bestStreak || prev.bestStreak
        }));
      } else {
        // Initialize user profile in Firestore
        setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          currency: state.currency,
          theme: state.theme,
          hasCompletedOnboarding: state.hasCompletedOnboarding,
          userName: state.userName || '',
          firstDayOfMonth: state.firstDayOfMonth || 1,
          dailyBudget: state.dailyBudget || 14,
          rollingBudgetEnabled: state.rollingBudgetEnabled ?? true,
          bestStreak: state.bestStreak || 0
        });
      }
    });

    // Subscriptions for collections
    const collections = [
      { name: 'expenses', setter: (data: any[]) => setState(prev => ({ ...prev, expenses: data.map(e => ({ ...e, parsedDate: parseISO(e.date) })) })) },
      { name: 'income', setter: (data: any[]) => setState(prev => ({ ...prev, income: data.map(i => ({ ...i, parsedDate: parseISO(i.date) })) })) },
      { name: 'categories', setter: (data: any[]) => setState(prev => ({ ...prev, categories: data.length > 0 ? data.sort((a, b) => (a.order || 0) - (b.order || 0)) : DEFAULT_CATEGORIES })) },
      { name: 'accounts', setter: (data: any[]) => setState(prev => ({ ...prev, accounts: data.length > 0 ? data : DEFAULT_ACCOUNTS })) },
      { name: 'goals', setter: (data: any[]) => setState(prev => ({ ...prev, goals: data })) },
      { name: 'recurringExpenses', setter: (data: any[]) => setState(prev => ({ ...prev, recurringExpenses: data })) },
      { name: 'budgets', setter: (data: any[]) => setState(prev => ({ ...prev, budget: data[0] || null })) },
      { name: 'achievements', setter: (data: any[]) => setState(prev => ({ ...prev, achievements: data })) },
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

  // Calculate streaks
  useEffect(() => {
    if (state.expenses.length === 0) return;

    const sortedExpenses = [...state.expenses].sort((a, b) => b.date.localeCompare(a.date));
    const today = new Date().toISOString().split('T')[0];
    const yesterday = subDays(new Date(), 1).toISOString().split('T')[0];

    let currentStreak = 0;
    let tempDate = today;
    
    // Check if today has expenses
    const hasToday = state.expenses.some(e => e.date === today);
    if (hasToday) {
      // If we spent today, streak is 0 unless we want to track "spending streaks" (we don't)
      // The user wants "No-Spend Day System"
    }

    // No-spend streak logic
    let noSpendStreak = 0;
    let checkDate = subDays(new Date(), hasToday ? 1 : 0);
    
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      const hasExpenses = state.expenses.some(e => e.date === dateStr);
      
      if (!hasExpenses) {
        noSpendStreak++;
        checkDate = subDays(checkDate, 1);
      } else {
        break;
      }
      
      // Safety break
      if (noSpendStreak > 365) break;
    }

    if (noSpendStreak > state.bestStreak) {
      if (user) {
        updateDoc(doc(db, 'users', user.uid), { bestStreak: noSpendStreak }).catch(console.error);
      } else {
        setState(prev => ({ ...prev, bestStreak: noSpendStreak }));
      }
    }
  }, [state.expenses, user]);

  // Evaluate achievements automatically
  useEffect(() => {
    if (!isAuthReady) return;
    
    setState(prev => {
      const newAchievements = evaluateAchievements(prev);
      
      // Check if any achievement was newly earned
      const newlyEarned = newAchievements.filter(na => {
        const old = prev.achievements?.find(oa => oa.id === na.id);
        return na.earnedAt && (!old || !old.earnedAt);
      });

      // Check if progress changed
      const hasChanges = newAchievements.some(na => {
        const old = prev.achievements?.find(oa => oa.id === na.id);
        return !old || old.progress !== na.progress || old.earnedAt !== na.earnedAt;
      });

      if (hasChanges) {
        let newNotifications = [...(prev.notifications || [])];
        
        newlyEarned.forEach(achievement => {
          newNotifications.push({
            id: crypto.randomUUID(),
            message: `🎉 تم تحقيق إنجاز: ${achievement.title}`,
            type: 'achievement',
            createdAt: new Date().toISOString()
          });
          
          showNotification("إنجاز جديد!", { body: `🎉 تم تحقيق إنجاز: ${achievement.title}`, icon: '/icon-192.png' });
        });

        // Sync to Firestore if user is logged in
        if (user) {
          const batch = writeBatch(db);
          newAchievements.forEach(achievement => {
            const ref = doc(collection(db, 'users', user.uid, 'achievements'), achievement.id);
            batch.set(ref, { ...achievement, uid: user.uid });
          });
          batch.commit().catch(console.error);
        }

        return {
          ...prev,
          achievements: newAchievements,
          notifications: newNotifications
        };
      }
      
      return prev;
    });
  }, [state.expenses, state.categories, state.budget, isAuthReady, user]);

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

  const syncLocalDataToFirestore = async (uid: string, dataToSync: AppState = state) => {
    const batch = writeBatch(db);
    
    // Sync profile
    const userDocRef = doc(db, 'users', uid);
    batch.set(userDocRef, {
      uid,
      email: auth.currentUser?.email,
      currency: dataToSync.currency,
      theme: dataToSync.theme,
      hasCompletedOnboarding: dataToSync.hasCompletedOnboarding,
      userName: dataToSync.userName || '',
      firstDayOfMonth: dataToSync.firstDayOfMonth || 1,
      dailyBudget: dataToSync.dailyBudget || 14,
      rollingBudgetEnabled: dataToSync.rollingBudgetEnabled ?? true,
      bestStreak: dataToSync.bestStreak || 0
    });

    // Helper to add to batch
    const addToBatch = (colName: string, items: any[]) => {
      items.forEach(item => {
        const { parsedDate, ...itemToStore } = item;
        const ref = doc(collection(db, 'users', uid, colName), itemToStore.id);
        batch.set(ref, { ...itemToStore, uid });
      });
    };

    addToBatch('expenses', dataToSync.expenses);
    addToBatch('income', dataToSync.income);
    addToBatch('categories', dataToSync.categories);
    addToBatch('accounts', dataToSync.accounts);
    addToBatch('goals', dataToSync.goals);
    addToBatch('recurringExpenses', dataToSync.recurringExpenses);
    addToBatch('achievements', dataToSync.achievements);
    if (dataToSync.budget) {
      const budgetRef = doc(collection(db, 'users', uid, 'budgets'), 'current');
      batch.set(budgetRef, { ...dataToSync.budget, uid });
    }

    await batch.commit();
    toast.success('تمت المزامنة بنجاح');
  };

  useEffect(() => {
    if (state.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.theme]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      safeStorage.setItem('masarifi_data', JSON.stringify(state));
    }, 1000);
    return () => clearTimeout(timeoutId);
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
      parsedDate: parseISO(expense.date),
    };

    if (user) {
      const batch = writeBatch(db);
      const expenseRef = doc(db, 'users', user.uid, 'expenses', newExpense.id);
      const { parsedDate: _pd, ...expenseToStore } = newExpense;
      batch.set(expenseRef, { ...expenseToStore, uid: user.uid });

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

        // Logic for budget alerts (User branch)
        const currentMonth = getBudgetMonth(new Date(), state.firstDayOfMonth);
        const monthlyExpenses = state.expenses.filter(e => e.date.startsWith(currentMonth));
        const totalSpent = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0) + newExpense.amount;
        const budgetAmount = state.budget?.amount || 0;

        if (budgetAmount > 0) {
          if (totalSpent > budgetAmount && totalSpent - newExpense.amount <= budgetAmount) {
            addNotification("تنبيه: لقد تجاوزت ميزانيتك الشهرية!", 'budget');
          } else if (totalSpent > budgetAmount * 0.8 && totalSpent - newExpense.amount <= budgetAmount * 0.8) {
            addNotification("تنبيه: لقد قاربت على تجاوز ميزانيتك الشهرية!", 'budget');
          }
        }

        // Category budget alerts (User branch)
        if (state.budget?.categoryBudgets?.[newExpense.categoryId]) {
          const catBudget = state.budget.categoryBudgets[newExpense.categoryId];
          const catSpent = monthlyExpenses.filter(e => e.categoryId === newExpense.categoryId).reduce((sum, e) => sum + e.amount, 0) + newExpense.amount;
          const categoryName = state.categories.find(c => c.id === newExpense.categoryId)?.name || 'هذه الفئة';

          if (catSpent > catBudget && catSpent - newExpense.amount <= catBudget) {
            addNotification(`تنبيه: لقد تجاوزت ميزانية فئة ${categoryName}!`, 'budget');
          } else if (catSpent > catBudget * 0.8 && catSpent - newExpense.amount <= catBudget * 0.8) {
            addNotification(`تنبيه: لقد قاربت على تجاوز ميزانية فئة ${categoryName}!`, 'budget');
          }
        }
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
        const currentMonth = getBudgetMonth(new Date(), newState.firstDayOfMonth);
        const monthlyExpenses = newState.expenses.filter(e => e.date.startsWith(currentMonth));
        const totalSpent = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
        const budget = newState.budget?.amount || 0;
        
        const sendPushNotification = (title: string, body: string) => {
          showNotification(title, { body, icon: '/icon-192.png' });
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

        return { ...newState, notifications: newNotifications };
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
        
        const newExpense = { ...oldExpense, ...updates, parsedDate: updates.date ? parseISO(updates.date) : oldExpense.parsedDate };
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

        if (expense.isTransfer && expense.transferId) {
          const incomesRef = collection(db, 'users', user.uid, 'income');
          const q = query(incomesRef, where('transferId', '==', expense.transferId));
          const querySnapshot = await getDocs(q);
          for (const incDoc of querySnapshot.docs) {
            const income = incDoc.data() as Income;
            batch.delete(incDoc.ref);
            if (income.accountId) {
              const accRef = doc(db, 'users', user.uid, 'accounts', income.accountId);
              const accDoc = await getDoc(accRef);
              if (accDoc.exists()) batch.update(accRef, { balance: accDoc.data().balance - income.amount });
            }
          }
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

        let newIncome = [...(prev.income || [])];
        if (expense.isTransfer && expense.transferId) {
          const relatedIncome = newIncome.find(i => i.transferId === expense.transferId);
          if (relatedIncome) {
            newIncome = newIncome.filter(i => i.id !== relatedIncome.id);
            if (relatedIncome.accountId) {
              newAccounts = newAccounts.map(a => 
                a.id === relatedIncome.accountId ? { ...a, balance: a.balance - relatedIncome.amount } : a
              );
            }
          }
        }

        return {
          ...prev,
          expenses: prev.expenses.filter((e) => e.id !== id),
          accounts: newAccounts,
          goals: newGoals,
          income: newIncome
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
        return { ...prev, categories: [...prev.categories, newCategory] };
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
        expenses: prev.expenses.map(e => e.categoryId === id ? { ...e, categoryId: '6' } : e),
        recurringExpenses: prev.recurringExpenses.map(re => re.categoryId === id ? { ...re, categoryId: '6' } : re)
      }));
    }
  };

  const transferAccount = async (fromAccountId: string, toAccountId: string, amount: number, transferDate?: string, transferNote?: string) => {
    const fromAcc = state.accounts.find(a => a.id === fromAccountId);
    const toAcc = state.accounts.find(a => a.id === toAccountId);

    if (!fromAcc || !toAcc || fromAcc.balance < amount) return;

    const date = transferDate || new Date().toISOString().split('T')[0];
    const transferId = crypto.randomUUID();

    const expenseEntry: Expense = {
      id: crypto.randomUUID(),
      amount,
      categoryId: '6',
      date,
      note: transferNote || `تحويل إلى ${toAcc.name}`,
      paymentMethod: 'cash',
      accountId: fromAccountId,
      createdAt: new Date().toISOString(),
      isTransfer: true,
      transferId
    };

    const incomeEntry: Income = {
      id: crypto.randomUUID(),
      source: transferNote || `تحويل من ${fromAcc.name}`,
      amount,
      date,
      accountId: toAccountId,
      createdAt: new Date().toISOString(),
      isTransfer: true,
      transferId
    };

    if (user) {
      try {
        const batch = writeBatch(db);

        const fromAccRef = doc(db, 'users', user.uid, 'accounts', fromAccountId);
        const toAccRef = doc(db, 'users', user.uid, 'accounts', toAccountId);
        const fromAccDoc = await getDoc(fromAccRef);
        const toAccDoc = await getDoc(toAccRef);

        if (fromAccDoc.exists()) batch.update(fromAccRef, { balance: fromAccDoc.data().balance - amount });
        if (toAccDoc.exists()) batch.update(toAccRef, { balance: toAccDoc.data().balance + amount });

        batch.set(doc(db, 'users', user.uid, 'expenses', expenseEntry.id), { ...expenseEntry, uid: user.uid });
        batch.set(doc(db, 'users', user.uid, 'income', incomeEntry.id), { ...incomeEntry, uid: user.uid });

        await batch.commit();
        toast.success('تم التحويل بنجاح');
      } catch (error) {
        toast.error('فشل التحويل');
      }
    } else {
      setState((prev) => {
        const newAccounts = prev.accounts.map(acc => {
          if (acc.id === fromAccountId) return { ...acc, balance: acc.balance - amount };
          if (acc.id === toAccountId) return { ...acc, balance: acc.balance + amount };
          return acc;
        });
        return {
          ...prev,
          accounts: newAccounts,
          expenses: [{ ...expenseEntry, parsedDate: parseISO(expenseEntry.date) }, ...prev.expenses],
          income: [{ ...incomeEntry, parsedDate: parseISO(incomeEntry.date) }, ...prev.income]
        };
      });
    }
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
      parsedDate: parseISO(income.date),
    };

    if (user) {
      const batch = writeBatch(db);
      const incomeRef = doc(db, 'users', user.uid, 'income', newIncome.id);
      const { parsedDate: _pd2, ...incomeToStore } = newIncome;
      batch.set(incomeRef, { ...incomeToStore, uid: user.uid });

      if (newIncome.accountId) {
        const accRef = doc(db, 'users', user.uid, 'accounts', newIncome.accountId);
        const accDoc = await getDoc(accRef);
        if (accDoc.exists()) batch.update(accRef, { balance: accDoc.data().balance + newIncome.amount });
      }

      if (newIncome.goalId) {
        const goalRef = doc(db, 'users', user.uid, 'goals', newIncome.goalId);
        const goalDoc = await getDoc(goalRef);
        if (goalDoc.exists()) batch.update(goalRef, { currentAmount: goalDoc.data().currentAmount + newIncome.amount });
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

        let newGoals = [...(prev.goals || [])];
        if (newIncome.goalId) {
          newGoals = newGoals.map(goal => 
            goal.id === newIncome.goalId ? { ...goal, currentAmount: goal.currentAmount + newIncome.amount } : goal
          );
        }

        return { ...prev, income: [...(prev.income || []), newIncome], accounts: newAccounts, goals: newGoals };
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

        // Update linked goal progress
        if (oldIncome.goalId !== newIncome.goalId) {
          if (oldIncome.goalId) {
            const oldGoalRef = doc(db, 'users', user.uid, 'goals', oldIncome.goalId);
            const oldGoalDoc = await getDoc(oldGoalRef);
            if (oldGoalDoc.exists()) batch.update(oldGoalRef, { currentAmount: oldGoalDoc.data().currentAmount - oldIncome.amount });
          }
          if (newIncome.goalId) {
            const newGoalRef = doc(db, 'users', user.uid, 'goals', newIncome.goalId);
            const newGoalDoc = await getDoc(newGoalRef);
            if (newGoalDoc.exists()) batch.update(newGoalRef, { currentAmount: newGoalDoc.data().currentAmount + newIncome.amount });
          }
        } else if (oldIncome.goalId && oldIncome.amount !== newIncome.amount) {
          const diff = newIncome.amount - oldIncome.amount;
          const goalRef = doc(db, 'users', user.uid, 'goals', oldIncome.goalId);
          const goalDoc = await getDoc(goalRef);
          if (goalDoc.exists()) batch.update(goalRef, { currentAmount: goalDoc.data().currentAmount + diff });
        }

        await batch.commit();
      } catch (error) {
        toast.error('فشل تحديث الدخل في السحاب');
      }
    } else {
      setState((prev) => {
        const oldIncome = (prev.income || []).find(i => i.id === id);
        if (!oldIncome) return prev;
        
        const newIncome = { ...oldIncome, ...updates, parsedDate: updates.date ? parseISO(updates.date) : oldIncome.parsedDate };
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

        let newGoals = [...(prev.goals || [])];
        if (oldIncome.goalId !== newIncome.goalId) {
          if (oldIncome.goalId) {
            newGoals = newGoals.map(goal => goal.id === oldIncome.goalId ? { ...goal, currentAmount: goal.currentAmount - oldIncome.amount } : goal);
          }
          if (newIncome.goalId) {
            newGoals = newGoals.map(goal => goal.id === newIncome.goalId ? { ...goal, currentAmount: goal.currentAmount + newIncome.amount } : goal);
          }
        } else if (oldIncome.goalId && oldIncome.amount !== newIncome.amount) {
          const diff = newIncome.amount - oldIncome.amount;
          newGoals = newGoals.map(goal => goal.id === oldIncome.goalId ? { ...goal, currentAmount: goal.currentAmount + diff } : goal);
        }

        return {
          ...prev,
          income: (prev.income || []).map((i) => (i.id === id ? newIncome : i)),
          accounts: newAccounts,
          goals: newGoals
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

        if (income.goalId) {
          const goalRef = doc(db, 'users', user.uid, 'goals', income.goalId);
          const goalDoc = await getDoc(goalRef);
          if (goalDoc.exists()) batch.update(goalRef, { currentAmount: goalDoc.data().currentAmount - income.amount });
        }

        if (income.isTransfer && income.transferId) {
          const expensesRef = collection(db, 'users', user.uid, 'expenses');
          const q = query(expensesRef, where('transferId', '==', income.transferId));
          const querySnapshot = await getDocs(q);
          for (const expDoc of querySnapshot.docs) {
            const expense = expDoc.data() as Expense;
            batch.delete(expDoc.ref);
            if (expense.accountId) {
              const accRef = doc(db, 'users', user.uid, 'accounts', expense.accountId);
              const accDoc = await getDoc(accRef);
              if (accDoc.exists()) batch.update(accRef, { balance: accDoc.data().balance + expense.amount });
            }
          }
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

        let newGoals = [...(prev.goals || [])];
        if (income.goalId) {
          newGoals = newGoals.map(goal => goal.id === income.goalId ? { ...goal, currentAmount: goal.currentAmount - income.amount } : goal);
        }

        let newExpenses = [...(prev.expenses || [])];
        if (income.isTransfer && income.transferId) {
          const relatedExpense = newExpenses.find(e => e.transferId === income.transferId);
          if (relatedExpense) {
            newExpenses = newExpenses.filter(e => e.id !== relatedExpense.id);
            if (relatedExpense.accountId) {
              newAccounts = newAccounts.map(a => 
                a.id === relatedExpense.accountId ? { ...a, balance: a.balance + relatedExpense.amount } : a
              );
            }
          }
        }

        return {
          ...prev,
          income: (prev.income || []).filter((i) => i.id !== id),
          accounts: newAccounts,
          goals: newGoals,
          expenses: newExpenses
        };
      });
    }
  };

  const reorderCategories = async (categories: Category[]) => {
    setState((prev) => ({ ...prev, categories }));

    if (user) {
      try {
        const batch = writeBatch(db);
        categories.forEach((cat, index) => {
          const ref = doc(db, 'users', user.uid, 'categories', cat.id);
          batch.update(ref, { order: index });
        });
        await batch.commit();
      } catch (error) {
        console.error('Failed to sync category order to Firestore', error);
      }
    }
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
        return { ...prev, budget };
      });
    }
  };

  const setDailyBudget = async (amount: number) => {
    // Update local state immediately for responsiveness
    setState(prev => ({ ...prev, dailyBudget: amount }));
    
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { dailyBudget: amount });
      } catch (error) {
        console.error('Failed to update dailyBudget in Firestore', error);
        // Optionally revert local state if Firestore update fails
      }
    }
  };

  const setRollingBudgetEnabled = async (enabled: boolean) => {
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { rollingBudgetEnabled: enabled });
      } catch (error) {
        console.error('Failed to update rollingBudgetEnabled in Firestore');
      }
    } else {
      setState(prev => ({ ...prev, rollingBudgetEnabled: enabled }));
    }
  };

  const repeatExpense = async (expenseId: string) => {
    const original = state.expenses.find(e => e.id === expenseId);
    if (!original) return;

    const { id, createdAt, parsedDate, date, ...rest } = original;
    await addExpense({
      ...rest,
      date: new Date().toISOString().split('T')[0],
    });
    toast.success('تم تكرار المصروف بنجاح');
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

  const exportData = (format: 'json' | 'csv' = 'json') => {
    if (format === 'json') {
      const dataStr = JSON.stringify(state);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      const exportFileDefaultName = `masarifi_backup_${new Date().toISOString().split('T')[0]}.json`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } else {
      // Export transactions to CSV
      const headers = ['Type', 'Date', 'Amount', 'Category', 'Account', 'Description/Source'];
      const rows = [
        ...state.expenses.map(e => [
          'Expense',
          e.date,
          e.amount,
          state.categories.find(c => c.id === e.categoryId)?.name || e.categoryId,
          state.accounts.find(a => a.id === e.accountId)?.name || e.accountId,
          e.note
        ]),
        ...state.income.map(i => [
          'Income',
          i.date,
          i.amount,
          'Income',
          state.accounts.find(a => a.id === i.accountId)?.name || i.accountId,
          i.source
        ])
      ];

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
      const exportFileDefaultName = `masarifi_transactions_${new Date().toISOString().split('T')[0]}.csv`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    }
  };

  const importData = async (dataStr: string) => {
    try {
      const parsed = JSON.parse(dataStr);
      if (parsed.expenses && parsed.categories) {
        const newData = { ...INITIAL_STATE, ...parsed };
        setState(newData);
        
        if (user) {
          const confirmSync = window.confirm('تم استيراد البيانات محلياً. هل تريد مزامنتها مع السحاب أيضاً؟ (سيؤدي ذلك إلى استبدال البيانات الحالية في السحاب)');
          if (confirmSync) {
            await syncLocalDataToFirestore(user.uid, newData);
          }
        }
        
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

  const toggleOfflineMode = async (enabled: boolean) => {
    setState(prev => ({ ...prev, offlineMode: enabled }));
    try {
      if (enabled) {
        await disableNetwork(db);
        toast.success('تم تفعيل وضع عدم الاتصال');
      } else {
        await enableNetwork(db);
        toast.success('تم تفعيل وضع الاتصال');
      }
    } catch (error) {
      console.error('Failed to toggle network state', error);
      toast.error('حدث خطأ أثناء تغيير حالة الاتصال');
    }
  };

  const setUserName = async (userName: string) => {
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { userName });
      } catch (error) {
        console.error('Failed to update userName in Firestore');
      }
    } else {
      setState(prev => ({ ...prev, userName }));
    }
  };

  const setFirstDayOfMonth = async (day: number) => {
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { firstDayOfMonth: day });
      } catch (error) {
        console.error('Failed to update firstDayOfMonth in Firestore');
      }
    } else {
      setState(prev => ({ ...prev, firstDayOfMonth: day }));
    }
  };

  const updateAIInsights = useCallback((insights: { advice: any[], forecast: any[] }) => {
    setState(prev => ({
      ...prev,
      aiInsights: {
        ...insights,
        lastUpdated: new Date().toISOString()
      }
    }));
  }, []);

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

  const applyTunisianFamilyTemplate = async () => {
    if (user) {
      try {
        const batch = writeBatch(db);
        
        // Update user profile doc
        const userDocRef = doc(db, 'users', user.uid);
        batch.update(userDocRef, {
          currency: 'TND',
          dailyBudget: 25,
        });

        // First, let's clear existing categories collection in Firestore
        const existingCatQ = query(collection(db, 'users', user.uid, 'categories'));
        const existingCatSnapshot = await getDocs(existingCatQ);
        existingCatSnapshot.docs.forEach(d => batch.delete(d.ref));

        // Add default categories to Firestore
        DEFAULT_CATEGORIES.forEach((cat, index) => {
          const catRef = doc(collection(db, 'users', user.uid, 'categories'), cat.id);
          batch.set(catRef, { ...cat, order: index, uid: user.uid });
        });

        await batch.commit();
        
        // Also update local React state so it switches instantly
        setState(prev => ({
          ...prev,
          currency: 'TND',
          dailyBudget: 25,
          categories: DEFAULT_CATEGORIES,
          aiInsights: INITIAL_STATE.aiInsights
        }));
        
        toast.success('تم تطبيق قالب العائلة التونسية بنجاح ومزامنته!');
      } catch (error) {
        console.error('Failed to apply template in Firestore', error);
        toast.error('حدث خطأ أثناء تطبيق القالب في السحاب');
      }
    } else {
      setState(prev => ({
        ...prev,
        currency: 'TND',
        dailyBudget: 25,
        categories: DEFAULT_CATEGORIES,
        aiInsights: INITIAL_STATE.aiInsights
      }));
      toast.success('تم تطبيق قالب ميزانية العائلة التونسية بنجاح!');
    }
  };

  const contextValue = useMemo(() => ({
    ...state,
    user,
    isAuthReady,
    login,
    logout,
    isAddModalOpen,
    setIsAddModalOpen,
    editingExpense,
    setEditingExpense,
    initialGoalId,
    setInitialGoalId,
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
    setDailyBudget,
    setRollingBudgetEnabled,
    setTheme,
    repeatExpense,
    exportData,
    importData,
    updateAchievement,
    addNotification,
    removeNotification,
    completeOnboarding,
    setCurrency,
    setUserName,
    setFirstDayOfMonth,
    updateAIInsights,
    resetData,
    toggleOfflineMode,
    applyTunisianFamilyTemplate,
  }), [
    state,
    user,
    isAuthReady,
    isAddModalOpen,
    // Functions are stable because they are defined inside the component and don't depend on changing values directly (they use setState updater pattern)
    // However, to be extra safe and follow best practices, we should ensure they are stable.
    // Most of these functions are defined as const inside the component.
  ]);

  return (
    <AppContext.Provider value={contextValue}>
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
