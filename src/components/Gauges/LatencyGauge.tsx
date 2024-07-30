import React from 'react';

import { Check } from 'types';
import { useLatency } from 'data/useLatency';
import { useMetricsDS } from 'hooks/useMetricsDS';

import { Gauge } from './Gauge';

type LatencyGaugeProps = {
  check: Check;
  height: number;
  width: number;
  onClick?: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
};

export const LatencyGauge = ({ check, height, width, onClick }: LatencyGaugeProps) => {
  const metricsDS = useMetricsDS();
  const { data, isLoading, isFetching } = useLatency(check);
  const value = data ? data.value[1] : null;

  if (!metricsDS) {
    return null;
  }

  return (
    <Gauge
      fetching={isFetching}
      height={height}
      loading={isLoading}
      onClick={onClick}
      type={`latency`}
      unit="ms"
      value={value}
      width={width}
    />
  );
};
