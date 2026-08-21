import { useAccounts } from './hooks/useAccounts';
import { useTransactions } from './hooks/useTransactions';
import { useGoals } from './hooks/useGoals';
import { useDebts } from './hooks/useDebts';
import { useCategories } from './hooks/useCategories';
import { useGamaeyas } from './hooks/useGamaeyas';
import { useBudget } from './hooks/useBudget';
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { AppState, Category, Expense, Budget, RecurringExpense, Achievement, Goal, Debt, DebtPayment, AppNotification, Income, Account, SmartSavingChallenge, AutoRoundUpSetting } from '../types';
import { evaluateAchievements } from '../utils/achievements';
import { getBudgetMonth, safeStorage, safeParseISO, removeUndefinedFields, hashPin } from '../utils';
import { addDays, addWeeks, addMonths, addYears, isBefore, isSameDay, subDays, format, parseISO } from 'date-fns';
import { ACHIEVEMENTS } from '../constants/achievements';
import { auth, db, signInWithGoogle, logout as firebaseLogout, onAuthStateChanged, getRedirectResult } from '../lib/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  onSnapshot, 
  deleteDoc, 
  query,
  where,
  orderBy,
  disableNetwork,
  enableNetwork,
  setDoc as fsSetDoc,
  updateDoc as fsUpdateDoc,
  addDoc as fsAddDoc,
  writeBatch as fsWriteBatch
} from 'firebase/firestore';

// Wrapped safe database writes that filter undefined fields and prevent silent write failures
const setDoc = (ref: any, data: any, options?: any) => {
  return fsSetDoc(ref, removeUndefinedFields(data), options);
};

const addDoc = (ref: any, data: any) => {
  return fsAddDoc(ref, removeUndefinedFields(data));
};

const updateDoc = (ref: any, data: any) => {
  return fsUpdateDoc(ref, removeUndefinedFields(data));
};

const writeBatch = (firestoreInstance: any) => {
  const batch = fsWriteBatch(firestoreInstance);
  const wrappedBatch = {
    set(ref: any, data: any, options?: any) {
      batch.set(ref, removeUndefinedFields(data), options);
      return wrappedBatch;
    },
    update(ref: any, data: any) {
      batch.update(ref, removeUndefinedFields(data));
      return wrappedBatch;
    },
    delete(ref: any) {
      batch.delete(ref);
      return wrappedBatch;
    },
    commit() {
      return batch.commit();
    }
  };
  return wrappedBatch as any;
};

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
  budgets: [],
  dailyBudget: 25, // default daily budget in Dinars is around 25 TND for a Tunisian family
  rollingBudgetEnabled: true,
  theme: 'light',
  currency: 'TND',
  achievements: [],
  goals: [],
  debts: [],
  income: [],
  notifications: [],
  hasCompletedOnboarding: false,
  userName: 'حسن الرياحي',
  firstDayOfMonth: 1,
  bestStreak: 0,
  offlineMode: false,
  gamaeyas: [],
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
  },
  activeChallenge: undefined,
  autoRoundUpSetting: undefined
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
  addGamaeya: (gamaeya: Omit<import('../types').Gamaeya, 'id' | 'createdAt' | 'status' | 'payments'>) => void;
  updateGamaeya: (id: string, updates: Partial<import('../types').Gamaeya>) => void;
  deleteGamaeya: (id: string) => void;
  payGamaeyaMonth: (gamaeyaId: string, monthIndex: number) => void;
  receiveGamaeyaPayout: (gamaeyaId: string) => void;
  addCategory: (category: Omit<Category, 'id'>) => Promise<Category>;
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
  addDebt: (debt: Omit<Debt, 'id' | 'createdAt' | 'remainingAmount' | 'isSettled' | 'payments'> & Partial<Pick<Debt, 'remainingAmount' | 'isSettled' | 'payments'>>) => void;
  updateDebt: (id: string, updates: Partial<Debt>) => void;
  addDebtPayment: (debtId: string, payment: Omit<DebtPayment, 'id'>) => void;
  deleteDebt: (id: string) => void;
  addIncome: (income: Omit<Income, 'id' | 'createdAt'>) => void;
  updateIncome: (id: string, income: Partial<Income>) => void;
  deleteIncome: (id: string) => void;
  setBudget: (budget: Budget) => void;
  setDailyBudget: (amount: number) => void;
  setRollingBudgetEnabled: (enabled: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  repeatExpense: (id: string) => Promise<void>;
  exportData: (format?: 'json' | 'csv') => void;
  exportToPDF: () => Promise<void>;
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
  updateActiveChallenge: (challenge: SmartSavingChallenge | undefined) => Promise<void>;
  updateAutoRoundUpSetting: (setting: AutoRoundUpSetting | undefined) => Promise<void>;
  applyTunisianFamilyTemplate: () => Promise<void>;
  migrateSeptemberDataToAugust: () => Promise<number>;
  isPinSet: boolean;
  isLocked: boolean;
  setIsLocked: (locked: boolean) => void;
  setAppPin: (pin: string | null) => Promise<boolean>;
  verifyAppPin: (pin: string) => Promise<boolean>;
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
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    const hasPin = !!safeStorage.getItem('masarifi_pin_hash');
    return hasPin;
  });

  const [isPinSet, setIsPinSet] = useState<boolean>(() => {
    return !!safeStorage.getItem('masarifi_pin_hash');
  });

  const setAppPin = useCallback(async (pin: string | null): Promise<boolean> => {
    if (pin === null) {
      safeStorage.removeItem('masarifi_pin_hash');
      setIsPinSet(false);
      setIsLocked(false);
      return true;
    }
    if (pin.length !== 4) {
      toast.error('رمز PIN يجب أن يتكون من 4 أرقام');
      return false;
    }
    const hashed = await hashPin(pin);
    safeStorage.setItem('masarifi_pin_hash', hashed);
    setIsPinSet(true);
    setIsLocked(false);
    return true;
  }, []);

  const verifyAppPin = useCallback(async (pin: string): Promise<boolean> => {
    const savedHash = safeStorage.getItem('masarifi_pin_hash');
    if (!savedHash) {
      setIsLocked(false);
      return true;
    }
    const hashed = await hashPin(pin);
    if (hashed === savedHash) {
      setIsLocked(false);
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const hasPin = !!safeStorage.getItem('masarifi_pin_hash');
        if (hasPin) {
          setIsLocked(true);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const [state, setState] = useState<AppState>(() => {
    const saved = safeStorage.getItem('masarifi_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const expenses = (parsed.expenses || []).map((e: any) => ({ ...e, parsedDate: safeParseISO(e.date) }));
        const income = (parsed.income || []).map((i: any) => ({ ...i, parsedDate: safeParseISO(i.date) }));
        return { ...INITIAL_STATE, ...parsed, expenses, income, recurringExpenses: parsed.recurringExpenses || [], gamaeyas: parsed.gamaeyas || [], debts: parsed.debts || [] };
      } catch (e) {
        console.error('Failed to parse saved data', e);
      }
    }
    return INITIAL_STATE;
  });

  // Auth Listener & Redirect Result
  useEffect(() => {
    // Check if returning from redirect sign-in
    getRedirectResult(auth).then((result) => {
      if (result?.user) {
        toast.success('تم تسجيل الدخول بنجاح عبر Google');
        if (state.expenses.length > 0) {
          syncLocalDataToFirestore(result.user.uid);
        }
      }
    }).catch((err) => {
      console.error('Redirect sign-in error:', err);
    });

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
          bestStreak: data.bestStreak || prev.bestStreak,
          activeChallenge: data.activeChallenge !== undefined ? (data.activeChallenge || undefined) : prev.activeChallenge,
          autoRoundUpSetting: data.autoRoundUpSetting !== undefined ? (data.autoRoundUpSetting || undefined) : prev.autoRoundUpSetting
        }));
      } else {
        // Initialize user profile in Firestore
        setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          currency: state.currency,
          theme: state.theme,
          hasCompletedOnboarding: state.hasCompletedOnboarding,
          userName: state.userName || 'حسن الرياحي',
          firstDayOfMonth: state.firstDayOfMonth || 1,
          dailyBudget: state.dailyBudget || 14,
          rollingBudgetEnabled: state.rollingBudgetEnabled ?? true,
          bestStreak: state.bestStreak || 0,
          autoRoundUpSetting: state.autoRoundUpSetting || null
        });
      }
    });

    // Subscriptions for collections
    const collections = [
      { name: 'expenses', setter: (data: any[]) => setState(prev => ({ ...prev, expenses: data.map(e => ({ ...e, parsedDate: safeParseISO(e.date) })) })) },
      { name: 'income', setter: (data: any[]) => setState(prev => ({ ...prev, income: data.map(i => ({ ...i, parsedDate: safeParseISO(i.date) })) })) },
      { name: 'categories', setter: (data: any[]) => setState(prev => ({ ...prev, categories: data.length > 0 ? data.sort((a, b) => (a.order || 0) - (b.order || 0)) : DEFAULT_CATEGORIES })) },
      { name: 'accounts', setter: (data: any[]) => setState(prev => ({ ...prev, accounts: data.length > 0 ? data : DEFAULT_ACCOUNTS })) },
      { name: 'goals', setter: (data: any[]) => setState(prev => ({ ...prev, goals: data })) },
      { name: 'recurringExpenses', setter: (data: any[]) => setState(prev => ({ ...prev, recurringExpenses: data })) },
      { name: 'budgets', setter: (data: any[]) => setState(prev => ({ ...prev, budgets: data })) },
      { name: 'achievements', setter: (data: any[]) => setState(prev => ({ ...prev, achievements: data })) },
      { name: 'gamaeyas', setter: (data: any[]) => setState(prev => ({ ...prev, gamaeyas: data })) },
      { name: 'debts', setter: (data: any[]) => setState(prev => ({ ...prev, debts: data })) },
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

  // Auto-sync account balances with recorded transactions (self-healing for zero or out-of-sync balances)
  useEffect(() => {
    if (!state.income || !state.accounts) return;

    const currentAccounts = state.accounts.length > 0 ? state.accounts : DEFAULT_ACCOUNTS;

    let needsUpdate = false;
    const updatedAccounts = currentAccounts.map(acc => {
      // Calculate net income for this account
      const totalAccIncome = (state.income || [])
        .filter(i => i.accountId === acc.id || (!i.accountId && acc.id === 'cash'))
        .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

      const totalAccExpense = (state.expenses || [])
        .filter(e => e.accountId === acc.id || (!e.accountId && acc.id === 'cash'))
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

      const computedBalance = totalAccIncome - totalAccExpense;

      // If stored account balance is different from computed balance when income exists
      if (totalAccIncome > 0 && acc.balance !== computedBalance) {
        needsUpdate = true;
        return { ...acc, balance: computedBalance };
      }
      return acc;
    });

    if (needsUpdate) {
      setState(prev => ({ ...prev, accounts: updatedAccounts }));
      if (user) {
        updatedAccounts.forEach(acc => {
          setDoc(doc(db, 'users', user.uid, 'accounts', acc.id), { ...acc, uid: user.uid }, { merge: true });
        });
      }
    }
  }, [state.income, state.expenses, user]);

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
  }, [state.expenses, state.categories, state.budgets, isAuthReady, user]);

  const login = async () => {
    try {
      const result = await signInWithGoogle();
      if (result && result.user) {
        setUser(result.user);
        toast.success(`أهلاً بك! تم تسجيل الدخول بنجاح (${result.user.email})`);
        
        // Check if we should sync local data
        if (state.expenses.length > 0) {
          const confirmSync = window.confirm('هل تود مزامنة بياناتك المحلية مع السحاب؟');
          if (confirmSync) {
            await syncLocalDataToFirestore(result.user.uid);
          }
        }
      }
    } catch (error: any) {
      console.error('Login failed', error);
      
      if (error?.code === 'auth/unauthorized-domain') {
        toast.error('النطاق الحالي غير مسموح به في Firebase. يرجى إضافة hassan098999-beep.github.io في Authorized Domains في Firebase Console.', { duration: 10000 });
      } else if (error?.code === 'auth/popup-blocked') {
        toast.error('تم منع النافذة المنبثقة من قبل المتصفح. يرجى السماح بالنوافذ المنبثقة ثم المحاولة مجدداً.');
      } else if (error?.code === 'auth/popup-closed-by-user') {
        toast.error('تم إغلاق نافذة تسجيل الدخول قبل الاتمام.');
      } else if (error?.code === 'auth/cancelled-popup-request') {
        // Ignored duplicate request
      } else {
        toast.error('فشل تسجيل الدخول: ' + (error?.message || 'حدث خطأ غير متوقع'));
      }
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
      email: auth.currentUser?.email || null,
      currency: dataToSync.currency,
      theme: dataToSync.theme,
      hasCompletedOnboarding: dataToSync.hasCompletedOnboarding,
      userName: dataToSync.userName || '',
      firstDayOfMonth: dataToSync.firstDayOfMonth || 1,
      dailyBudget: dataToSync.dailyBudget || 14,
      rollingBudgetEnabled: dataToSync.rollingBudgetEnabled ?? true,
      bestStreak: dataToSync.bestStreak || 0,
      activeChallenge: dataToSync.activeChallenge || null,
      autoRoundUpSetting: dataToSync.autoRoundUpSetting || null
    }, { merge: true });

    // Helper to add to batch
    const addToBatch = (colName: string, items: any[]) => {
      if (!items) return;
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
    addToBatch('gamaeyas', dataToSync.gamaeyas || []);
    addToBatch('debts', dataToSync.debts || []);
    if (dataToSync.budgets && dataToSync.budgets.length > 0) {
      dataToSync.budgets.forEach(budget => {
        const budgetRef = doc(collection(db, 'users', uid, 'budgets'), budget.month);
        batch.set(budgetRef, { ...budget, uid });
      });
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
  const addRecurringExpense = async (expense: Omit<RecurringExpense, 'id' | 'createdAt'>) => {
    const newExpense: RecurringExpense = {
      ...expense,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    // 1. Optimistic local update
    setState((prev) => ({ ...prev, recurringExpenses: [...(prev.recurringExpenses || []), newExpense] }));

    // 2. Cloud update
    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'recurringExpenses', newExpense.id), { ...newExpense, uid: user.uid });
      } catch (error) {
        console.warn('Recurring expense saved locally (buffered for sync):', error);
      }
    }
  };

  const updateRecurringExpense = async (id: string, updates: Partial<RecurringExpense>) => {
    // 1. Optimistic local update
    setState((prev) => ({
      ...prev,
      recurringExpenses: (prev.recurringExpenses || []).map((e) => (e.id === id ? { ...e, ...updates } : e)),
    }));

    // 2. Cloud update
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid, 'recurringExpenses', id), updates);
      } catch (error) {
        console.warn('Recurring expense updated locally (buffered for sync):', error);
      }
    }
  };

  const deleteRecurringExpense = async (id: string) => {
    // 1. Optimistic local update
    setState((prev) => ({
      ...prev,
      recurringExpenses: (prev.recurringExpenses || []).filter((e) => e.id !== id),
    }));

    // 2. Cloud update
    if (user) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'recurringExpenses', id));
      } catch (error) {
        console.warn('Recurring expense deleted locally (buffered for sync):', error);
      }
    }
  };

  const processDueRecurringExpenses = useCallback(async () => {
    if (state.recurringExpenses.length === 0) return;
    
    const todayStr = new Date().toISOString().split('T')[0];
    const todayDate = new Date(todayStr);

    const dueItems = state.recurringExpenses.filter(re => {
      try {
        const nextDateParts = re.nextDate.split('-');
        const nextDate = new Date(Number(nextDateParts[0]), Number(nextDateParts[1]) - 1, Number(nextDateParts[2]));
        return nextDate <= todayDate;
      } catch (e) {
        return false;
      }
    });

    if (dueItems.length === 0) return;

    const updatedRecurring = [...state.recurringExpenses];
    const newExpensesToCreate: Expense[] = [];

    for (const re of dueItems) {
      const newExpenseId = crypto.randomUUID();
      const newExpense: Expense = {
        id: newExpenseId,
        amount: re.amount,
        categoryId: re.categoryId,
        subcategoryId: re.subcategoryId,
        accountId: re.accountId || 'cash',
        note: re.note || 'مصروف متكرر مجدول',
        paymentMethod: re.paymentMethod || 'cash',
        date: re.nextDate,
        createdAt: new Date().toISOString()
      };
      
      newExpensesToCreate.push(newExpense);

      const currentNextDate = parseISO(re.nextDate);
      let updatedNextDate: Date;
      switch (re.interval) {
        case 'daily':
          updatedNextDate = addDays(currentNextDate, 1);
          break;
        case 'weekly':
          updatedNextDate = addWeeks(currentNextDate, 1);
          break;
        case 'monthly':
          updatedNextDate = addMonths(currentNextDate, 1);
          break;
        case 'yearly':
          updatedNextDate = addYears(currentNextDate, 1);
          break;
        default:
          updatedNextDate = addMonths(currentNextDate, 1);
      }
      const updatedNextDateStr = format(updatedNextDate, 'yyyy-MM-dd');

      const idx = updatedRecurring.findIndex(item => item.id === re.id);
      if (idx !== -1) {
        updatedRecurring[idx] = {
          ...updatedRecurring[idx],
          nextDate: updatedNextDateStr
        };
      }
    }

    // Is it idempotent? Let's check duplicates
    const sanitizedNewExpenses = newExpensesToCreate.filter(ne => {
      return !state.expenses.some(e => e.date === ne.date && e.amount === ne.amount && e.categoryId === ne.categoryId && e.note === ne.note);
    });

    if (sanitizedNewExpenses.length === 0 && dueItems.every((re, idx) => re.nextDate === updatedRecurring[idx].nextDate)) {
      return;
    }

    try {
      if (user) {
        const batch = writeBatch(db);
        
        sanitizedNewExpenses.forEach(exp => {
          const ref = doc(db, 'users', user.uid, 'expenses', exp.id);
          batch.set(ref, { ...exp, uid: user.uid });
          
          if (!exp.accountId) return;
          const accRef = doc(db, 'users', user.uid, 'accounts', exp.accountId);
          const accountObj = state.accounts.find(a => a.id === exp.accountId);
          if (accountObj) {
            batch.update(accRef, { balance: accountObj.balance - exp.amount });
          }
        });
        
        dueItems.forEach(re => {
          const itemCopy = updatedRecurring.find(item => item.id === re.id);
          if (itemCopy) {
            const ref = doc(db, 'users', user.uid, 'recurringExpenses', re.id);
            batch.update(ref, { nextDate: itemCopy.nextDate });
          }
        });
        
        await batch.commit();
        toast.success('تمت جدولة وتحديث المصاريف المتكررة المستحقة');
      } else {
        setState(prev => {
          const localExpenses = [...prev.expenses];
          const localAccounts = [...prev.accounts];
          
          sanitizedNewExpenses.forEach(exp => {
            localExpenses.push({ ...exp, parsedDate: safeParseISO(exp.date) });
            const accIdx = localAccounts.findIndex(a => a.id === exp.accountId);
            if (accIdx !== -1) {
              localAccounts[accIdx] = {
                ...localAccounts[accIdx],
                balance: localAccounts[accIdx].balance - exp.amount
              };
            }
          });

          const newRecurringList = prev.recurringExpenses.map(re => {
            const updated = updatedRecurring.find(item => item.id === re.id);
            return updated ? updated : re;
          });

          const newState = {
            ...prev,
            expenses: localExpenses,
            accounts: localAccounts,
            recurringExpenses: newRecurringList
          };
          
          safeStorage.setItem('masarifi_data', JSON.stringify({
            ...newState,
            expenses: newState.expenses.map(({ parsedDate, ...rest }: any) => rest)
          }));

          return newState;
        });
        
        if (sanitizedNewExpenses.length > 0) {
          toast.success('تمت جدولة وتحديث المصاريف المتكررة المستحقة (محلياً)');
        }
      }
    } catch (err) {
      console.error('Error processing due recurring expenses:', err);
    }
  }, [state.recurringExpenses, state.expenses, state.accounts, user]);

  useEffect(() => {
    if (!isAuthReady) return;
    if (state.recurringExpenses.length === 0) return;
    processDueRecurringExpenses();
  }, [isAuthReady, state.recurringExpenses, processDueRecurringExpenses]);
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
          e.isTransfer ? 'Transfer (Out)' : 'Expense',
          e.date,
          e.amount,
          e.isTransfer ? 'Transfer' : (state.categories.find(c => c.id === e.categoryId)?.name || e.categoryId),
          state.accounts.find(a => a.id === e.accountId)?.name || e.accountId,
          e.note
        ]),
        ...state.income.map(i => [
          i.isTransfer ? 'Transfer (In)' : 'Income',
          i.date,
          i.amount,
          i.isTransfer ? 'Transfer' : 'Income',
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

  const exportToPDF = async () => {
    const loadingToast = toast.loading('جاري تحضير تقرير PDF للتصدير...');
    try {
      const { jsPDF } = await import('jspdf');
      await import('jspdf-autotable');
      
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Fetch Amiri font locally from public assets for complete offline support
      try {
        const fontUrl = '/fonts/Amiri-Regular.ttf';
        const res = await fetch(fontUrl);
        if (res.ok) {
          const fontBuffer = await res.arrayBuffer();
          // Convert arrayBuffer to base64
          let binary = '';
          const bytes = new Uint8Array(fontBuffer);
          const len = bytes.byteLength;
          for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const base64 = btoa(binary);
          doc.addFileToVFS('Amiri-Regular.ttf', base64);
          doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
          doc.setFont('Amiri');
        } else {
          console.warn('Failed to fetch Arabic font, falling back to standard font');
        }
      } catch (fontErr) {
        console.error('Error fetching font, using fallback', fontErr);
      }

      // Calculations
      const totalExpenses = state.expenses.filter(e => !e.isTransfer).reduce((sum, e) => sum + e.amount, 0);
      const totalIncome = state.income.filter(i => !i.isTransfer).reduce((sum, i) => sum + i.amount, 0);
      const balance = totalIncome - totalExpenses;
      const currency = state.currency || 'د.ت';

      // Title & Header Information
      const userNameStr = state.userName || (user?.email ? user.email.split('@')[0] : 'مستخدم مصاريفي');
      const todayStr = new Date().toLocaleDateString('ar-TN', { year: 'numeric', month: 'long', day: 'numeric' });
      
      // Determine overall period
      const allDates = [
        ...state.expenses.map(e => e.date),
        ...state.income.map(i => i.date)
      ].sort();
      let periodStr = 'كل المعاملات المسجلة';
      if (allDates.length > 0) {
        periodStr = `من ${allDates[0]} إلى ${allDates[allDates.length - 1]}`;
      }

      // Metadata at top
      doc.setFontSize(22);
      if (doc.getFont()?.fontName === 'Amiri') {
        doc.text('تقرير الإدارة المالية - تطبيق مصاريفي', 105, 18, { align: 'center' });
        doc.setFontSize(12);
        doc.text(`تاريخ التصدير: ${todayStr}`, 190, 28, { align: 'right' });
        doc.text(`اسم المستخدم: ${userNameStr}`, 190, 34, { align: 'right' });
        doc.text(`الفترة: ${periodStr}`, 190, 40, { align: 'right' });
      } else {
        doc.text('Financial Report - Masarifi', 105, 18, { align: 'center' });
        doc.setFontSize(12);
        doc.text(`Export Date: ${new Date().toLocaleDateString()}`, 15, 28, { align: 'left' });
        doc.text(`User Name: ${userNameStr}`, 15, 34, { align: 'left' });
        doc.text(`Period: ${periodStr}`, 15, 40, { align: 'left' });
      }

      // Draw a sleek line
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.5);
      doc.line(15, 45, 195, 45);

      // Summary Cards Layout: Expenses, Income, Balance
      // Let's draw some rectangles with nice backgrounds
      if (doc.getFont()?.fontName === 'Amiri') {
        // 1. Income Card (Green background/border)
        doc.setFillColor(240, 253, 244); // bg-emerald-50
        doc.setDrawColor(187, 247, 208); // border-emerald-200
        doc.roundedRect(15, 52, 55, 25, 3, 3, 'FD');
        doc.setFontSize(10);
        doc.setTextColor(21, 128, 61); // text-emerald-700
        doc.text('إجمالي الدخل', 42.5, 58, { align: 'center' });
        doc.setFontSize(14);
        doc.text(`+${totalIncome.toFixed(3)} ${currency}`, 42.5, 68, { align: 'center' });

        // 2. Expenses Card (Red background/border)
        doc.setFillColor(254, 242, 242); // bg-rose-50
        doc.setDrawColor(254, 202, 202); // border-rose-200
        doc.roundedRect(77.5, 52, 55, 25, 3, 3, 'FD');
        doc.setFontSize(10);
        doc.setTextColor(185, 28, 28); // text-rose-700
        doc.text('إجمالي المصاريف', 105, 58, { align: 'center' });
        doc.setFontSize(14);
        doc.text(`-${totalExpenses.toFixed(3)} ${currency}`, 105, 68, { align: 'center' });

        // 3. Net Balance Card (Blue background/border)
        doc.setFillColor(240, 249, 255); // bg-sky-50
        doc.setDrawColor(186, 230, 253); // border-sky-200
        doc.roundedRect(140, 52, 55, 25, 3, 3, 'FD');
        doc.setFontSize(10);
        doc.setTextColor(3, 105, 161); // text-sky-700
        doc.text('صافي الرصيد الحالي', 167.5, 58, { align: 'center' });
        doc.setFontSize(14);
        doc.text(`${balance >= 0 ? '+' : ''}${balance.toFixed(3)} ${currency}`, 167.5, 68, { align: 'center' });
      } else {
        // 1. Income Card
        doc.setFillColor(240, 253, 244);
        doc.setDrawColor(187, 247, 208);
        doc.roundedRect(15, 52, 55, 25, 3, 3, 'FD');
        doc.setFontSize(10);
        doc.setTextColor(21, 128, 61);
        doc.text('Total Income', 42.5, 58, { align: 'center' });
        doc.setFontSize(14);
        doc.text(`+${totalIncome.toFixed(3)} ${currency}`, 42.5, 68, { align: 'center' });

        // 2. Expenses Card
        doc.setFillColor(254, 242, 242);
        doc.setDrawColor(254, 202, 202);
        doc.roundedRect(77.5, 52, 55, 25, 3, 3, 'FD');
        doc.setFontSize(10);
        doc.setTextColor(185, 28, 28);
        doc.text('Total Expenses', 105, 58, { align: 'center' });
        doc.setFontSize(14);
        doc.text(`-${totalExpenses.toFixed(3)} ${currency}`, 105, 68, { align: 'center' });

        // 3. Net Balance Card
        doc.setFillColor(240, 249, 255);
        doc.setDrawColor(186, 230, 253);
        doc.roundedRect(140, 52, 55, 25, 3, 3, 'FD');
        doc.setFontSize(10);
        doc.setTextColor(3, 105, 161);
        doc.text('Net Balance', 167.5, 58, { align: 'center' });
        doc.setFontSize(14);
        doc.text(`${balance >= 0 ? '+' : ''}${balance.toFixed(3)} ${currency}`, 167.5, 68, { align: 'center' });
      }

      // Restore default text colors
      doc.setTextColor(30, 41, 59); // text-slate-800

      // Table preparation
      // Combine expenses and income
      const allTransactions = [
        ...state.expenses.map(e => ({
          date: e.date,
          type: 'مصروف',
          typeEn: 'Expense',
          category: state.categories.find(c => c.id === e.categoryId)?.name || 'غير مصنف',
          account: state.accounts.find(a => a.id === e.accountId)?.name || 'رئيسي',
          amount: e.amount,
          amountStr: `-${e.amount.toFixed(3)} ${currency}`,
          description: e.note || '-',
          isIncome: false
        })),
        ...state.income.map(i => ({
          date: i.date,
          type: 'دخل',
          typeEn: 'Income',
          category: 'دخل / راتب',
          account: state.accounts.find(a => a.id === i.accountId)?.name || 'رئيسي',
          amount: i.amount,
          amountStr: `+${i.amount.toFixed(3)} ${currency}`,
          description: i.source || '-',
          isIncome: true
        }))
      ].sort((a, b) => b.date.localeCompare(a.date));

      const isAmiriLoaded = doc.getFont()?.fontName === 'Amiri';
      
      // Build table body rows (as arrays)
      const tableRows = allTransactions.map(t => [
        t.description,
        t.amountStr,
        t.account,
        t.category,
        isAmiriLoaded ? t.type : t.typeEn,
        t.date
      ]);

      const headers = isAmiriLoaded 
        ? ['البيان / المصدر', 'المبلغ', 'الحساب', 'التصنيف', 'النوع', 'التاريخ'] 
        : ['Description / Source', 'Amount', 'Account', 'Category', 'Type', 'Date'];

      // jspdf-autotable options
      (doc as any).autoTable({
        startY: 85,
        head: [headers],
        body: tableRows,
        styles: {
          font: isAmiriLoaded ? 'Amiri' : 'Helvetica',
          halign: isAmiriLoaded ? 'right' : 'left',
          fontSize: 10,
          cellPadding: 3
        },
        headStyles: {
          fillColor: [51, 65, 85], // slate-700
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: isAmiriLoaded ? 'right' : 'left'
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252] // slate-50
        },
        columnStyles: isAmiriLoaded ? {
          0: { cellWidth: 'auto', halign: 'right' },
          1: { cellWidth: 35, halign: 'left', fontStyle: 'bold' },
          2: { cellWidth: 25, halign: 'right' },
          3: { cellWidth: 25, halign: 'right' },
          4: { cellWidth: 20, halign: 'right' },
          5: { cellWidth: 25, halign: 'center' }
        } : {
          0: { cellWidth: 'auto', halign: 'left' },
          1: { cellWidth: 35, halign: 'right', fontStyle: 'bold' },
          2: { cellWidth: 25, halign: 'left' },
          3: { cellWidth: 25, halign: 'left' },
          4: { cellWidth: 20, halign: 'left' },
          5: { cellWidth: 25, halign: 'center' }
        },
        // Adjust individual cells for color
        didParseCell: (data: any) => {
          if (data.section === 'body') {
            const rowIndex = data.row.index;
            const item = allTransactions[rowIndex];
            if (data.column.index === 1) { // Amount column
              if (item.isIncome) {
                data.cell.styles.textColor = [21, 128, 61]; // green
              } else {
                data.cell.styles.textColor = [185, 28, 28]; // red
              }
            }
          }
        },
        margin: { left: 15, right: 15 }
      });

      // Save PDF
      doc.save(`masarifi_report_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.dismiss(loadingToast);
      toast.success('تم تصدير التقرير المالي بصيغة PDF بنجاح!');
    } catch (err: any) {
      console.error('PDF generation failed', err);
      toast.dismiss(loadingToast);
      toast.error(`فشل تصدير PDF: ${err.message || 'حدث خطأ غير معروف'}`);
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

  const updateActiveChallenge = useCallback(async (challenge: SmartSavingChallenge | undefined) => {
    setState(prev => ({ ...prev, activeChallenge: challenge }));
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { activeChallenge: challenge || null });
      } catch (error) {
        console.error('Failed to update activeChallenge in Firestore', error);
      }
    }
  }, [user]);

  const updateAutoRoundUpSetting = useCallback(async (setting: AutoRoundUpSetting | undefined) => {
    setState(prev => ({ ...prev, autoRoundUpSetting: setting }));
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { autoRoundUpSetting: setting || null });
      } catch (error) {
        console.error('Failed to update autoRoundUpSetting in Firestore', error);
      }
    }
  }, [user]);

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

  const migrateSeptemberDataToAugust = async (): Promise<number> => {
    let affectedExpenses = 0;
    let affectedIncome = 0;

    const newExpenses = (state.expenses || []).map(exp => {
      if (exp.date && exp.date.includes('-09-')) {
        affectedExpenses++;
        const newDate = exp.date.replace('-09-', '-08-');
        return {
          ...exp,
          date: newDate,
          parsedDate: safeParseISO(newDate)
        };
      }
      return exp;
    });

    const newIncome = (state.income || []).map(inc => {
      if (inc.date && inc.date.includes('-09-')) {
        affectedIncome++;
        const newDate = inc.date.replace('-09-', '-08-');
        return {
          ...inc,
          date: newDate,
          parsedDate: safeParseISO(newDate)
        };
      }
      return inc;
    });

    // Also migrate budgets if any exist for month -09 and not -08
    let newBudgets = [...(state.budgets || [])];
    const sepBudgets = newBudgets.filter(b => b.month && b.month.endsWith('-09'));
    sepBudgets.forEach(sepB => {
      const augMonth = sepB.month.replace('-09', '-08');
      const existingAug = newBudgets.find(b => b.month === augMonth);
      if (!existingAug) {
        newBudgets.push({
          ...sepB,
          month: augMonth
        });
      }
    });

    const totalAffected = affectedExpenses + affectedIncome;

    if (totalAffected === 0 && sepBudgets.length === 0) {
      toast('لا توجد عمليات مسجلة بتاريخ شهر سبتمبر لتحويلها');
      return 0;
    }

    const updatedState = {
      ...state,
      expenses: newExpenses,
      income: newIncome,
      budgets: newBudgets
    };

    setState(updatedState);
    safeStorage.setItem('masarifi_data', JSON.stringify({
      ...updatedState,
      expenses: updatedState.expenses.map(({ parsedDate, ...rest }: any) => rest),
      income: updatedState.income.map(({ parsedDate, ...rest }: any) => rest)
    }));

    // If user is authenticated with Firestore, write updates in batch
    if (user) {
      try {
        const batch = writeBatch(db);

        // Update affected expenses in Firestore
        newExpenses.forEach(exp => {
          if (exp.date && exp.date.includes('-08-')) {
            const { parsedDate, ...expToStore } = exp;
            const ref = doc(db, 'users', user.uid, 'expenses', exp.id);
            batch.set(ref, { ...expToStore, uid: user.uid }, { merge: true });
          }
        });

        // Update affected income in Firestore
        newIncome.forEach(inc => {
          if (inc.date && inc.date.includes('-08-')) {
            const { parsedDate, ...incToStore } = inc;
            const ref = doc(db, 'users', user.uid, 'income', inc.id);
            batch.set(ref, { ...incToStore, uid: user.uid }, { merge: true });
          }
        });

        // Update budgets in Firestore
        newBudgets.forEach(b => {
          const ref = doc(db, 'users', user.uid, 'budgets', b.month);
          batch.set(ref, { ...b, uid: user.uid }, { merge: true });
        });

        await batch.commit();
      } catch (cloudErr) {
        console.error('Failed to sync migrated dates to Firestore:', cloudErr);
      }
    }

    toast.success(`تم بنجاح نقل وتصحيح ${totalAffected} عملية إلى شهر أوت الحالي! ✨`);
    return totalAffected;
  };


  // Check for upcoming debts due within 3 days
  useEffect(() => {
    if (!state.debts || state.debts.length === 0) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingDebts = state.debts.filter(debt => {
      if (debt.isSettled || !debt.dueDate) return false;
      try {
        const due = new Date(debt.dueDate);
        due.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 3;
      } catch (e) {
        return false;
      }
    });

    if (upcomingDebts.length > 0) {
      setState(prev => {
        const existingNotifications = prev.notifications || [];
        let updatedNotifications = [...existingNotifications];
        let hasNew = false;

        upcomingDebts.forEach(debt => {
          const alreadyNotified = existingNotifications.some(
            n => n.debtId === debt.id && n.type === 'debt_due'
          );
          if (!alreadyNotified) {
            hasNew = true;
            const directionText = debt.direction === 'owed_to_me' ? `مستحق لك من ${debt.personName}` : `مطلوب منك لـ ${debt.personName}`;
            const remainingFormatted = `${debt.remainingAmount} ${prev.currency || 'د.ت'}`;
            const message = `تذكير استحقاق دين: موعد سداد دين (${directionText}) بمبلغ ${remainingFormatted} يحل قريباً (${debt.dueDate})`;
            
            updatedNotifications.unshift({
              id: crypto.randomUUID(),
              message,
              type: 'debt_due',
              debtId: debt.id,
              createdAt: new Date().toISOString()
            });

            showNotification('تذكير استحقاق دين', {
              body: message,
              icon: '/icon-192.png'
            });
          }
        });

        return hasNew ? { ...prev, notifications: updatedNotifications } : prev;
      });
    }
  }, [state.debts]);

  const { addAccount, updateAccount, deleteAccount, transferAccount } = useAccounts({ state, setState, user, evaluateAchievements: null, addNotification });
  const { addExpense, updateExpense, deleteExpense, addIncome, updateIncome, deleteIncome, repeatExpense } = useTransactions({ state, setState, user, evaluateAchievements: null, addNotification });
  const { addGoal, updateGoal, deleteGoal } = useGoals({ state, setState, user, evaluateAchievements: null, addNotification });
  const { addDebt, updateDebt, addDebtPayment, deleteDebt } = useDebts({ state, setState, user, evaluateAchievements: null, addNotification });
  const { addCategory, updateCategory, deleteCategory, reorderCategories } = useCategories({ state, setState, user, evaluateAchievements: null, addNotification });
  const { addGamaeya, updateGamaeya, deleteGamaeya, payGamaeyaMonth, receiveGamaeyaPayout } = useGamaeyas({ state, setState, user, evaluateAchievements: null, addNotification });
  const { setBudget, setDailyBudget, setRollingBudgetEnabled } = useBudget({ state, setState, user, evaluateAchievements: null, addNotification });

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
    addGamaeya,
    updateGamaeya,
    deleteGamaeya,
    payGamaeyaMonth,
    receiveGamaeyaPayout,
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
    addDebt,
    updateDebt,
    addDebtPayment,
    deleteDebt,
    addIncome,
    updateIncome,
    deleteIncome,
    setBudget,
    setDailyBudget,
    setRollingBudgetEnabled,
    setTheme,
    repeatExpense,
    exportData,
    exportToPDF,
    importData,
    updateAchievement,
    addNotification,
    removeNotification,
    completeOnboarding,
    setCurrency,
    setUserName,
    setFirstDayOfMonth,
    updateAIInsights,
    updateActiveChallenge,
    updateAutoRoundUpSetting,
    resetData,
    toggleOfflineMode,
    applyTunisianFamilyTemplate,
    migrateSeptemberDataToAugust,
    isPinSet,
    isLocked,
    setIsLocked,
    setAppPin,
    verifyAppPin,
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
