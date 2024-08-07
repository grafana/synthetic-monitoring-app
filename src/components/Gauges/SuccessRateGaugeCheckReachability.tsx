import React from 'react';

import { Check } from 'types';
import { useCheckReachabilitySuccessRate } from 'data/useSuccessRates';
import { useMetricsDS } from 'hooks/useMetricsDS';

import { Gauge } from './Gauge';

type SuccessRateGaugeCheckReachabilityProps = {
  check: Check;
  height: number;
  width: number;
  onClick?: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
};

export const SuccessRateGaugeCheckReachability = ({
  check,
  height,
  width,
  onClick,
}: SuccessRateGaugeCheckReachabilityProps) => {
  const metricsDS = useMetricsDS();
  const { data, isLoading, isFetching } = useCheckReachabilitySuccessRate(check);
  const value = data ? data.value?.[1] : null;

  if (!metricsDS) {
    return null;
  }

  return (
    <Gauge
      fetching={isFetching}
      height={height}
      loading={isLoading}
      width={width}
      onClick={onClick}
      type={'reachability'}
      value={value}
      unit="%"
    />
  );
};
