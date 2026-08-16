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

    // 1. Optimistic local update
    setState((prev: any) => ({ ...prev, goals: [...(prev.goals || []), newGoal] }));

    // 2. Cloud update
    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'goals', newGoal.id), { ...newGoal, uid: user.uid });
      } catch (error) {
        console.warn('Goal saved locally (buffered for sync):', error);
      }
    }
  };

  const updateGoal = async (id: string, updates: Partial<Goal>) => {
    // 1. Optimistic local update
    setState((prev: any) => ({
      ...prev,
      goals: (prev.goals || []).map((g: any) => (g.id === id ? { ...g, ...updates } : g)),
    }));

    // 2. Cloud update
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid, 'goals', id), updates);
      } catch (error) {
        console.warn('Goal updated locally (buffered for sync):', error);
      }
    }
  };

  const deleteGoal = async (id: string) => {
    // 1. Optimistic local update
    setState((prev: any) => ({
      ...prev,
      goals: (prev.goals || []).filter((g: any) => g.id !== id),
    }));

    // 2. Cloud update
    if (user) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'goals', id));
      } catch (error) {
        console.warn('Goal deleted locally (buffered for sync):', error);
      }
    }
  };

  return { addGoal, updateGoal, deleteGoal };
}
