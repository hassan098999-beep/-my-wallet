import React, { useEffect, Suspense } from 'react';
import { useLocation, useOutlet, useNavigate } from 'react-router-dom';
import BottomNav from './BottomNav';
import Header from './Header';
import AddExpenseModal from './AddExpenseModal';
import LoadingScreen from './LoadingScreen';
import { AnimatePresence, motion, Variants } from 'motion/react';
import { useAppContext } from '../store/AppContext';
import { Plus } from 'lucide-react';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentOutlet = useOutlet();
  const { isAddModalOpen, setIsAddModalOpen, editingExpense, setEditingExpense, initialGoalId, setInitialGoalId } = useAppContext();

  // Determine transition direction based on route index
  const routeOrder = ['/', '/analytics', '/transactions', '/settings'];
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
      setIsAddModalOpen(true);
      navigate(location.pathname, { replace: true });
    }

    return () => clearTimeout(timer);
  }, [location.pathname, location.search, setIsAddModalOpen, navigate, prevPath]);

  const variants: Variants = {
    initial: {
      opacity: 0,
      scale: 0.98,
    },
    animate: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.2,
        ease: "easeOut",
      },
    },
    exit: {
      opacity: 0,
      scale: 1.02,
      transition: {
        duration: 0.15,
        ease: "easeIn",
      },
    },
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden relative z-0 bg-slate-50 dark:bg-slate-950 font-tajawal">
      {/* Atmospheric Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-emerald-500/10 blur-[120px] animate-pulse-soft" />
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] rounded-full bg-teal-500/10 blur-[100px] animate-float" />
        <div className="absolute -bottom-[10%] left-[20%] w-[35%] h-[35%] rounded-full bg-emerald-500/10 blur-[110px] animate-pulse-soft" />
      </div>

      <Header />
      <main className="flex-1 overflow-y-auto p-2 md:p-4 lg:p-6 scroll-smooth pb-28 md:pb-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="min-h-full"
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

      <BottomNav onAddClick={() => setIsAddModalOpen(true)} />
      <AddExpenseModal 
        isOpen={isAddModalOpen} 
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingExpense(null);
          setInitialGoalId(null);
        }} 
        editExpenseData={editingExpense || undefined}
        initialGoalId={initialGoalId || undefined}
      />
    </div>
  );
};

export default Layout;
