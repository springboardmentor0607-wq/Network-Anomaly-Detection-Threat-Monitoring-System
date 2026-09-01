import React from 'react';
import { Badge } from './Badge';

interface StatusBadgeProps {
  status: 'NEW' | 'ACKNOWLEDGED' | 'INVESTIGATING' | 'RESOLVED' | 'FALSE_POSITIVE' | string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const normalized = status.toUpperCase();

  const variantMap: Record<string, 'cyan' | 'blue' | 'amber' | 'emerald' | 'neutral'> = {
    NEW: 'cyan',
    ACKNOWLEDGED: 'blue',
    INVESTIGATING: 'amber',
    RESOLVED: 'emerald',
    FALSE_POSITIVE: 'neutral',
  };

  const variant = variantMap[normalized] || 'neutral';

  return (
    <Badge variant={variant} size="sm">
      {normalized.replace('_', ' ')}
    </Badge>
  );
};
