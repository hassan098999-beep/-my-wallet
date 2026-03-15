import React from 'react';
import { cn } from '../utils';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
  return (
    <div 
      className={cn(
        "animate-pulse bg-slate-200 dark:bg-slate-800 rounded-md", 
        className
      )} 
    />
  );
};

export const TransactionSkeleton = () => (
  <div className="p-4 md:p-6 flex items-center justify-between gap-4 md:gap-6">
    <div className="flex items-center gap-4 md:gap-6">
      <Skeleton className="w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-[1.5rem]" />
      <div className="space-y-2">
        <Skeleton className="h-4 md:h-6 w-32 md:w-48" />
        <Skeleton className="h-3 md:h-4 w-24 md:w-32" />
      </div>
    </div>
    <div className="flex flex-col items-end gap-2">
      <Skeleton className="h-5 md:h-8 w-20 md:w-28" />
      <Skeleton className="h-3 md:h-4 w-12 md:w-16" />
    </div>
  </div>
);

export const CardSkeleton = () => (
  <div className="glass-card p-6 rounded-[2rem] space-y-4">
    <Skeleton className="h-4 w-24" />
    <Skeleton className="h-8 w-40" />
    <Skeleton className="h-2 w-full" />
  </div>
);
