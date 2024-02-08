import React, { useContext } from 'react';
import { DisplayValue } from '@grafana/data';
import { config } from '@grafana/runtime';
import { BigValue, BigValueColorMode, BigValueGraphMode } from '@grafana/ui';

import { CheckType } from 'types';
import { getLatencySuccessRateThresholdColor } from 'utils';
import { SuccessRateContext, ThresholdSettings } from 'contexts/SuccessRateContext';
import { useMetricData } from 'hooks/useMetricData';

import { BigValueTitle } from './BigValueTitle';
import { LATENCY_DESCRIPTION } from './constants';

interface Props {
  target: string;
  job: string;
  height: number;
  width: number;
  checkType: CheckType;
  onClick?: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
}

const getDisplayValue = (data: any[], loading: boolean, thresholds: ThresholdSettings): DisplayValue => {
  if (loading) {
    return {
      numeric: 0,
      // @ts-ignore
      title: <BigValueTitle title="Latency" infoText={LATENCY_DESCRIPTION} />,
      text: 'loading...',
    };
  }
  if (!data || data.length < 1) {
    return {
      numeric: 0,
      text: 'N/A',
      // @ts-ignore
      title: <BigValueTitle title="Latency" infoText={LATENCY_DESCRIPTION} />,
    };
  }

  const latency = parseFloat(data[0].value[1]) * 1000;
  const color = getLatencySuccessRateThresholdColor(thresholds, 'latency', latency);

  return {
    // @ts-ignore
    title: <BigValueTitle title="Latency" infoText={LATENCY_DESCRIPTION} />,
    color: color,
    numeric: latency,
    text: latency.toFixed(0) + 'ms',
  };
};

function getLatencyQuery(checkType: CheckType, target: string, job: string) {
  switch (checkType) {
    case CheckType.MULTI_HTTP:
      return `sum by (job, instance) (sum_over_time(probe_http_total_duration_seconds{job="${job}", instance="${target}"}[6h])) / sum by (job, instance) (count_over_time(probe_http_total_duration_seconds{job="${job}", instance="${target}"}[6h])) `;
    default:
      return `sum((rate(probe_all_duration_seconds_sum{probe=~".*", instance="${target}", job="${job}"}[6h]) OR rate(probe_duration_seconds_sum{probe=~".*", instance="${target}", job="${job}"}[6h]))) / sum((rate(probe_all_duration_seconds_count{probe=~".*", instance="${target}", job="${job}"}[6h]) OR rate(probe_duration_seconds_count{probe=~".*", instance="${target}", job="${job}"}[6h])))`;
  }
}

export const LatencyGauge = ({ target, job, height, checkType, width }: Props) => {
  const { thresholds } = useContext(SuccessRateContext);
  const query = getLatencyQuery(checkType, target, job);

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
