import { Expense, Income, Goal, Account, Category, Gamaeya, Budget } from "../../types";
import { updateDoc, arrayUnion, doc, collection, writeBatch, setDoc, deleteDoc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { safeParseISO } from '../../utils';
import toast from 'react-hot-toast';

export function useBudget({ state, setState, user, evaluateAchievements, addNotification }: any) {
  const setBudget = async (budget: Budget) => {
    // 1. Add or update the budget in local state immediately
    setState((prev: any) => {
      const newBudgets = [...(prev.budgets || [])];
      const existingIndex = newBudgets.findIndex(b => b.month === budget.month);
      if (existingIndex >= 0) {
        newBudgets[existingIndex] = budget;
      } else {
        newBudgets.push(budget);
      }
      return { ...prev, budgets: newBudgets };
    });

    // 2. Cloud update
    if (user) {
      try {
        const budgetRef = doc(collection(db, 'users', user.uid, 'budgets'), budget.month);
        await setDoc(budgetRef, { ...budget, uid: user.uid });
      } catch (error) {
        console.warn('Budget saved locally (buffered for sync):', error);
      }
    }
  };

  const setDailyBudget = async (amount: number) => {
    // 1. Update local state immediately
    setState((prev: any) => ({ ...prev, dailyBudget: amount }));
    
    // 2. Cloud update
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { dailyBudget: amount });
      } catch (error) {
        console.warn('Daily budget saved locally (buffered for sync):', error);
      }
    }
  };

  const setRollingBudgetEnabled = async (enabled: boolean) => {
    // 1. Update local state immediately
    setState((prev: any) => ({ ...prev, rollingBudgetEnabled: enabled }));

    // 2. Cloud update
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { rollingBudgetEnabled: enabled });
      } catch (error) {
        console.warn('Rolling budget setting saved locally (buffered for sync):', error);
      }
    }
  };

  return { setBudget, setDailyBudget, setRollingBudgetEnabled };
}
