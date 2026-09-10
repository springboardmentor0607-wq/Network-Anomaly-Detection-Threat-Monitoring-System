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
    neutral: 'bg-[#222222] text-gray-300 border-gray-700',
    cyan: 'bg-cyan-950/80 text-cyan-400 border-cyan-500/30',
    blue: 'bg-blue-950/80 text-blue-400 border-blue-500/30',
    emerald: 'bg-emerald-950/80 text-emerald-400 border-emerald-500/30',
    amber: 'bg-amber-950/80 text-amber-400 border-amber-500/30',
    red: 'bg-red-950/80 text-red-400 border-red-500/30',
    purple: 'bg-purple-950/80 text-purple-400 border-purple-500/30',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
  };

  return (
    <span
      className={`inline-flex items-center font-medium border rounded-full ${styles[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </span>
  );
};
