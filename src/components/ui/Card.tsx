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
        "bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-850/80 shadow-sm md:shadow-md p-4 md:p-6 transition-all duration-300",
        "rounded-3xl", // CSS premium standard rounded-3xl
        interactive && "cursor-pointer hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-black/25 active:scale-[0.99]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
