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
    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'categories', newCategory.id), { ...newCategory, uid: user.uid });
      } catch (error) {
        toast.error('فشل حفظ الفئة في السحاب');
      }
    } else {
      setState((prev: any) => {
        return { ...prev, categories: [...prev.categories, newCategory] };
      });
    }
    return newCategory;
  };

const updateCategory = async (id: string, updates: Partial<Category>) => {
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid, 'categories', id), updates);
      } catch (error) {
        toast.error('فشل تحديث الفئة في السحاب');
      }
    } else {
      setState((prev: any) => ({
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
      setState((prev: any) => ({
        ...prev,
        categories: prev.categories.filter((c) => c.id !== id),
        expenses: prev.expenses.map((e: any) => e.categoryId === id ? { ...e, categoryId: '6' } : e),
        recurringExpenses: prev.recurringExpenses.map((re: any) => re.categoryId === id ? { ...re, categoryId: '6' } : re)
      }));
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
        console.error('Failed to sync category order to Firestore', error);
      }
    }
  };

  return { addCategory, updateCategory, deleteCategory, reorderCategories };
}
