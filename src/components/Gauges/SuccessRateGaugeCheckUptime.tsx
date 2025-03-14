import React from 'react';

import { Check } from 'types';
import { useCheckUptimeSuccessRate } from 'data/useSuccessRates';
import { useMetricsDS } from 'hooks/useMetricsDS';

import { Gauge } from './Gauge';

type SuccessRateGaugeCheckUptimeProps = {
  check: Check;
  height: number;
  width: number;
  onClick?: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
};

export const SuccessRateGaugeCheckUptime = ({ check, height, width, onClick }: SuccessRateGaugeCheckUptimeProps) => {
  const metricsDS = useMetricsDS();
  const { data = null, isLoading, isFetching } = useCheckUptimeSuccessRate(check);

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
      type={'uptime'}
      value={data}
      unit="%"
    />
  );
};
