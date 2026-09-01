import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyle = 'inline-flex items-center justify-center font-semibold rounded-lg transition focus:outline-none focus:ring-2 focus:ring-sky-500/50 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white shadow-md shadow-sky-950/40',
    secondary: 'bg-[#151D35] hover:bg-[#1A2540] text-gray-100 border border-[#1A2540]',
    outline: 'border border-sky-500/40 text-sky-400 hover:bg-sky-500/10 hover:border-sky-500/60',
    danger: 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white shadow-md shadow-rose-950/40',
    ghost: 'text-gray-400 hover:text-white hover:bg-sky-500/10',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  };

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      ) : icon ? (
        <span className="mr-2">{icon}</span>
      ) : null}
      {children}
    </button>
  );
};
