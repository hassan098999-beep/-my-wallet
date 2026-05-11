import React, { useEffect, useRef } from 'react';
import { useAnimation, animate } from 'motion/react';
import { formatCurrency } from '../utils';

interface AnimatedNumberProps {
  value: number;
  currency: string;
  className?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ value, currency, className }) => {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const prevValue = useRef<number>(0);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;

    const controls = animate(prevValue.current, value, {
      duration: 1.5,
      ease: "easeOut",
      onUpdate(v) {
        node.textContent = formatCurrency(Math.round(v), currency);
      }
    });

    prevValue.current = value;

    return () => controls.stop();
  }, [value, currency]);

  return <span ref={nodeRef} className={className}>{formatCurrency(prevValue.current, currency)}</span>;
};
