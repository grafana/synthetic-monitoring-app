import React from 'react';
import { useTheme2 } from '@grafana/ui';

import { CheckType } from 'types';
import { Pill } from 'page/CheckList/components/CheckListItem/Pill';

interface CheckTypePillProps {
  checkType: CheckType;
  className?: string;
  onClick?: (checkType: CheckType) => void;
}

export const CheckTypePill = ({ checkType, onClick, className }: CheckTypePillProps) => {
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
      {checkType === CheckType.Scripted ? 'SCRIPTED' : checkType.toUpperCase()}
    </Pill>
  );
};
