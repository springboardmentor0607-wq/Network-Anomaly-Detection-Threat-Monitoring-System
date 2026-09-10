import React from 'react';

export interface CardProps {
  title?: string | React.ReactNode;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  action,
  children,
  className = '',
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-[#121212] border border-[#333333] rounded-xl p-5 shadow-lg ${className}`}
    >
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-[#333333] pb-3 mb-4">
          <div>
            {typeof title === 'string' ? (
              <h3 className="text-base font-semibold text-white">{title}</h3>
            ) : (
              title
            )}
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
