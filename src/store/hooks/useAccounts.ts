import { Expense, Income, Goal, Account, Category, Gamaeya, Budget } from "../../types";
import { updateDoc, arrayUnion, doc, collection, writeBatch, setDoc, deleteDoc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { safeParseISO } from '../../utils';
import toast from 'react-hot-toast';

export function useAccounts({ state, setState, user, evaluateAchievements, addNotification }: any) {
  const addAccount = async (account: Omit<Account, 'id'>) => {
    const newAccount: Account = {
      ...account,
      id: crypto.randomUUID(),
    };

    // 1. Optimistic local update
    setState((prev: any) => ({ ...prev, accounts: [...(prev.accounts || []), newAccount] }));

    // 2. Cloud update
    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'accounts', newAccount.id), { ...newAccount, uid: user.uid });
      } catch (error) {
        console.warn('Account saved locally (buffered for sync):', error);
      }
    }
  };

  const updateAccount = async (id: string, updates: Partial<Account>) => {
    // 1. Optimistic local update
    setState((prev: any) => ({
      ...prev,
      accounts: (prev.accounts || []).map((a: any) => (a.id === id ? { ...a, ...updates } : a)),
    }));

    // 2. Cloud update
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid, 'accounts', id), updates);
      } catch (error) {
        console.warn('Account updated locally (buffered for sync):', error);
      }
    }
  };

  const deleteAccount = async (id: string) => {
    // 1. Optimistic local update
    setState((prev: any) => ({
      ...prev,
      accounts: (prev.accounts || []).filter((a: any) => a.id !== id),
    }));

    // 2. Cloud update
    if (user) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'accounts', id));
      } catch (error) {
        console.warn('Account deleted locally (buffered for sync):', error);
      }
    }
  };

  const transferAccount = async (fromAccountId: string, toAccountId: string, amount: number, transferDate?: string, transferNote?: string) => {
    const fromAcc = state.accounts.find((a: any) => a.id === fromAccountId);
    const toAcc = state.accounts.find((a: any) => a.id === toAccountId);

    if (!fromAcc || !toAcc || fromAcc.balance < amount) return;

    const date = transferDate || new Date().toISOString().split('T')[0];
    const transferId = crypto.randomUUID();

    const expenseEntry: Expense = {
      id: crypto.randomUUID(),
      amount,
      categoryId: '',
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

    // 1. Optimistic local update
    setState((prev: any) => {
      const newAccounts = (prev.accounts || []).map((acc: any) => {
        if (acc.id === fromAccountId) return { ...acc, balance: acc.balance - amount };
        if (acc.id === toAccountId) return { ...acc, balance: acc.balance + amount };
        return acc;
      });
      return {
        ...prev,
        accounts: newAccounts,
        expenses: [{ ...expenseEntry, parsedDate: safeParseISO(expenseEntry.date) }, ...(prev.expenses || [])],
        income: [{ ...incomeEntry, parsedDate: safeParseISO(incomeEntry.date) }, ...(prev.income || [])]
      };
    });

    toast.success('تم التحويل بنجاح');

    // 2. Cloud update
    if (user) {
      try {
        const batch = writeBatch(db);
        const fromAccRef = doc(db, 'users', user.uid, 'accounts', fromAccountId);
        const toAccRef = doc(db, 'users', user.uid, 'accounts', toAccountId);

        batch.update(fromAccRef, { balance: fromAcc.balance - amount });
        batch.update(toAccRef, { balance: toAcc.balance + amount });

        const { parsedDate: _pd1, ...expToStore } = expenseEntry;
        const { parsedDate: _pd2, ...incToStore } = incomeEntry;

        batch.set(doc(db, 'users', user.uid, 'expenses', expenseEntry.id), { ...expToStore, uid: user.uid });
        batch.set(doc(db, 'users', user.uid, 'income', incomeEntry.id), { ...incToStore, uid: user.uid });

        await batch.commit();
      } catch (error) {
        console.warn('Transfer saved locally (buffered for sync):', error);
      }
    }
  };

  return { addAccount, updateAccount, deleteAccount, transferAccount };
}
