import { useTheme } from '@grafana/ui';
import { Pill } from 'components/Pill';
import React from 'react';
import { CheckType } from 'types';

interface Props {
  checkType: CheckType;
  className?: string;
  onClick?: (checkType: CheckType) => void;
}

export const CheckTypePill = ({ checkType, onClick, className }: Props) => {
  const theme = useTheme();

  return (
    <Pill
      color={theme.palette.blue77}
      className={className}
      onClick={() => {
        if (onClick) {
          onClick(checkType);
        }
      }}
    >
      {checkType.toUpperCase()}
    </Pill>
  );
};
