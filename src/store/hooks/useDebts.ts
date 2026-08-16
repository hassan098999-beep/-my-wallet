import { Debt, DebtPayment } from "../../types";
import { updateDoc, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import toast from 'react-hot-toast';

export function useDebts({ state, setState, user }: any) {
  const addDebt = async (
    debt: Omit<Debt, 'id' | 'createdAt' | 'remainingAmount' | 'isSettled' | 'payments'> &
      Partial<Pick<Debt, 'remainingAmount' | 'isSettled' | 'payments'>>
  ) => {
    const totalAmount = Number(debt.totalAmount) || 0;
    const remainingAmount = debt.remainingAmount !== undefined ? Number(debt.remainingAmount) : totalAmount;
    const newDebt: Debt = {
      ...debt,
      id: crypto.randomUUID(),
      totalAmount,
      remainingAmount,
      isSettled: remainingAmount <= 0,
      payments: debt.payments || [],
      createdAt: new Date().toISOString(),
    };

    // 1. Optimistic local update
    setState((prev: any) => ({ ...prev, debts: [...(prev.debts || []), newDebt] }));

    toast.success(newDebt.direction === 'owed_to_me' ? 'تمت إضافة المبلغ المستحق لك بنجاح' : 'تمت إضافة الدين المطلوب منك بنجاح');

    // 2. Cloud update
    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'debts', newDebt.id), { ...newDebt, uid: user.uid });
      } catch (error) {
        console.warn('Debt saved locally (buffered for sync):', error);
      }
    }
  };

  const updateDebt = async (id: string, updates: Partial<Debt>) => {
    // 1. Optimistic local update
    setState((prev: any) => ({
      ...prev,
      debts: (prev.debts || []).map((d: Debt) => {
        if (d.id !== id) return d;
        const merged = { ...d, ...updates };
        if (updates.totalAmount !== undefined && updates.remainingAmount === undefined) {
          const totalPaid = (merged.payments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
          merged.remainingAmount = Math.max(0, (Number(updates.totalAmount) || 0) - totalPaid);
        }
        merged.isSettled = (merged.remainingAmount || 0) <= 0;
        return merged;
      }),
    }));

    toast.success('تم تعديل بيانات الدين بنجاح');

    // 2. Cloud update
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid, 'debts', id), updates);
      } catch (error) {
        console.warn('Debt updated locally (buffered for sync):', error);
      }
    }
  };

  const addDebtPayment = async (debtId: string, payment: Omit<DebtPayment, 'id'>) => {
    const list: Debt[] = state.debts || [];
    const existingDebt = list.find((d: Debt) => d.id === debtId);
    if (!existingDebt) return;

    const paymentAmount = Number(payment.amount) || 0;
    if (paymentAmount <= 0) {
      toast.error('يرجى إدخال مبلغ دفع صالح');
      return;
    }

    const newPayment: DebtPayment = {
      ...payment,
      id: crypto.randomUUID(),
      amount: paymentAmount,
      date: payment.date || new Date().toISOString().split('T')[0]
    };

    const newPayments = [...(existingDebt.payments || []), newPayment];
    const newRemainingAmount = Math.max(0, (existingDebt.remainingAmount || 0) - paymentAmount);
    const newIsSettled = newRemainingAmount <= 0;

    const updates: Partial<Debt> = {
      payments: newPayments,
      remainingAmount: newRemainingAmount,
      isSettled: newIsSettled
    };

    // 1. Optimistic local update
    setState((prev: any) => ({
      ...prev,
      debts: (prev.debts || []).map((d: Debt) => d.id === debtId ? { ...d, ...updates } : d)
    }));

    if (newIsSettled) {
      toast.success('🎉 تم تسديد الدين بالكامل بنجاح!');
    } else {
      toast.success(`تم تسجيل دفعة بقيمة ${paymentAmount} بنجاح`);
    }

    // 2. Cloud update
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid, 'debts', debtId), updates);
      } catch (error) {
        console.warn('Debt payment saved locally (buffered for sync):', error);
      }
    }
  };

  const deleteDebt = async (id: string) => {
    // 1. Optimistic local update
    setState((prev: any) => ({
      ...prev,
      debts: (prev.debts || []).filter((d: Debt) => d.id !== id),
    }));

    toast.success('تم حذف الدين بنجاح');

    // 2. Cloud update
    if (user) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'debts', id));
      } catch (error) {
        console.warn('Debt deleted locally (buffered for sync):', error);
      }
    }
  };

  return { addDebt, updateDebt, addDebtPayment, deleteDebt };
}
