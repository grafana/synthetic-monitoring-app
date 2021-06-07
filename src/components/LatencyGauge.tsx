import React from 'react';
import { BigValueColorMode, BigValueGraphMode, BigValue } from '@grafana/ui';
import { DisplayValue } from '@grafana/data';
import { config } from '@grafana/runtime';
import { useMetricData } from 'hooks/useMetricData';

interface Props {
  target: string;
  job: string;
  height: number;
  width: number;
  onClick?: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
}

const getDisplayValue = (data: any[], loading: boolean): DisplayValue => {
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
  return {
    title: 'Latency',
    color: latency > 1000 ? 'red' : 'green',
    numeric: latency,
    text: latency.toFixed(2) + 'ms',
  };
};

export const LatencyGauge = ({ target, job, height, width }: Props) => {
  const query = `sum((rate(probe_all_duration_seconds_sum{probe=~".*", instance="${target}", job="${job}"}[6h]) OR rate(probe_duration_seconds_sum{probe=~".*", instance="${target}", job="${job}"}[6h]))) / sum((rate(probe_all_duration_seconds_count{probe=~".*", instance="${target}", job="${job}"}[6h]) OR rate(probe_duration_seconds_count{probe=~".*", instance="${target}", job="${job}"}[6h])))`;

  const { data, loading } = useMetricData(query);
  const value = getDisplayValue(data, loading);
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
