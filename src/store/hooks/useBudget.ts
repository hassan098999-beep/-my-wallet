import { Expense, Income, Goal, Account, Category, Gamaeya, Budget } from "../../types";
import { updateDoc, arrayUnion, doc, collection, writeBatch, setDoc, deleteDoc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { safeParseISO } from '../../utils';
import toast from 'react-hot-toast';

export function useBudget({ state, setState, user, evaluateAchievements, addNotification }: any) {
const setBudget = async (budget: Budget) => {
    if (user) {
      try {
        const budgetRef = doc(collection(db, 'users', user.uid, 'budgets'), 'current');
        await setDoc(budgetRef, { ...budget, uid: user.uid });
      } catch (error) {
        toast.error('فشل حفظ الميزانية في السحاب');
      }
    } else {
      setState((prev: any) => {
        return { ...prev, budget };
      });
    }
  };

const setDailyBudget = async (amount: number) => {
    // Update local state immediately for responsiveness
    setState((prev: any) => ({ ...prev, dailyBudget: amount }));
    
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
      setState((prev: any) => ({ ...prev, rollingBudgetEnabled: enabled }));
    }
  };

  return { setBudget, setDailyBudget, setRollingBudgetEnabled };
}
