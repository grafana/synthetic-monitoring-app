import React, { useContext } from 'react';
import { BigValueColorMode, BigValueGraphMode, BigValue } from '@grafana/ui';
import { DisplayValue } from '@grafana/data';
import { config } from '@grafana/runtime';
import { useMetricData } from 'hooks/useMetricData';
import { SuccessRateContext, ThresholdSettings } from 'contexts/SuccessRateContext';
import { getSuccessRateThresholdColor } from 'utils';

interface Props {
  target: string;
  job: string;
  height: number;
  width: number;
  onClick?: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
}

const getDisplayValue = (data: any[], loading: boolean, thresholds: ThresholdSettings): DisplayValue => {
  if (loading) {
    return {
      numeric: 0,
      title: 'Latency',
      text: 'loading...',
    };
  }
  if (!data || data.length < 1) {
    return {
      numeric: 0,
      text: 'N/A',
      title: 'Latency',
    };
  }

  const latency = parseFloat(data[0].value[1]) * 1000;
  const color = getSuccessRateThresholdColor(thresholds, 'latency', latency);

  return {
    title: 'Latency',
    color: color,
    numeric: latency,
    text: latency.toFixed(0) + 'ms',
  };
};

export const LatencyGauge = ({ target, job, height, width }: Props) => {
  const { thresholds } = useContext(SuccessRateContext);
  const query = `sum((rate(probe_all_duration_seconds_sum{probe=~".*", instance="${target}", job="${job}"}[6h]) OR rate(probe_duration_seconds_sum{probe=~".*", instance="${target}", job="${job}"}[6h]))) / sum((rate(probe_all_duration_seconds_count{probe=~".*", instance="${target}", job="${job}"}[6h]) OR rate(probe_duration_seconds_count{probe=~".*", instance="${target}", job="${job}"}[6h])))`;

  const { data, loading } = useMetricData(query);
  const value = getDisplayValue(data, loading, thresholds);
  return (
    <BigValue
      theme={config.theme2}
      colorMode={BigValueColorMode.Value}
      height={height}
      width={width}
      graphMode={BigValueGraphMode.Area}
      value={value}
    />
  );
};
