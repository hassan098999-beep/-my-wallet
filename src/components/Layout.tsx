import React, { useEffect, Suspense } from 'react';
import { useLocation, useOutlet, useNavigate, Link } from 'react-router-dom';
import BottomNav from './BottomNav';
import Header from './Header';
import Sidebar from './Sidebar';
import AddExpenseModal from './AddExpenseModal';
import { AnimatePresence, motion, Variants } from 'motion/react';
import { useAppContext } from '../store/AppContext';
import { Sparkles } from 'lucide-react';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentOutlet = useOutlet();
  const { isAddModalOpen, setIsAddModalOpen, editingExpense, setEditingExpense, initialGoalId, setInitialGoalId } = useAppContext();
  const [addModalMode, setAddModalMode] = React.useState<'quick' | 'calculator'>('quick');

  // Determine transition direction based on route index
  const routeOrder = ['/', '/analytics', '/transactions', '/settings', '/assistant'];
  const [prevPath, setPrevPath] = React.useState(location.pathname);
  const [direction, setDirection] = React.useState(0);
  const [isNavigating, setIsNavigating] = React.useState(false);

  useEffect(() => {
    const currentIndex = routeOrder.indexOf(location.pathname);
    const prevIndex = routeOrder.indexOf(prevPath);

    if (currentIndex !== -1 && prevIndex !== -1) {
      setDirection(currentIndex > prevIndex ? 1 : -1);
    } else {
      setDirection(0);
    }
    
    // Trigger navigation progress bar
    setIsNavigating(true);
    const timer = setTimeout(() => setIsNavigating(false), 300);

    setPrevPath(location.pathname);

    // Scroll to top on route change
    const mainElement = document.querySelector('main');
    if (mainElement) {
      mainElement.scrollTo({ top: 0, behavior: 'auto' });
    }

    const params = new URLSearchParams(location.search);
    const action = params.get('action');
    if (action === 'add' || action === 'add-expense') {
      setAddModalMode('calculator');
      setIsAddModalOpen(true);
      navigate(location.pathname, { replace: true });
    }

    return () => clearTimeout(timer);
  }, [location.pathname, location.search, setIsAddModalOpen, navigate, prevPath]);

  const variants: Variants = {
    initial: {
      opacity: 0,
      scale: 0.99,
      y: 8,
    },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.25,
        ease: [0.16, 1, 0.3, 1],
      },
    },
    exit: {
      opacity: 0,
      scale: 0.99,
      y: -6,
      transition: {
        duration: 0.15,
        ease: "easeInOut",
      },
    },
  };

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden relative z-0 bg-slate-50 dark:bg-slate-950 font-tajawal">
      {/* Atmospheric Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-emerald-500/10 blur-[120px] animate-pulse-soft" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-primary-500/10 blur-[100px] animate-pulse-soft" />
        <div className="absolute -bottom-[10%] left-[20%] w-[35%] h-[35%] rounded-full bg-emerald-500/10 blur-[110px] animate-pulse-soft" />
      </div>

      <Sidebar 
        onAddClick={() => { setAddModalMode('calculator'); setIsAddModalOpen(true); }} 
        onQuickClick={() => { setAddModalMode('quick'); setIsAddModalOpen(true); }} 
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden w-full relative">
        <div className="md:hidden">
          <Header />
        </div>
        
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8 scroll-smooth pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:pb-6 overflow-x-hidden relative custom-scrollbar">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={location.pathname}
              custom={direction}
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="min-h-full w-full flex flex-col"
            >
              <Suspense fallback={
                <div className="flex items-center justify-center min-h-[50vh]">
                  <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                </div>
              }>
                {currentOutlet}
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Floating AI Assistant Button (Mobile Only) */}
        {location.pathname !== '/assistant' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="md:hidden fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] left-4 z-40"
          >
            <Link to="/assistant">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-14 h-14 rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 flex items-center justify-center border-2 border-white dark:border-slate-800"
              >
                <Sparkles size={24} />
              </motion.button>
            </Link>
          </motion.div>
        )}

        <div className="md:hidden">
          <BottomNav 
            onAddClick={() => { setAddModalMode('calculator'); setIsAddModalOpen(true); }} 
            onQuickClick={() => { setAddModalMode('quick'); setIsAddModalOpen(true); }} 
          />
        </div>
      </div>

      <AddExpenseModal 
        isOpen={isAddModalOpen} 
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingExpense(null);
          setInitialGoalId(null);
        }} 
        editExpenseData={editingExpense || undefined}
        initialGoalId={initialGoalId || undefined}
        initialMode={addModalMode}
      />
    </div>
  );
};

export default Layout;
