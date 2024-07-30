import React from 'react';

import { Probe } from 'types';
import { useProbeReachabilitySuccessRate } from 'data/useSuccessRates';
import { useMetricsDS } from 'hooks/useMetricsDS';

import { Gauge } from './Gauge';
type SuccessRateGaugeProbeProps = {
  probeName: Probe['name'];
  height: number;
  width: number;
  onClick?: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
};

export const SuccessRateGaugeProbe = ({ probeName, height, width, onClick }: SuccessRateGaugeProbeProps) => {
  const metricsDS = useMetricsDS();
  const { data, isLoading, isFetching } = useProbeReachabilitySuccessRate(probeName);
  const value = data?.value[1] ?? null;

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
      type={`reachability`}
      value={value}
      unit="%"
    />
  );
};
