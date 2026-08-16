import { getBudgetMonth, getBudgetRange, getWeekRange, formatCurrency } from "../../utils";
import { Expense, Income, Goal, Account, Category, Gamaeya, Budget } from "../../types";
import { updateDoc, arrayUnion, doc, collection, writeBatch, setDoc, deleteDoc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { safeParseISO } from '../../utils';
import { calculateCategoryPace } from '../../utils/paceAnalysis';
import toast from 'react-hot-toast';

export function useTransactions({ state, setState, user, evaluateAchievements, addNotification }: any) {
  const updateAccountBalanceInBatch = async (
    batch: any,
    uid: string,
    accountId: string,
    delta: number
  ) => {
    const accRef = doc(db, 'users', uid, 'accounts', accountId);
    const accDoc = await getDoc(accRef);
    if (accDoc.exists()) {
      const currentBalance = Number(accDoc.data().balance) || 0;
      batch.update(accRef, { balance: currentBalance + delta });
    } else {
      const stateAcc = state.accounts?.find((a: any) => a.id === accountId);
      const initialBalance = stateAcc ? Number(stateAcc.balance) || 0 : 0;
      const defaultAccObj = stateAcc || {
        id: accountId,
        name: accountId === 'bank' ? 'بنك' : 'كاش',
        balance: 0,
        color: accountId === 'bank' ? '#3b82f6' : '#10b981',
        icon: accountId === 'bank' ? 'Building2' : 'Banknote',
      };
      batch.set(
        accRef,
        { ...defaultAccObj, balance: initialBalance + delta, uid },
        { merge: true }
      );
    }
  };

  const updateGoalAmountInBatch = async (
    batch: any,
    uid: string,
    goalId: string,
    delta: number
  ) => {
    const goalRef = doc(db, 'users', uid, 'goals', goalId);
    const goalDoc = await getDoc(goalRef);
    if (goalDoc.exists()) {
      const currentAmount = Number(goalDoc.data().currentAmount) || 0;
      batch.update(goalRef, { currentAmount: currentAmount + delta });
    } else {
      const stateGoal = state.goals?.find((g: any) => g.id === goalId);
      const initialAmount = stateGoal ? Number(stateGoal.currentAmount) || 0 : 0;
      const defaultGoalObj = stateGoal || {
        id: goalId,
        name: 'هدف',
        currentAmount: 0,
        targetAmount: 100,
      };
      batch.set(
        goalRef,
        { ...defaultGoalObj, currentAmount: initialAmount + delta, uid },
        { merge: true }
      );
    }
  };

const addExpense = async (expense: Omit<Expense, 'id' | 'createdAt'>) => {
    const newExpense: Expense = {
      ...expense,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      parsedDate: safeParseISO(expense.date),
    };

    // Always update local React state optimistically
    setState((prev: any) => {
      let newState = { ...prev, expenses: [newExpense, ...prev.expenses] };
      let newNotifications = [...(prev.notifications || [])];

      // Update account balance
      if (newExpense.accountId) {
        newState.accounts = (newState.accounts || []).map((acc: any) => {
          if (acc.id === newExpense.accountId) {
            return { ...acc, balance: acc.balance - newExpense.amount };
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
      
      // Logic for budget alerts
      if (!newExpense.isTransfer) {
        const now = new Date();
        const currentMonth = getBudgetMonth(now, newState.firstDayOfMonth);
        const currentBudget = newState.budgets?.find((b: any) => b.month === currentMonth);
        const monthlyExpenses = newState.expenses.filter((e: any) => !e.isTransfer && e.date.startsWith(currentMonth));
        const totalSpent = monthlyExpenses.reduce((sum: any, e: any) => sum + e.amount, 0);
        const budgetAmount = currentBudget?.amount || 0;
        const currency = newState.currency || 'د.ت';
        
        const sendPushNotification = (title: string, body: string) => {
          addNotification(title, { body, icon: '/icon-192.png' });
        };

        if (budgetAmount > 0) {
          if (totalSpent > budgetAmount && totalSpent - newExpense.amount <= budgetAmount) {
            const msg = `تنبيه: لقد تجاوزت ميزانيتك الشهرية الإجمالية (${formatCurrency(budgetAmount, currency)})!`;
            newNotifications.push({ id: crypto.randomUUID(), message: msg, type: 'budget', createdAt: new Date().toISOString() });
            sendPushNotification("تنبيه الميزانية الإجمالية ⚠️", msg);
          } else if (totalSpent > budgetAmount * 0.8 && totalSpent - newExpense.amount <= budgetAmount * 0.8) {
            const msg = `تنبيه: لقد استهلكت أكثر من %80 من ميزانيتك الشهرية الإجمالية! المتبقي: ${formatCurrency(budgetAmount - totalSpent, currency)}.`;
            newNotifications.push({ id: crypto.randomUUID(), message: msg, type: 'budget', createdAt: new Date().toISOString() });
            sendPushNotification("تنبيه اقتراب الميزانية 🔔", msg);
          }
        }

        // Smart Category Pace & Budget velocity alerts
        if (currentBudget?.categoryBudgets?.[newExpense.categoryId]) {
          const catLimit = currentBudget.categoryBudgets[newExpense.categoryId];
          const targetCat = newState.categories.find((c: any) => c.id === newExpense.categoryId);
          const categoryName = targetCat?.name || 'هذه الفئة';
          const period = currentBudget.categoryPeriods?.[newExpense.categoryId] || 'monthly';
          
          const { start: monthStart, end: monthEnd } = getBudgetRange(currentMonth, newState.firstDayOfMonth);
          const { start: weekStart, end: weekEnd } = getWeekRange(now, 1);
          const rangeStart = period === 'weekly' ? weekStart : monthStart;
          const rangeEnd = period === 'weekly' ? weekEnd : monthEnd;

          if (targetCat && catLimit > 0) {
            const pace = calculateCategoryPace({
              category: targetCat,
              limit: catLimit,
              period,
              expenses: newState.expenses,
              rangeStart,
              rangeEnd,
              now,
              currency
            });

            if (pace) {
              if (pace.status === 'exceeded') {
                const msg = `🛑 تجاوز ميزانية ${categoryName}: استنفدت كامل السقف المخصص (${formatCurrency(catLimit, currency)}). يرجى ترشيد الصرف.`;
                newNotifications.push({ 
                  id: crypto.randomUUID(), 
                  message: msg, 
                  type: 'budget', 
                  createdAt: new Date().toISOString(),
                  categoryId: newExpense.categoryId
                });
                sendPushNotification(`تجاوز ميزانية ${categoryName} 🛑`, msg);
              } else if (pace.status === 'critical' || pace.status === 'warning') {
                const msg = `⚡ تنبيه سرعة الإنفاق: بمعدلك اليومي (${formatCurrency(pace.currentDailyRate, currency)}/يوم)، ستتجاوز ميزانية "${categoryName}" ${pace.daysUntilExhaustion !== null ? `خلال ${pace.daysUntilExhaustion} أيام` : 'قبل نهاية الفترة'}! الموصى به: ${formatCurrency(pace.adjustedDailyRate, currency)}/يوم.`;
                newNotifications.push({ 
                  id: crypto.randomUUID(), 
                  message: msg, 
                  type: 'pace_warning', 
                  createdAt: new Date().toISOString(),
                  categoryId: newExpense.categoryId,
                  meta: {
                    dailyRate: pace.currentDailyRate,
                    safeRate: pace.adjustedDailyRate,
                    daysLeft: pace.daysUntilExhaustion || 0,
                    projectedSpend: pace.projectedSpend,
                    limit: pace.limit
                  }
                });
                sendPushNotification(`تنبيه وتيرة إنفاق ${categoryName} ⚡`, msg);
              }
            }
          }
        }
      }

      // Logic for unusual expense
      const nonTransferExpenses = prev.expenses.filter((e: any) => !e.isTransfer);
      const avg = nonTransferExpenses.reduce((sum: any, e: any) => sum + e.amount, 0) / (nonTransferExpenses.length || 1);
      if (!newExpense.isTransfer && newExpense.amount > avg * 3) {
        newNotifications.push({ id: crypto.randomUUID(), message: "تنبيه: مصروف غير معتاد!", type: 'unusual_expense', createdAt: new Date().toISOString() });
      }

      return { ...newState, notifications: newNotifications };
    });

    if (user) {
      const batch = writeBatch(db);
      const expenseRef = doc(db, 'users', user.uid, 'expenses', newExpense.id);
      const { parsedDate: _pd, ...expenseToStore } = newExpense;
      batch.set(expenseRef, { ...expenseToStore, uid: user.uid });

      // Update account balance for actual expense
      if (newExpense.accountId) {
        await updateAccountBalanceInBatch(batch, user.uid, newExpense.accountId, -newExpense.amount);
      }

      // Update linked goal progress
      if (newExpense.goalId) {
        await updateGoalAmountInBatch(batch, user.uid, newExpense.goalId, newExpense.amount);
      }

      try {
        await batch.commit();
      } catch (error) {
        toast.error('فشل حفظ المصروف في السحاب');
      }
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
            await updateAccountBalanceInBatch(batch, user.uid, oldExpense.accountId, oldExpense.amount);
          }
          if (newExpense.accountId) {
            await updateAccountBalanceInBatch(batch, user.uid, newExpense.accountId, -newExpense.amount);
          }
        } else if (oldExpense.accountId && oldExpense.amount !== newExpense.amount) {
          const diff = newExpense.amount - oldExpense.amount;
          await updateAccountBalanceInBatch(batch, user.uid, oldExpense.accountId, -diff);
        }

        // Update linked goal progress
        if (oldExpense.goalId !== newExpense.goalId) {
          if (oldExpense.goalId) {
            await updateGoalAmountInBatch(batch, user.uid, oldExpense.goalId, -oldExpense.amount);
          }
          if (newExpense.goalId) {
            await updateGoalAmountInBatch(batch, user.uid, newExpense.goalId, newExpense.amount);
          }
        } else if (oldExpense.goalId && oldExpense.amount !== newExpense.amount) {
          const diff = newExpense.amount - oldExpense.amount;
          await updateGoalAmountInBatch(batch, user.uid, oldExpense.goalId, diff);
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
          await updateAccountBalanceInBatch(batch, user.uid, expense.accountId, expense.amount);
        }

        if (expense.goalId) {
          await updateGoalAmountInBatch(batch, user.uid, expense.goalId, -expense.amount);
        }

        if (expense.isTransfer && expense.transferId) {
          const incomesRef = collection(db, 'users', user.uid, 'income');
          const q = query(incomesRef, where('transferId', '==', expense.transferId));
          const querySnapshot = await getDocs(q);
          for (const incDoc of querySnapshot.docs) {
            const income = incDoc.data() as Income;
            batch.delete(incDoc.ref);
            if (income.accountId) {
              await updateAccountBalanceInBatch(batch, user.uid, income.accountId, -income.amount);
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
    // Default to the first account or 'cash' if accountId was not provided or empty
    const targetAccountId = income.accountId || (state.accounts && state.accounts.length > 0 ? state.accounts[0].id : 'cash');

    const newIncome: Income = {
      ...income,
      accountId: targetAccountId,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      parsedDate: safeParseISO(income.date),
    };

    // Optimistic local state update
    setState((prev: any) => {
      let newAccounts = [...(prev.accounts || [])];
      if (newIncome.accountId) {
        const accIndex = newAccounts.findIndex((acc: any) => acc.id === newIncome.accountId);
        if (accIndex !== -1) {
          newAccounts[accIndex] = { ...newAccounts[accIndex], balance: (newAccounts[accIndex].balance || 0) + newIncome.amount };
        } else {
          newAccounts.push({ id: newIncome.accountId, name: 'كاش', balance: newIncome.amount, color: '#10b981', icon: 'Banknote' });
        }
      }

      let newGoals = [...(prev.goals || [])];
      if (newIncome.goalId) {
        newGoals = newGoals.map((goal: any) => 
          goal.id === newIncome.goalId ? { ...goal, currentAmount: (goal.currentAmount || 0) + newIncome.amount } : goal
        );
      }

      return { ...prev, income: [...(prev.income || []), newIncome], accounts: newAccounts, goals: newGoals };
    });

    if (user) {
      const batch = writeBatch(db);
      const incomeRef = doc(db, 'users', user.uid, 'income', newIncome.id);
      const { parsedDate: _pd2, ...incomeToStore } = newIncome;
      batch.set(incomeRef, { ...incomeToStore, uid: user.uid });

      if (newIncome.accountId) {
        await updateAccountBalanceInBatch(batch, user.uid, newIncome.accountId, newIncome.amount);
      }

      if (newIncome.goalId) {
        await updateGoalAmountInBatch(batch, user.uid, newIncome.goalId, newIncome.amount);
      }

      try {
        await batch.commit();
      } catch (error) {
        console.error('Failed to commit income:', error);
        toast.error('فشل حفظ الدخل في السحاب');
      }
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
            await updateAccountBalanceInBatch(batch, user.uid, oldIncome.accountId, -oldIncome.amount);
          }
          if (newIncome.accountId) {
            await updateAccountBalanceInBatch(batch, user.uid, newIncome.accountId, newIncome.amount);
          }
        } else if (oldIncome.accountId && oldIncome.amount !== newIncome.amount) {
          const diff = newIncome.amount - oldIncome.amount;
          await updateAccountBalanceInBatch(batch, user.uid, oldIncome.accountId, diff);
        }

        // Update linked goal progress
        if (oldIncome.goalId !== newIncome.goalId) {
          if (oldIncome.goalId) {
            await updateGoalAmountInBatch(batch, user.uid, oldIncome.goalId, -oldIncome.amount);
          }
          if (newIncome.goalId) {
            await updateGoalAmountInBatch(batch, user.uid, newIncome.goalId, newIncome.amount);
          }
        } else if (oldIncome.goalId && oldIncome.amount !== newIncome.amount) {
          const diff = newIncome.amount - oldIncome.amount;
          await updateGoalAmountInBatch(batch, user.uid, oldIncome.goalId, diff);
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
          await updateAccountBalanceInBatch(batch, user.uid, income.accountId, -income.amount);
        }

        if (income.goalId) {
          await updateGoalAmountInBatch(batch, user.uid, income.goalId, -income.amount);
        }

        if (income.isTransfer && income.transferId) {
          const expensesRef = collection(db, 'users', user.uid, 'expenses');
          const q = query(expensesRef, where('transferId', '==', income.transferId));
          const querySnapshot = await getDocs(q);
          for (const expDoc of querySnapshot.docs) {
            const expense = expDoc.data() as Expense;
            batch.delete(expDoc.ref);
            if (expense.accountId) {
              await updateAccountBalanceInBatch(batch, user.uid, expense.accountId, expense.amount);
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
