import React from 'react';
import { cn } from '../../utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className, 
  interactive = false,
  ...props 
}) => {
  return (
    <div 
      className={cn(
        "bg-white dark:bg-slate-900/80 backdrop-blur-xl border border-slate-100 dark:border-slate-800/80 shadow-sm p-4 md:p-6 transition-all duration-200",
        "rounded-card", // CSS variable defined in index.css
        interactive && "cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/30 hover:shadow-md motion-safe:hover:scale-[1.01] active:scale-[0.99] motion-reduce:transform-none",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
