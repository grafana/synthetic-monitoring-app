import { Pill } from 'components/Pill';
import React from 'react';
import { CheckType } from 'types';

interface Props {
  checkType: CheckType;
  className?: string;
  onClick?: (checkType: CheckType) => void;
}

export const CheckTypePill = ({ checkType, onClick, className }: Props) => {
  return (
    <Pill
      color="rgb(110, 159, 255)"
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
