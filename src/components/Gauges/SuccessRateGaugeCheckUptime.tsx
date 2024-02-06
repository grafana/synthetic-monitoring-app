import React from 'react';

import { Check } from 'types';
import { useCheckUptimeSuccessRate } from 'data/useSuccessRates';

import { Gauge } from './Gauge';

type SuccessRateGaugeCheckUptimeProps = {
  check: Check;
  height: number;
  width: number;
  onClick?: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
};

export const SuccessRateGaugeCheckUptime = ({ check, height, width, onClick }: SuccessRateGaugeCheckUptimeProps) => {
  const { data } = useCheckUptimeSuccessRate(check);
  const value = data ? data.value[1] : null;

  return <Gauge height={height} width={width} onClick={onClick} type={`reachability`} value={value} unit="%" />;
};
