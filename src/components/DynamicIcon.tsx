import React from 'react';
import * as LucideIcons from 'lucide-react';

interface IconProps extends Omit<LucideIcons.LucideProps, 'ref'> {
  name: string;
  className?: string;
}

export const DynamicIcon = ({ name, ...props }: IconProps) => {
  const Icon = (LucideIcons as any)[name];
  
  if (!Icon) {
    return <LucideIcons.Circle {...props} />;
  }

  return <Icon {...props} />;
};
