import { getBudgetMonth } from "../../utils";
import { Expense, Income, Goal, Account, Category, Gamaeya, Budget } from "../../types";
import { updateDoc, arrayUnion, doc, collection, writeBatch, setDoc, deleteDoc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { safeParseISO } from '../../utils';
import toast from 'react-hot-toast';

export function useTransactions({ state, setState, user, evaluateAchievements, addNotification }: any) {
const addExpense = async (expense: Omit<Expense, 'id' | 'createdAt'>) => {
    const newExpense: Expense = {
      ...expense,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      parsedDate: safeParseISO(expense.date),
    };

    // Calculate round-up if enabled
    let roundUpExpense: Expense | null = null;
    const autoRoundUp = state.autoRoundUpSetting;
    if (autoRoundUp?.enabled && autoRoundUp?.targetGoalId && !expense.isTransfer) {
      const multiplier = autoRoundUp.multiplier || 1;
      const remainder = newExpense.amount % multiplier;
      if (remainder > 0) {
        const fakka = Number((multiplier - remainder).toFixed(3));
        if (fakka > 0) {
          const savingCategory = state.categories.find((c: any) => c.type === 'saving') || 
                                 state.categories.find((c: any) => c.name.includes('ادخار')) || 
                                 { id: newExpense.categoryId };
          roundUpExpense = {
            id: crypto.randomUUID(),
            amount: fakka,
            categoryId: savingCategory.id,
            accountId: newExpense.accountId,
            goalId: autoRoundUp.targetGoalId,
            date: newExpense.date,
            createdAt: new Date().toISOString(),
            parsedDate: safeParseISO(newExpense.date),
            note: `حصالة التوفير التلقائي: فكة معاملة (${newExpense.note || 'مصروف'})`,
            paymentMethod: newExpense.paymentMethod,
            isTransfer: true
          };
        }
      }
    }

    if (user) {
      const batch = writeBatch(db);
      const expenseRef = doc(db, 'users', user.uid, 'expenses', newExpense.id);
      const { parsedDate: _pd, ...expenseToStore } = newExpense;
      batch.set(expenseRef, { ...expenseToStore, uid: user.uid });

      // Update account balance for actual expense
      if (newExpense.accountId) {
        const accRef = doc(db, 'users', user.uid, 'accounts', newExpense.accountId);
        const accDoc = await getDoc(accRef);
        if (accDoc.exists()) {
          let newBalance = accDoc.data().balance - newExpense.amount;
          if (roundUpExpense) {
            newBalance -= roundUpExpense.amount;
          }
          batch.update(accRef, { balance: newBalance });
        }
      }

      // Update linked goal progress
      if (newExpense.goalId) {
        const goalRef = doc(db, 'users', user.uid, 'goals', newExpense.goalId);
        const goalDoc = await getDoc(goalRef);
        if (goalDoc.exists()) {
          batch.update(goalRef, { currentAmount: goalDoc.data().currentAmount + newExpense.amount });
        }
      }

      // If roundUpExpense is created, save it and update its target goal!
      if (roundUpExpense) {
        const roundUpRef = doc(db, 'users', user.uid, 'expenses', roundUpExpense.id);
        const { parsedDate: _pdRu, ...ruToStore } = roundUpExpense;
        batch.set(roundUpRef, { ...ruToStore, uid: user.uid });

        // Update target goal progress
        const targetGoalRef = doc(db, 'users', user.uid, 'goals', roundUpExpense.goalId!);
        const targetGoalDoc = await getDoc(targetGoalRef);
        if (targetGoalDoc.exists()) {
          batch.update(targetGoalRef, { currentAmount: targetGoalDoc.data().currentAmount + roundUpExpense.amount });
        }
      }

      try {
        await batch.commit();

        // Logic for budget alerts (User branch)
        const currentMonth = getBudgetMonth(new Date(), state.firstDayOfMonth);
        const currentBudget = state.budgets?.find((b: any) => b.month === currentMonth);
        const monthlyExpenses = state.expenses.filter((e: any) => e.date.startsWith(currentMonth));
        const totalSpent = monthlyExpenses.reduce((sum: any, e: any) => sum + e.amount, 0) + newExpense.amount;
        const budgetAmount = currentBudget?.amount || 0;

        if (budgetAmount > 0) {
          if (totalSpent > budgetAmount && totalSpent - newExpense.amount <= budgetAmount) {
            addNotification("تنبيه: لقد تجاوزت ميزانيتك الشهرية!", 'budget');
          } else if (totalSpent > budgetAmount * 0.8 && totalSpent - newExpense.amount <= budgetAmount * 0.8) {
            addNotification("تنبيه: لقد قاربت على تجاوز ميزانيتك الشهرية!", 'budget');
          }
        }

        // Category budget alerts (User branch)
        if (currentBudget?.categoryBudgets?.[newExpense.categoryId]) {
          const catBudget = currentBudget.categoryBudgets[newExpense.categoryId];
          const catSpent = monthlyExpenses.filter((e: any) => e.categoryId === newExpense.categoryId).reduce((sum: any, e: any) => sum + e.amount, 0) + newExpense.amount;
          const categoryName = state.categories.find((c: any) => c.id === newExpense.categoryId)?.name || 'هذه الفئة';

          if (catSpent > catBudget && catSpent - newExpense.amount <= catBudget) {
            addNotification(`تنبيه: لقد تجاوزت ميزانية فئة ${categoryName}!`, 'budget');
          } else if (catSpent > catBudget * 0.8 && catSpent - newExpense.amount <= catBudget * 0.8) {
            addNotification(`تنبيه: لقد قاربت على تجاوز ميزانية فئة ${categoryName}!`, 'budget');
          }
        }
      } catch (error) {
        toast.error('فشل حفظ المصروف في السحاب');
      }
    } else {
      setState((prev: any) => {
        let newState = { ...prev, expenses: [newExpense, ...prev.expenses] };
        if (roundUpExpense) {
          newState.expenses = [roundUpExpense, ...newState.expenses];
        }
        let newNotifications = [...(prev.notifications || [])];

        // Update account balance
        if (newExpense.accountId) {
          newState.accounts = (newState.accounts || []).map((acc: any) => {
            if (acc.id === newExpense.accountId) {
              let balanceDiff = newExpense.amount;
              if (roundUpExpense) balanceDiff += roundUpExpense.amount;
              return { ...acc, balance: acc.balance - balanceDiff };
            }
            return acc;
          });
        }

        // Update linked goal progress
        if (newExpense.goalId) {
          newState.goals = (newState.goals || []).map((goal: any) => 
            goal.id === newExpense.goalId ? { ...goal, currentAmount: goal.currentAmount + newExpense.amount } : goal
          );
        }

        // Update round-up target goal progress
        if (roundUpExpense && roundUpExpense.goalId) {
          newState.goals = (newState.goals || []).map((goal: any) => 
            goal.id === roundUpExpense.goalId ? { ...goal, currentAmount: goal.currentAmount + roundUpExpense.amount } : goal
          );
        }
        
        // Logic for budget alerts
        const currentMonth = getBudgetMonth(new Date(), newState.firstDayOfMonth);
        const currentBudget = newState.budgets?.find((b: any) => b.month === currentMonth);
        const monthlyExpenses = newState.expenses.filter((e: any) => e.date.startsWith(currentMonth));
        const totalSpent = monthlyExpenses.reduce((sum: any, e: any) => sum + e.amount, 0);
        const budgetAmount = currentBudget?.amount || 0;
        
        const sendPushNotification = (title: string, body: string) => {
          addNotification(title, { body, icon: '/icon-192.png' });
        };

        if (budgetAmount > 0) {
          if (totalSpent > budgetAmount && totalSpent - newExpense.amount <= budgetAmount) {
            const msg = "تنبيه: لقد تجاوزت ميزانيتك الشهرية!";
            newNotifications.push({ id: crypto.randomUUID(), message: msg, type: 'budget', createdAt: new Date().toISOString() });
            sendPushNotification("تنبيه الميزانية", msg);
          } else if (totalSpent > budgetAmount * 0.8 && totalSpent - newExpense.amount <= budgetAmount * 0.8) {
            const msg = "تنبيه: لقد قاربت على تجاوز ميزانيتك الشهرية!";
            newNotifications.push({ id: crypto.randomUUID(), message: msg, type: 'budget', createdAt: new Date().toISOString() });
            sendPushNotification("تنبيه الميزانية", msg);
          }
        }

        // Category budget alerts
        if (currentBudget?.categoryBudgets?.[newExpense.categoryId]) {
          const catBudget = currentBudget.categoryBudgets[newExpense.categoryId];
          const catSpent = monthlyExpenses.filter((e: any) => e.categoryId === newExpense.categoryId).reduce((sum: any, e: any) => sum + e.amount, 0);
          const categoryName = newState.categories.find((c: any) => c.id === newExpense.categoryId)?.name || 'هذه الفئة';

          if (catSpent > catBudget && catSpent - newExpense.amount <= catBudget) {
            const msg = `تنبيه: لقد تجاوزت ميزانية فئة ${categoryName}!`;
            newNotifications.push({ id: crypto.randomUUID(), message: msg, type: 'budget', createdAt: new Date().toISOString() });
            sendPushNotification("تنبيه الميزانية", msg);
          } else if (catSpent > catBudget * 0.8 && catSpent - newExpense.amount <= catBudget * 0.8) {
            const msg = `تنبيه: لقد قاربت على تجاوز ميزانية فئة ${categoryName}!`;
            newNotifications.push({ id: crypto.randomUUID(), message: msg, type: 'budget', createdAt: new Date().toISOString() });
            sendPushNotification("تنبيه الميزانية", msg);
          }
        }

        // Logic for unusual expense
        const avg = prev.expenses.reduce((sum: any, e: any) => sum + e.amount, 0) / (prev.expenses.length || 1);
        if (newExpense.amount > avg * 3) {
          newNotifications.push({ id: crypto.randomUUID(), message: "تنبيه: مصروف غير معتاد!", type: 'unusual_expense', createdAt: new Date().toISOString() });
        }

        return { ...newState, notifications: newNotifications };
      });
    }
  };

const updateExpense = async (id: string, updates: Partial<Expense>) => {
    if (user) {
      try {
        const batch = writeBatch(db);
        const expenseRef = doc(db, 'users', user.uid, 'expenses', id);
        const oldDoc = await getDoc(expenseRef);
        if (!oldDoc.exists()) return;
        const oldExpense = oldDoc.data() as Expense;
        const newExpense = { ...oldExpense, ...updates };

        batch.update(expenseRef, updates);

        // Update account balance
        if (oldExpense.accountId !== newExpense.accountId) {
          if (oldExpense.accountId) {
            const oldAccRef = doc(db, 'users', user.uid, 'accounts', oldExpense.accountId);
            const oldAccDoc = await getDoc(oldAccRef);
            if (oldAccDoc.exists()) batch.update(oldAccRef, { balance: oldAccDoc.data().balance + oldExpense.amount });
          }
          if (newExpense.accountId) {
            const newAccRef = doc(db, 'users', user.uid, 'accounts', newExpense.accountId);
            const newAccDoc = await getDoc(newAccRef);
            if (newAccDoc.exists()) batch.update(newAccRef, { balance: newAccDoc.data().balance - newExpense.amount });
          }
        } else if (oldExpense.accountId && oldExpense.amount !== newExpense.amount) {
          const diff = newExpense.amount - oldExpense.amount;
          const accRef = doc(db, 'users', user.uid, 'accounts', oldExpense.accountId);
          const accDoc = await getDoc(accRef);
          if (accDoc.exists()) batch.update(accRef, { balance: accDoc.data().balance - diff });
        }

        // Update linked goal progress
        if (oldExpense.goalId !== newExpense.goalId) {
          if (oldExpense.goalId) {
            const oldGoalRef = doc(db, 'users', user.uid, 'goals', oldExpense.goalId);
            const oldGoalDoc = await getDoc(oldGoalRef);
            if (oldGoalDoc.exists()) batch.update(oldGoalRef, { currentAmount: oldGoalDoc.data().currentAmount - oldExpense.amount });
          }
          if (newExpense.goalId) {
            const newGoalRef = doc(db, 'users', user.uid, 'goals', newExpense.goalId);
            const newGoalDoc = await getDoc(newGoalRef);
            if (newGoalDoc.exists()) batch.update(newGoalRef, { currentAmount: newGoalDoc.data().currentAmount + newExpense.amount });
          }
        } else if (oldExpense.goalId && oldExpense.amount !== newExpense.amount) {
          const diff = newExpense.amount - oldExpense.amount;
          const goalRef = doc(db, 'users', user.uid, 'goals', oldExpense.goalId);
          const goalDoc = await getDoc(goalRef);
          if (goalDoc.exists()) batch.update(goalRef, { currentAmount: goalDoc.data().currentAmount + diff });
        }

        await batch.commit();
      } catch (error) {
        toast.error('فشل تحديث المصروف في السحاب');
      }
    } else {
      setState((prev: any) => {
        const oldExpense = prev.expenses.find((e: any) => e.id === id);
        if (!oldExpense) return prev;
        
        const newExpense = { ...oldExpense, ...updates, parsedDate: updates.date ? safeParseISO(updates.date) : oldExpense.parsedDate };
        let newAccounts = [...(prev.accounts || [])];
        
        if (oldExpense.accountId !== newExpense.accountId) {
          if (oldExpense.accountId) {
            newAccounts = newAccounts.map((acc: any) => acc.id === oldExpense.accountId ? { ...acc, balance: acc.balance + oldExpense.amount } : acc);
          }
          if (newExpense.accountId) {
            newAccounts = newAccounts.map((acc: any) => acc.id === newExpense.accountId ? { ...acc, balance: acc.balance - newExpense.amount } : acc);
          }
        } else if (oldExpense.accountId && oldExpense.amount !== newExpense.amount) {
          const diff = newExpense.amount - oldExpense.amount;
          newAccounts = newAccounts.map((acc: any) => acc.id === oldExpense.accountId ? { ...acc, balance: acc.balance - diff } : acc);
        }

        let newGoals = [...(prev.goals || [])];
        if (oldExpense.goalId !== newExpense.goalId) {
          if (oldExpense.goalId) {
            newGoals = newGoals.map((goal: any) => goal.id === oldExpense.goalId ? { ...goal, currentAmount: goal.currentAmount - oldExpense.amount } : goal);
          }
          if (newExpense.goalId) {
            newGoals = newGoals.map((goal: any) => goal.id === newExpense.goalId ? { ...goal, currentAmount: goal.currentAmount + newExpense.amount } : goal);
          }
        } else if (oldExpense.goalId && oldExpense.amount !== newExpense.amount) {
          const diff = newExpense.amount - oldExpense.amount;
          newGoals = newGoals.map((goal: any) => goal.id === oldExpense.goalId ? { ...goal, currentAmount: goal.currentAmount + diff } : goal);
        }

        return {
          ...prev,
          expenses: prev.expenses.map((e) => (e.id === id ? newExpense : e)),
          accounts: newAccounts,
          goals: newGoals
        };
      });
    }
  };

const deleteExpense = async (id: string) => {
    if (user) {
      try {
        const batch = writeBatch(db);
        const expenseRef = doc(db, 'users', user.uid, 'expenses', id);
        const docSnap = await getDoc(expenseRef);
        if (!docSnap.exists()) return;
        const expense = docSnap.data() as Expense;

        batch.delete(expenseRef);

        if (expense.accountId) {
          const accRef = doc(db, 'users', user.uid, 'accounts', expense.accountId);
          const accDoc = await getDoc(accRef);
          if (accDoc.exists()) batch.update(accRef, { balance: accDoc.data().balance + expense.amount });
        }

        if (expense.goalId) {
          const goalRef = doc(db, 'users', user.uid, 'goals', expense.goalId);
          const goalDoc = await getDoc(goalRef);
          if (goalDoc.exists()) batch.update(goalRef, { currentAmount: goalDoc.data().currentAmount - expense.amount });
        }

        if (expense.isTransfer && expense.transferId) {
          const incomesRef = collection(db, 'users', user.uid, 'income');
          const q = query(incomesRef, where('transferId', '==', expense.transferId));
          const querySnapshot = await getDocs(q);
          for (const incDoc of querySnapshot.docs) {
            const income = incDoc.data() as Income;
            batch.delete(incDoc.ref);
            if (income.accountId) {
              const accRef = doc(db, 'users', user.uid, 'accounts', income.accountId);
              const accDoc = await getDoc(accRef);
              if (accDoc.exists()) batch.update(accRef, { balance: accDoc.data().balance - income.amount });
            }
          }
        }

        await batch.commit();
      } catch (error) {
        toast.error('فشل حذف المصروف من السحاب');
      }
    } else {
      setState((prev: any) => {
        const expense = prev.expenses.find((e: any) => e.id === id);
        if (!expense) return prev;
        
        let newAccounts = [...(prev.accounts || [])];
        if (expense.accountId) {
          newAccounts = newAccounts.map((acc: any) => acc.id === expense.accountId ? { ...acc, balance: acc.balance + expense.amount } : acc);
        }

        let newGoals = [...(prev.goals || [])];
        if (expense.goalId) {
          newGoals = newGoals.map((goal: any) => goal.id === expense.goalId ? { ...goal, currentAmount: goal.currentAmount - expense.amount } : goal);
        }

        let newIncome = [...(prev.income || [])];
        if (expense.isTransfer && expense.transferId) {
          const relatedIncome = newIncome.find((i: any) => i.transferId === expense.transferId);
          if (relatedIncome) {
            newIncome = newIncome.filter((i: any) => i.id !== relatedIncome.id);
            if (relatedIncome.accountId) {
              newAccounts = newAccounts.map((a: any) => 
                a.id === relatedIncome.accountId ? { ...a, balance: a.balance - relatedIncome.amount } : a
              );
            }
          }
        }

        return {
          ...prev,
          expenses: prev.expenses.filter((e) => e.id !== id),
          accounts: newAccounts,
          goals: newGoals,
          income: newIncome
        };
      });
    }
  };

const addIncome = async (income: Omit<Income, 'id' | 'createdAt'>) => {
    const newIncome: Income = {
      ...income,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      parsedDate: safeParseISO(income.date),
    };

    if (user) {
      const batch = writeBatch(db);
      const incomeRef = doc(db, 'users', user.uid, 'income', newIncome.id);
      const { parsedDate: _pd2, ...incomeToStore } = newIncome;
      batch.set(incomeRef, { ...incomeToStore, uid: user.uid });

      if (newIncome.accountId) {
        const accRef = doc(db, 'users', user.uid, 'accounts', newIncome.accountId);
        const accDoc = await getDoc(accRef);
        if (accDoc.exists()) batch.update(accRef, { balance: accDoc.data().balance + newIncome.amount });
      }

      if (newIncome.goalId) {
        const goalRef = doc(db, 'users', user.uid, 'goals', newIncome.goalId);
        const goalDoc = await getDoc(goalRef);
        if (goalDoc.exists()) batch.update(goalRef, { currentAmount: goalDoc.data().currentAmount + newIncome.amount });
      }

      try {
        await batch.commit();
      } catch (error) {
        toast.error('فشل حفظ الدخل في السحاب');
      }
    } else {
      setState((prev: any) => {
        let newAccounts = [...(prev.accounts || [])];
        if (newIncome.accountId) {
          newAccounts = newAccounts.map((acc: any) => 
            acc.id === newIncome.accountId ? { ...acc, balance: acc.balance + newIncome.amount } : acc
          );
        }

        let newGoals = [...(prev.goals || [])];
        if (newIncome.goalId) {
          newGoals = newGoals.map((goal: any) => 
            goal.id === newIncome.goalId ? { ...goal, currentAmount: goal.currentAmount + newIncome.amount } : goal
          );
        }

        return { ...prev, income: [...(prev.income || []), newIncome], accounts: newAccounts, goals: newGoals };
      });
    }
  };

const updateIncome = async (id: string, updates: Partial<Income>) => {
    if (user) {
      try {
        const batch = writeBatch(db);
        const incomeRef = doc(db, 'users', user.uid, 'income', id);
        const oldDoc = await getDoc(incomeRef);
        if (!oldDoc.exists()) return;
        const oldIncome = oldDoc.data() as Income;
        const newIncome = { ...oldIncome, ...updates };

        batch.update(incomeRef, updates);

        if (oldIncome.accountId !== newIncome.accountId) {
          if (oldIncome.accountId) {
            const oldAccRef = doc(db, 'users', user.uid, 'accounts', oldIncome.accountId);
            const oldAccDoc = await getDoc(oldAccRef);
            if (oldAccDoc.exists()) batch.update(oldAccRef, { balance: oldAccDoc.data().balance - oldIncome.amount });
          }
          if (newIncome.accountId) {
            const newAccRef = doc(db, 'users', user.uid, 'accounts', newIncome.accountId);
            const newAccDoc = await getDoc(newAccRef);
            if (newAccDoc.exists()) batch.update(newAccRef, { balance: newAccDoc.data().balance + newIncome.amount });
          }
        } else if (oldIncome.accountId && oldIncome.amount !== newIncome.amount) {
          const diff = newIncome.amount - oldIncome.amount;
          const accRef = doc(db, 'users', user.uid, 'accounts', oldIncome.accountId);
          const accDoc = await getDoc(accRef);
          if (accDoc.exists()) batch.update(accRef, { balance: accDoc.data().balance + diff });
        }

        // Update linked goal progress
        if (oldIncome.goalId !== newIncome.goalId) {
          if (oldIncome.goalId) {
            const oldGoalRef = doc(db, 'users', user.uid, 'goals', oldIncome.goalId);
            const oldGoalDoc = await getDoc(oldGoalRef);
            if (oldGoalDoc.exists()) batch.update(oldGoalRef, { currentAmount: oldGoalDoc.data().currentAmount - oldIncome.amount });
          }
          if (newIncome.goalId) {
            const newGoalRef = doc(db, 'users', user.uid, 'goals', newIncome.goalId);
            const newGoalDoc = await getDoc(newGoalRef);
            if (newGoalDoc.exists()) batch.update(newGoalRef, { currentAmount: newGoalDoc.data().currentAmount + newIncome.amount });
          }
        } else if (oldIncome.goalId && oldIncome.amount !== newIncome.amount) {
          const diff = newIncome.amount - oldIncome.amount;
          const goalRef = doc(db, 'users', user.uid, 'goals', oldIncome.goalId);
          const goalDoc = await getDoc(goalRef);
          if (goalDoc.exists()) batch.update(goalRef, { currentAmount: goalDoc.data().currentAmount + diff });
        }

        await batch.commit();
      } catch (error) {
        toast.error('فشل تحديث الدخل في السحاب');
      }
    } else {
      setState((prev: any) => {
        const oldIncome = (prev.income || []).find((i: any) => i.id === id);
        if (!oldIncome) return prev;
        
        const newIncome = { ...oldIncome, ...updates, parsedDate: updates.date ? safeParseISO(updates.date) : oldIncome.parsedDate };
        let newAccounts = [...(prev.accounts || [])];
        
        if (oldIncome.accountId !== newIncome.accountId) {
          if (oldIncome.accountId) {
            newAccounts = newAccounts.map((acc: any) => acc.id === oldIncome.accountId ? { ...acc, balance: acc.balance - oldIncome.amount } : acc);
          }
          if (newIncome.accountId) {
            newAccounts = newAccounts.map((acc: any) => acc.id === newIncome.accountId ? { ...acc, balance: acc.balance + newIncome.amount } : acc);
          }
        } else if (oldIncome.accountId && oldIncome.amount !== newIncome.amount) {
          const diff = newIncome.amount - oldIncome.amount;
          newAccounts = newAccounts.map((acc: any) => acc.id === oldIncome.accountId ? { ...acc, balance: acc.balance + diff } : acc);
        }

        let newGoals = [...(prev.goals || [])];
        if (oldIncome.goalId !== newIncome.goalId) {
          if (oldIncome.goalId) {
            newGoals = newGoals.map((goal: any) => goal.id === oldIncome.goalId ? { ...goal, currentAmount: goal.currentAmount - oldIncome.amount } : goal);
          }
          if (newIncome.goalId) {
            newGoals = newGoals.map((goal: any) => goal.id === newIncome.goalId ? { ...goal, currentAmount: goal.currentAmount + newIncome.amount } : goal);
          }
        } else if (oldIncome.goalId && oldIncome.amount !== newIncome.amount) {
          const diff = newIncome.amount - oldIncome.amount;
          newGoals = newGoals.map((goal: any) => goal.id === oldIncome.goalId ? { ...goal, currentAmount: goal.currentAmount + diff } : goal);
        }

        return {
          ...prev,
          income: (prev.income || []).map((i) => (i.id === id ? newIncome : i)),
          accounts: newAccounts,
          goals: newGoals
        };
      });
    }
  };

const deleteIncome = async (id: string) => {
    if (user) {
      try {
        const batch = writeBatch(db);
        const incomeRef = doc(db, 'users', user.uid, 'income', id);
        const docSnap = await getDoc(incomeRef);
        if (!docSnap.exists()) return;
        const income = docSnap.data() as Income;

        batch.delete(incomeRef);

        if (income.accountId) {
          const accRef = doc(db, 'users', user.uid, 'accounts', income.accountId);
          const accDoc = await getDoc(accRef);
          if (accDoc.exists()) batch.update(accRef, { balance: accDoc.data().balance - income.amount });
        }

        if (income.goalId) {
          const goalRef = doc(db, 'users', user.uid, 'goals', income.goalId);
          const goalDoc = await getDoc(goalRef);
          if (goalDoc.exists()) batch.update(goalRef, { currentAmount: goalDoc.data().currentAmount - income.amount });
        }

        if (income.isTransfer && income.transferId) {
          const expensesRef = collection(db, 'users', user.uid, 'expenses');
          const q = query(expensesRef, where('transferId', '==', income.transferId));
          const querySnapshot = await getDocs(q);
          for (const expDoc of querySnapshot.docs) {
            const expense = expDoc.data() as Expense;
            batch.delete(expDoc.ref);
            if (expense.accountId) {
              const accRef = doc(db, 'users', user.uid, 'accounts', expense.accountId);
              const accDoc = await getDoc(accRef);
              if (accDoc.exists()) batch.update(accRef, { balance: accDoc.data().balance + expense.amount });
            }
          }
        }

        await batch.commit();
      } catch (error) {
        toast.error('فشل حذف الدخل من السحاب');
      }
    } else {
      setState((prev: any) => {
        const income = (prev.income || []).find((i: any) => i.id === id);
        if (!income) return prev;
        
        let newAccounts = [...(prev.accounts || [])];
        if (income.accountId) {
          newAccounts = newAccounts.map((acc: any) => acc.id === income.accountId ? { ...acc, balance: acc.balance - income.amount } : acc);
        }

        let newGoals = [...(prev.goals || [])];
        if (income.goalId) {
          newGoals = newGoals.map((goal: any) => goal.id === income.goalId ? { ...goal, currentAmount: goal.currentAmount - income.amount } : goal);
        }

        let newExpenses = [...(prev.expenses || [])];
        if (income.isTransfer && income.transferId) {
          const relatedExpense = newExpenses.find((e: any) => e.transferId === income.transferId);
          if (relatedExpense) {
            newExpenses = newExpenses.filter((e: any) => e.id !== relatedExpense.id);
            if (relatedExpense.accountId) {
              newAccounts = newAccounts.map((a: any) => 
                a.id === relatedExpense.accountId ? { ...a, balance: a.balance + relatedExpense.amount } : a
              );
            }
          }
        }

        return {
          ...prev,
          income: (prev.income || []).filter((i) => i.id !== id),
          accounts: newAccounts,
          goals: newGoals,
          expenses: newExpenses
        };
      });
    }
  };

const repeatExpense = async (expenseId: string) => {
    const original = state.expenses.find((e: any) => e.id === expenseId);
    if (!original) return;

    const { id, createdAt, parsedDate, date, ...rest } = original;
    await addExpense({
      ...rest,
      date: new Date().toISOString().split('T')[0],
    });
    toast.success('تم تكرار المصروف بنجاح');
  };

  return { addExpense, updateExpense, deleteExpense, addIncome, updateIncome, deleteIncome, repeatExpense };
}
