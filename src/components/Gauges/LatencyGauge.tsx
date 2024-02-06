import React from 'react';

import { Check } from 'types';
import { useLatency } from 'data/useLatency';

import { Gauge } from './Gauge';

type LatencyGaugeProps = {
  check: Check;
  height: number;
  width: number;
  onClick?: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
};

export const LatencyGauge = ({ check, height, width, onClick }: LatencyGaugeProps) => {
  const { data } = useLatency(check);
  const value = data ? data.value[1] : null;

  return <Gauge height={height} width={width} onClick={onClick} type={`latency`} value={value} unit="ms" />;
};
