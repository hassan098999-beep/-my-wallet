import React, { useEffect } from 'react';
import { useLocation, useOutlet, useNavigate } from 'react-router-dom';
import BottomNav from './BottomNav';
import Header from './Header';
import AddExpenseModal from './AddExpenseModal';
import { AnimatePresence, motion } from 'motion/react';
import { useAppContext } from '../store/AppContext';
import { Plus } from 'lucide-react';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentOutlet = useOutlet();
  const { isAddModalOpen, setIsAddModalOpen } = useAppContext();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const action = params.get('action');
    if (action === 'add' || action === 'add-expense') {
      setIsAddModalOpen(true);
      // Clean up the URL
      navigate(location.pathname, { replace: true });
    }
  }, [location.search, setIsAddModalOpen, navigate, location.pathname]);

  return (
    <div className="flex flex-col h-screen overflow-hidden relative z-0 bg-slate-50 dark:bg-slate-950">
      {/* Atmospheric Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-emerald-500/10 blur-[120px] animate-pulse-soft" />
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] rounded-full bg-teal-500/10 blur-[100px] animate-float" />
        <div className="absolute -bottom-[10%] left-[20%] w-[35%] h-[35%] rounded-full bg-emerald-500/10 blur-[110px] animate-pulse-soft" />
      </div>

      <Header />
      <main className="flex-1 overflow-y-auto p-2 md:p-4 lg:p-6 scroll-smooth pb-24 md:pb-28">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="h-full"
          >
            {currentOutlet}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Quick Add FAB */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsAddModalOpen(true)}
        className="fixed bottom-20 right-6 z-50 w-14 h-14 rounded-2xl bg-emerald-500 text-white shadow-2xl shadow-emerald-500/40 flex items-center justify-center transition-all duration-300 hover:rotate-90"
      >
        <Plus size={28} strokeWidth={3} />
      </motion.button>

      <BottomNav onAddClick={() => setIsAddModalOpen(true)} />
      <AddExpenseModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </div>
  );
};

export default Layout;
