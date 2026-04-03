import React from 'react';
import * as LucideIcons from 'lucide-react';
import { motion } from 'motion/react';

interface IconProps extends Omit<LucideIcons.LucideProps, 'ref'> {
  name: string;
  className?: string;
  animate?: boolean;
}

export const DynamicIcon = ({ name, animate = true, ...props }: IconProps) => {
  const Icon = (LucideIcons as any)[name];
  
  if (!Icon) {
    return (
      <motion.div
        whileHover={animate ? { scale: 1.15, rotate: 5 } : {}}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className="inline-block"
      >
        <LucideIcons.Circle {...props} />
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={animate ? { scale: 1.15, rotate: 5 } : {}}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className="inline-block"
    >
      <Icon {...props} />
    </motion.div>
  );
};
