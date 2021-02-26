import { useTheme } from '@grafana/ui';
import { Pill } from 'components/Pill';
import React from 'react';

interface Props {
  enabled: boolean;
  className?: string;
  onClick?: (enabled: boolean) => void;
}

export const CheckStatusPill = ({ enabled, onClick, className }: Props) => {
  const theme = useTheme();
  const color = enabled ? theme.palette.greenBase : theme.palette.red;

  return (
    <Pill
      color={color}
      icon={enabled ? 'check' : 'times'}
      className={className}
      onClick={() => {
        if (onClick) {
          onClick(enabled);
        }
      }}
    >
      {enabled ? 'Enabled' : 'Disabled'}
    </Pill>
  );
};
