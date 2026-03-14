import React, { useEffect, Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProvider } from './store/AppContext';
import Layout from './components/Layout';
import OnboardingModal from './OnboardingModal';
import LoadingScreen from './components/LoadingScreen';

// Lazy load pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Transactions = lazy(() => import('./pages/Transactions'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Settings = lazy(() => import('./pages/Settings'));
const BudgetPage = lazy(() => import('./pages/Budget'));
const GoalsPage = lazy(() => import('./pages/Goals'));
const IncomePage = lazy(() => import('./pages/settings/Income'));
const RecurringExpenses = lazy(() => import('./pages/RecurringExpenses'));
const SavingsPage = lazy(() => import('./pages/Savings'));

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
        <Suspense fallback={<LoadingScreen />}>
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
        </Suspense>
      </Router>
    </AppProvider>
  );
}
