import React from 'react';
import { useTheme2 } from '@grafana/ui';

import { Pill } from 'page/CheckList/components/Pill';

interface CheckStatusPillProps {
  enabled: boolean;
  className?: string;
  onClick?: (enabled: boolean) => void;
}

export const CheckStatusPill = ({ enabled, onClick, className }: CheckStatusPillProps) => {
  const theme = useTheme2();

  return (
    <Pill
      color={theme.visualization.getColorByName(enabled ? `baseGreen` : `red`)}
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
