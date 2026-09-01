import React from 'react';
import { Badge } from './Badge';

interface SeverityBadgeProps {
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | string;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity }) => {
  const normalized = severity.toUpperCase();

  const variantMap: Record<string, 'emerald' | 'amber' | 'red' | 'purple'> = {
    LOW: 'emerald',
    MEDIUM: 'amber',
    HIGH: 'red',
    CRITICAL: 'purple',
  };

  const variant = variantMap[normalized] || 'emerald';

  return (
    <Badge variant={variant} size="sm">
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
      {normalized}
    </Badge>
  );
};
