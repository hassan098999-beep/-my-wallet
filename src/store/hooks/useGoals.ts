import { Expense, Income, Goal, Account, Category, Gamaeya, Budget } from "../../types";
import { updateDoc, arrayUnion, doc, collection, writeBatch, setDoc, deleteDoc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { safeParseISO } from '../../utils';
import toast from 'react-hot-toast';

export function useGoals({ state, setState, user, evaluateAchievements, addNotification }: any) {
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
      setState((prev: any) => ({ ...prev, goals: [...(prev.goals || []), newGoal] }));
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
      setState((prev: any) => ({
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
      setState((prev: any) => ({
        ...prev,
        goals: (prev.goals || []).filter((g) => g.id !== id),
      }));
    }
  };

  return { addGoal, updateGoal, deleteGoal };
}
