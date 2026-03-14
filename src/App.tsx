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
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    console.log('PWA Standalone Mode:', isStandalone);

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

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
      
      {deferredPrompt && (
        <div className="fixed bottom-20 left-4 right-4 z-[100] md:left-auto md:right-4 md:w-80">
          <div className="bg-emerald-500 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between animate-bounce">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-black">تثبيت التطبيق</p>
                <p className="text-[10px] opacity-80">ثبت التطبيق للوصول السريع</p>
              </div>
            </div>
            <button 
              onClick={handleInstallClick}
              className="bg-white text-emerald-600 px-4 py-2 rounded-xl text-xs font-black hover:bg-emerald-50 shadow-sm transition-colors"
            >
              تثبيت
            </button>
          </div>
        </div>
      )}

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
