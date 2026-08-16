import { Expense, Income, Goal, Account, Category, Gamaeya, Budget } from "../../types";
import { updateDoc, arrayUnion, doc, collection, writeBatch, setDoc, deleteDoc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { safeParseISO } from '../../utils';
import toast from 'react-hot-toast';

export function useCategories({ state, setState, user, evaluateAchievements, addNotification }: any) {
  const addCategory = async (category: Omit<Category, 'id'>) => {
    const newCategory: Category = {
      ...category,
      id: crypto.randomUUID(),
    };
    
    // 1. Optimistic local update
    setState((prev: any) => {
      return { ...prev, categories: [...(prev.categories || []), newCategory] };
    });

    // 2. Cloud update
    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'categories', newCategory.id), { ...newCategory, uid: user.uid });
      } catch (error) {
        console.warn('Category saved locally (buffered for sync):', error);
      }
    }
    return newCategory;
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    // 1. Optimistic local update
    setState((prev: any) => ({
      ...prev,
      categories: (prev.categories || []).map((c: any) => (c.id === id ? { ...c, ...updates } : c)),
    }));

    // 2. Cloud update
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid, 'categories', id), updates);
      } catch (error) {
        console.warn('Category updated locally (buffered for sync):', error);
      }
    }
  };

  const deleteCategory = async (id: string) => {
    // 1. Optimistic local update
    setState((prev: any) => ({
      ...prev,
      categories: (prev.categories || []).filter((c: any) => c.id !== id),
      expenses: (prev.expenses || []).map((e: any) => e.categoryId === id ? { ...e, categoryId: '6' } : e),
      recurringExpenses: (prev.recurringExpenses || []).map((re: any) => re.categoryId === id ? { ...re, categoryId: '6' } : re)
    }));

    // 2. Cloud update
    if (user) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'categories', id));
      } catch (error) {
        console.warn('Category deleted locally (buffered for sync):', error);
      }
    }
  };

  const reorderCategories = async (categories: Category[]) => {
    setState((prev: any) => ({ ...prev, categories }));

    if (user) {
      try {
        const batch = writeBatch(db);
        categories.forEach((cat, index) => {
          const ref = doc(db, 'users', user.uid, 'categories', cat.id);
          batch.update(ref, { order: index });
        });
        await batch.commit();
      } catch (error) {
        console.warn('Category order saved locally (buffered for sync):', error);
      }
    }
  };

  return { addCategory, updateCategory, deleteCategory, reorderCategories };
}
