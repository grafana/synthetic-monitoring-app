import React from 'react';

import { Check } from 'types';

import { Gauge } from './Gauge';

type AiCheckScoreGaugeProps = {
  check: Check;
  height: number;
  width: number;
  onClick?: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
};

export const AiCheckScoreGauge = ({ check, height, width, onClick }: AiCheckScoreGaugeProps) => {
  return (
    <Gauge
      fetching={false}
      height={height}
      loading={false}
      width={width}
      onClick={onClick}
      type={'score'}
      value={Math.floor(Math.random() * 100)}
      unit=""
    />
  );
};
