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

    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'accounts', newAccount.id), { ...newAccount, uid: user.uid });
      } catch (error) {
        toast.error('فشل حفظ الحساب في السحاب');
      }
    } else {
      setState((prev: any) => ({ ...prev, accounts: [...(prev.accounts || []), newAccount] }));
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
      setState((prev: any) => ({
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
      setState((prev: any) => ({
        ...prev,
        accounts: (prev.accounts || []).filter((a) => a.id !== id),
      }));
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
      setState((prev: any) => {
        const newAccounts = prev.accounts.map((acc: any) => {
          if (acc.id === fromAccountId) return { ...acc, balance: acc.balance - amount };
          if (acc.id === toAccountId) return { ...acc, balance: acc.balance + amount };
          return acc;
        });
        return {
          ...prev,
          accounts: newAccounts,
          expenses: [{ ...expenseEntry, parsedDate: safeParseISO(expenseEntry.date) }, ...prev.expenses],
          income: [{ ...incomeEntry, parsedDate: safeParseISO(incomeEntry.date) }, ...prev.income]
        };
      });
    }
  };

  return { addAccount, updateAccount, deleteAccount, transferAccount };
}
