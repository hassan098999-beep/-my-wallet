import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProvider } from './store/AppContext';
import Layout from './components/Layout';
import OnboardingModal from './components/OnboardingModal';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import BudgetPage from './pages/Budget';
import GoalsPage from './pages/Goals';
import IncomePage from './pages/Income';
import RecurringExpenses from './pages/RecurringExpenses';
import SavingsPage from './pages/Savings';

export default function App() {
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <AppProvider>
      <Toaster position="top-center" toastOptions={{
        className: 'font-tajawal font-bold',
        style: {
          background: '#333',
          color: '#fff',
          borderRadius: '1rem',
        }
      }} />
      <OnboardingModal />
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="budget" element={<BudgetPage />} />
            <Route path="recurring" element={<RecurringExpenses />} />
            <Route path="goals" element={<GoalsPage />} />
            <Route path="income" element={<IncomePage />} />
            <Route path="savings" element={<SavingsPage />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </Router>
    </AppProvider>
  );
}
