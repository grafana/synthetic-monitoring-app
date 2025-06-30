import React from 'react';

import { Check } from 'types';

import { Gauge } from './Gauge';

type AiCheckDurationGaugeProps = {
  check: Check;
  height: number;
  width: number;
  onClick?: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
};

export const AiCheckDurationGauge = ({ check, height, width, onClick }: AiCheckDurationGaugeProps) => {
  return (
    <Gauge
      fetching={false}
      height={height}
      loading={false}
      onClick={onClick}
      type={`duration`}
      unit="s"
      value={5 * 60 + Math.floor(Math.random() * 60)} // Simulating a random duration between 5 and 6 minutes
      width={width}
    />
  );
};
