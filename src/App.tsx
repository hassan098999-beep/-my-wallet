import React, { useEffect, Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProvider, useAppContext } from './store/AppContext';
import Layout from './components/Layout';
import OnboardingModal from './OnboardingModal';
import LoadingScreen from './components/LoadingScreen';
import PwaInstallPrompt from './components/PwaInstallPrompt';
import LockScreen from './components/LockScreen';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Transactions = lazy(() => import('./pages/Transactions'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Settings = lazy(() => import('./pages/Settings'));
const Assistant = lazy(() => import('./pages/Assistant'));
const ShareAdd = lazy(() => import('./pages/ShareAdd'));

const BudgetPage = lazy(() => import('./pages/Budget'));
const GoalsPage = lazy(() => import('./pages/Goals'));
const IncomePage = lazy(() => import('./pages/settings/Income'));
const RecurringExpenses = lazy(() => import('./pages/RecurringExpenses'));
const SavingsPage = lazy(() => import('./pages/Savings'));
const SavingsIndicatorsPage = lazy(() => import('./pages/SavingsIndicators'));
const FamilyReport = lazy(() => import('./pages/FamilyReport'));

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
              <Route path="goals" element={<GoalsPage />} />
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
        className: 'font-tajawal font-bold',
        style: {
          background: '#333',
          color: '#fff',
          borderRadius: '1rem',
        }
      }} />
      
      <AppContent />
    </AppProvider>
  );
}
