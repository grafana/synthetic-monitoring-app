import React from 'react';
import { useTheme2 } from '@grafana/ui';

import { CheckType } from 'types';
import { Pill } from 'components/Pill';

interface Props {
  checkType: CheckType;
  className?: string;
  onClick?: (checkType: CheckType) => void;
}

export const CheckTypePill = ({ checkType, onClick, className }: Props) => {
  const theme = useTheme2();

  return (
    <Pill
      color={theme.colors.primary.text}
      className={className}
      onClick={() => {
        if (onClick) {
          onClick(checkType);
        }
      }}
    >
      {checkType === CheckType.K6 ? 'SCRIPTED' : checkType.toUpperCase()}
    </Pill>
  );
};
