import React, { useEffect, Suspense } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProvider, useAppContext } from './store/AppContext';
import Layout from './components/Layout';
import OnboardingModal from './OnboardingModal';
import LoadingScreen from './components/LoadingScreen';
import PwaInstallPrompt from './components/PwaInstallPrompt';
import LockScreen from './components/LockScreen';

import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Assistant from './pages/Assistant';
import ShareAdd from './pages/ShareAdd';

import BudgetPage from './pages/Budget';
import DebtsPage from './pages/Debts';
import IncomePage from './pages/settings/Income';
import RecurringExpenses from './pages/RecurringExpenses';
import SavingsPage from './pages/Savings';
import SavingsIndicatorsPage from './pages/SavingsIndicators';
import FamilyReport from './pages/FamilyReport';

function AppContent() {
  const { isLocked } = useAppContext();

  if (isLocked) {
    return <LockScreen />;
  }

  return (
    <>
      <PwaInstallPrompt />
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
              <Route path="debts" element={<DebtsPage />} />
              <Route path="income" element={<IncomePage />} />
              <Route path="savings" element={<SavingsPage />} />
              <Route path="savings-indicators" element={<SavingsIndicatorsPage />} />
              <Route path="family" element={<FamilyReport />} />
              <Route path="settings" element={<Settings />} />
              <Route path="assistant" element={<Assistant />} />
              <Route path="share-add" element={<ShareAdd />} />
            </Route>
          </Routes>
        </Suspense>
      </Router>
    </>
  );
}

export default function App() {
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    console.log('PWA Standalone Mode:', isStandalone);

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <AppProvider>
      <Toaster position="top-center" toastOptions={{
        duration: 3000,
        success: { duration: 3000 },
        error: { duration: 3000 },
        className: 'font-tajawal font-bold',
        style: {
          background: '#333',
          color: '#fff',
          borderRadius: '1rem',
          pointerEvents: 'none',
        }
      }} />
      
      <AppContent />
    </AppProvider>
  );
}
