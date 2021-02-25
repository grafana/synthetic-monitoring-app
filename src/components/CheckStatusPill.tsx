import { useTheme } from '@grafana/ui';
import { Pill } from 'components/Pill';
import React from 'react';

interface Props {
  enabled: boolean;
  className?: string;
}

export const CheckStatusPill = ({ enabled, className }: Props) => {
  const theme = useTheme();
  const color = enabled ? theme.palette.greenBase : theme.palette.red;

  return (
    <Pill color={color} icon={enabled ? 'check' : 'times'} className={className}>
      {enabled ? 'Enabled' : 'Disabled'}
    </Pill>
  );
};
