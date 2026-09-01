import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'neutral' | 'cyan' | 'blue' | 'emerald' | 'amber' | 'red' | 'purple';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
}) => {
  const styles = {
    neutral: 'bg-gray-500/15 text-gray-300 border-gray-500/30',
    cyan: 'bg-sky-500/15 text-sky-400 border-sky-500/40',
    blue: 'bg-blue-500/15 text-blue-400 border-blue-500/40',
    emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40',
    amber: 'bg-amber-500/15 text-amber-400 border-amber-500/40',
    red: 'bg-rose-500/15 text-rose-400 border-rose-500/40',
    purple: 'bg-purple-500/15 text-purple-400 border-purple-500/40',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
  };

  return (
    <span
      className={`inline-flex items-center font-semibold border rounded-full ${styles[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </span>
  );
};
