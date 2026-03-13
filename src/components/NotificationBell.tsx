import React, { useState } from 'react';
import { Bell, X } from 'lucide-react';
import { useAppContext } from '../store/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils';

const NotificationBell = () => {
  const { notifications, removeNotification } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 relative">
        <Bell size={20} className="text-slate-600 dark:text-slate-400" />
        {notifications.length > 0 && (
          <span className="absolute top-1 right-1 size-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute left-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 p-4"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-slate-900 dark:text-white">الإشعارات</h3>
              <button onClick={() => setIsOpen(false)}><X size={16} /></button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">لا توجد إشعارات حالياً</p>
              ) : (
                notifications.map(n => (
                  <div key={n.id} className={cn(
                    "p-3 rounded-xl text-sm", 
                    n.type === 'budget' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-200' : 
                    n.type === 'achievement' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-200' : 
                    'bg-rose-50 dark:bg-rose-900/20 text-rose-900 dark:text-rose-200'
                  )}>
                    <p>{n.message}</p>
                    <button onClick={() => removeNotification(n.id)} className="text-xs font-bold mt-1 underline">حذف</button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default NotificationBell;
