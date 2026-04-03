import React from 'react';
import { cn } from '../utils';

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, style }) => {
  return (
    <div 
      className={cn(
        "animate-pulse bg-slate-200 dark:bg-slate-800 rounded-md", 
        className
      )} 
      style={style}
    />
  );
};

export const TransactionSkeleton = () => (
  <div className="p-4 md:p-6 flex items-center justify-between gap-4 md:gap-6">
    <div className="flex items-center gap-4 md:gap-6">
      <Skeleton className="w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-2xl" />
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

export const CardSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("glass-card p-6 rounded-3xl space-y-4", className)}>
    <Skeleton className="h-4 w-24" />
    <Skeleton className="h-8 w-40" />
    <Skeleton className="h-2 w-full" />
  </div>
);

export const BarChartSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("w-full h-full flex items-end justify-between gap-1.5 md:gap-2 p-2 md:p-4", className)}>
    {[40, 70, 45, 90, 65, 30, 85, 50, 75, 60, 35, 80].map((height, i) => (
      <Skeleton key={i} className="w-full rounded-t-md" style={{ height: `${height}%` }} />
    ))}
  </div>
);

export const PieChartSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("w-full h-full flex items-center justify-center", className)}>
    <div className="relative w-32 h-32 md:w-48 md:h-48">
      <Skeleton className="absolute inset-0 rounded-full" />
      <div className="absolute inset-6 md:inset-8 bg-white dark:bg-slate-900 rounded-full" />
    </div>
  </div>
);

export const AreaChartSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("w-full h-full relative overflow-hidden rounded-2xl", className)}>
    <svg className="absolute bottom-0 left-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
      <path 
        d="M0,100 L0,60 Q15,40 30,60 T60,50 T100,30 L100,100 Z" 
        className="fill-slate-200 dark:fill-slate-800 animate-pulse" 
      />
    </svg>
    <div className="absolute bottom-0 left-0 w-full h-px bg-slate-200 dark:bg-slate-800" />
  </div>
);
