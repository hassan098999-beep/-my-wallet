import React from 'react';
import { cn } from '../../utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant: 'success' | 'warning' | 'danger' | 'info';
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ 
  variant, 
  children, 
  className,
  ...props
}) => {
  const getStyles = () => {
    switch (variant) {
      case 'success':
        return 'bg-success/10 text-success border-success/20 dark:bg-success/20 dark:text-success dark:border-success/30';
      case 'warning':
        return 'bg-warning/10 text-warning border-warning/20 dark:bg-warning/20 dark:text-warning dark:border-warning/30';
      case 'danger':
        return 'bg-danger/10 text-danger border-danger/20 dark:bg-danger/20 dark:text-danger dark:border-danger/30';
      case 'info':
        return 'bg-info/10 text-info border-info/20 dark:bg-info/20 dark:text-info dark:border-info/30';
      default:
        return 'bg-info/10 text-info border-info/20 dark:bg-info/20 dark:text-info dark:border-info/30';
    }
  };

  return (
    <span 
      className={cn(
        "inline-flex items-center justify-center font-tajawal text-[10px] md:text-xs font-bold px-2.5 py-0.5 border rounded-pill tracking-wide shrink-0",
        getStyles(),
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;
