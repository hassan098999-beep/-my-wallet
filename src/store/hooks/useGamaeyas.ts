import { addMonths } from "date-fns";
import { Expense, Income, Goal, Account, Category, Gamaeya, Budget } from "../../types";
import { updateDoc, arrayUnion, doc, collection, writeBatch, setDoc, deleteDoc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { safeParseISO } from '../../utils';
import toast from 'react-hot-toast';

export function useGamaeyas({ state, setState, user, evaluateAchievements, addNotification }: any) {
  const addGamaeya = async (gamaeya: Omit<import('../../types').Gamaeya, 'id' | 'createdAt' | 'status' | 'payments'>) => {
    const payments: import('../../types').GamaeyaPayment[] = [];
    let baseDate: Date;
    try {
      baseDate = new Date(gamaeya.startDate + '-15');
    } catch (e) {
      baseDate = new Date();
    }
    for (let i = 1; i <= gamaeya.memberCount; i++) {
      const monthDate = addMonths(baseDate, i - 1);
      const year = monthDate.getFullYear();
      const month = String(monthDate.getMonth() + 1).padStart(2, '0');
      payments.push({
        monthIndex: i,
        date: `${year}-${month}`,
        paid: false,
        payoutReceived: false
      });
    }

    const newGamaeya: import('../../types').Gamaeya = {
      ...gamaeya,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      status: 'active',
      payments
    };

    // 1. Optimistic local update
    setState((prev: any) => ({ ...prev, gamaeyas: [...(prev.gamaeyas || []), newGamaeya] }));

    // 2. Cloud update
    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'gamaeyas', newGamaeya.id), { ...newGamaeya, uid: user.uid });
      } catch (error) {
        console.warn('Gamaeya saved locally (buffered for sync):', error);
      }
    }
  };

  const updateGamaeya = async (id: string, updates: Partial<import('../../types').Gamaeya>) => {
    // 1. Optimistic local update
    setState((prev: any) => ({
      ...prev,
      gamaeyas: (prev.gamaeyas || []).map((g: any) => (g.id === id ? { ...g, ...updates } : g)),
    }));

    // 2. Cloud update
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid, 'gamaeyas', id), updates);
      } catch (error) {
        console.warn('Gamaeya updated locally (buffered for sync):', error);
      }
    }
  };

  const deleteGamaeya = async (id: string) => {
    // 1. Optimistic local update
    setState((prev: any) => ({
      ...prev,
      gamaeyas: (prev.gamaeyas || []).filter((g: any) => g.id !== id),
    }));

    // 2. Cloud update
    if (user) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'gamaeyas', id));
      } catch (error) {
        console.warn('Gamaeya deleted locally (buffered for sync):', error);
      }
    }
  };

  const payGamaeyaMonth = async (gamaeyaId: string, monthIndex: number) => {
    const list = state.gamaeyas || [];
    const gamaeya = list.find((g: any) => g.id === gamaeyaId);
    if (!gamaeya) return;

    let createdExpenseId: string | undefined;
    const expenseAmount = gamaeya.monthlyAmount;

    const expenseId = crypto.randomUUID();
    createdExpenseId = expenseId;
    const paymentDate = new Date().toISOString().slice(0, 10);
    
    const newExpense: Expense = {
      id: expenseId,
      amount: expenseAmount,
      categoryId: '6',
      subcategoryId: 'أخرى وطارئة',
      accountId: gamaeya.accountId || 'cash',
      date: paymentDate,
      note: `دفع الجمعية: ${gamaeya.name} (شهر ${monthIndex})`,
      paymentMethod: 'cash',
      createdAt: new Date().toISOString(),
      parsedDate: safeParseISO(paymentDate)
    };

    // 1. Optimistic local update
    setState((prev: any) => {
      const updatedAccounts = (prev.accounts || []).map((acc: any) => {
        if (acc.id === (gamaeya.accountId || 'cash')) {
          return { ...acc, balance: acc.balance - expenseAmount };
        }
        return acc;
      });
      return {
        ...prev,
        expenses: [...(prev.expenses || []), newExpense],
        accounts: updatedAccounts
      };
    });
    toast.success('تم تسجيل دفعة الجمعية كمصروف بنجاح');

    // 2. Cloud update
    if (user) {
      try {
        const batch = writeBatch(db);
        const expenseRef = doc(db, 'users', user.uid, 'expenses', newExpense.id);
        const { parsedDate: _pd, ...expenseToStore } = newExpense;
        batch.set(expenseRef, { ...expenseToStore, uid: user.uid });

        if (newExpense.accountId) {
          const accRef = doc(db, 'users', user.uid, 'accounts', newExpense.accountId);
          const currentAcc = state.accounts?.find((a: any) => a.id === newExpense.accountId);
          if (currentAcc) {
            batch.update(accRef, { balance: currentAcc.balance - expenseAmount });
          }
        }
        await batch.commit();
      } catch (err) {
        console.warn('Gamaeya payment registered locally (buffered for sync):', err);
      }
    }

    const updatedPayments = (gamaeya.payments || []).map((p: any) => {
      if (p.monthIndex === monthIndex) {
        return { ...p, paid: true, expenseId: createdExpenseId };
      }
      return p;
    });

    const isAllPaid = updatedPayments.every((p: any) => p.paid);
    const updates: Partial<import('../../types').Gamaeya> = {
      payments: updatedPayments,
      status: isAllPaid ? 'completed' : gamaeya.status
    };

    await updateGamaeya(gamaeyaId, updates);
  };

  const receiveGamaeyaPayout = async (gamaeyaId: string) => {
    const list = state.gamaeyas || [];
    const gamaeya = list.find((g: any) => g.id === gamaeyaId);
    if (!gamaeya) return;

    let createdIncomeId: string | undefined;
    const payoutAmount = gamaeya.monthlyAmount * gamaeya.memberCount;

    const incomeId = crypto.randomUUID();
    createdIncomeId = incomeId;
    const incomeDate = new Date().toISOString().slice(0, 10);
    
    const newIncome: Income = {
      id: incomeId,
      amount: payoutAmount,
      accountId: gamaeya.accountId || 'cash',
      date: incomeDate,
      source: `قبض الجمعية: ${gamaeya.name}`,
      createdAt: new Date().toISOString(),
      parsedDate: safeParseISO(incomeDate)
    };

    // 1. Optimistic local update
    setState((prev: any) => {
      const updatedAccounts = (prev.accounts || []).map((acc: any) => {
        if (acc.id === (gamaeya.accountId || 'cash')) {
          return { ...acc, balance: acc.balance + payoutAmount };
        }
        return acc;
      });
      return {
        ...prev,
        income: [...(prev.income || []), newIncome],
        accounts: updatedAccounts
      };
    });
    toast.success('تم تسجيل قبض الجمعية كدخل بنجاح');

    // 2. Cloud update
    if (user) {
      try {
        const batch = writeBatch(db);
        const incomeRef = doc(db, 'users', user.uid, 'income', newIncome.id);
        const { parsedDate: _pd2, ...incomeToStore } = newIncome;
        batch.set(incomeRef, { ...incomeToStore, uid: user.uid });

        if (newIncome.accountId) {
          const accRef = doc(db, 'users', user.uid, 'accounts', newIncome.accountId);
          const currentAcc = state.accounts?.find((a: any) => a.id === newIncome.accountId);
          if (currentAcc) {
            batch.update(accRef, { balance: currentAcc.balance + payoutAmount });
          }
        }
        await batch.commit();
      } catch (err) {
        console.warn('Gamaeya payout registered locally (buffered for sync):', err);
      }
    }

    const updatedPayments = (gamaeya.payments || []).map((p: any) => {
      if (p.monthIndex === gamaeya.payoutMonth) {
        return { ...p, payoutReceived: true, incomeId: createdIncomeId };
      }
      return p;
    });

    const isAllPaid = updatedPayments.every((p: any) => p.paid);
    const updates: Partial<import('../../types').Gamaeya> = {
      payments: updatedPayments,
      status: isAllPaid ? 'completed' : gamaeya.status
    };

    await updateGamaeya(gamaeyaId, updates);
  };

  return { addGamaeya, updateGamaeya, deleteGamaeya, payGamaeyaMonth, receiveGamaeyaPayout };
}
