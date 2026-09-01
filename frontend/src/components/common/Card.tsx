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
      className={`bg-gradient-to-br from-[#0F1629] to-[#0A0E27] border border-[#1A2540] rounded-lg p-6 shadow-md hover:shadow-lg hover:shadow-sky-500/5 transition-all duration-300 ${className}`}
    >
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-[#1A2540] pb-4 mb-5">
          <div className="flex-1">
            {typeof title === 'string' ? (
              <h3 className="text-base font-semibold text-white">{title}</h3>
            ) : (
              title
            )}
            {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          </div>
          {action && <div className="ml-4">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
