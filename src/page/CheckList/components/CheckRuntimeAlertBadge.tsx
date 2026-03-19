import React from 'react';
import { Badge } from '@grafana/ui';

interface CheckRuntimeAlertBadgeProps {
  firingCount: number;
  className?: string;
}

export const CheckRuntimeAlertBadge = ({ firingCount, className }: CheckRuntimeAlertBadgeProps) => {
  if (firingCount < 1) {
    return null;
  }

  return (
    <Badge
      className={className}
      color="red"
      icon="bell"
      text={firingCount === 1 ? 'Alert firing' : `${firingCount} alerts firing`}
    />
  );
};
