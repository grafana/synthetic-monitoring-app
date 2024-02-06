import React from 'react';

import { Probe } from 'types';
import { useProbeReachabilitySuccessRate } from 'data/useSuccessRates';

import { Gauge } from './Gauge';
type SuccessRateGaugeProbeProps = {
  probeName: Probe['name'];
  height: number;
  width: number;
  onClick?: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
};

export const SuccessRateGaugeProbe = ({ probeName, height, width, onClick }: SuccessRateGaugeProbeProps) => {
  const { data: probeSuccessRate } = useProbeReachabilitySuccessRate(probeName);
  const value = probeSuccessRate?.value[1] ?? null;

  return <Gauge height={height} width={width} onClick={onClick} type={`reachability`} value={value} unit="%" />;
};
