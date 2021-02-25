import { useTheme } from '@grafana/ui';
import { Pill } from 'components/Pill';
import React from 'react';
import { CheckType } from 'types';

interface Props {
  checkType: CheckType;
  className?: string;
}

export const CheckTypePill = ({ checkType, className }: Props) => {
  const theme = useTheme();

  return (
    <Pill color={theme.palette.blue77} className={className}>
      {checkType.toUpperCase()}
    </Pill>
  );
};
