import React, { useState } from 'react';
import { BigValueColorMode, BigValueGraphMode, BigValue, Container } from '@grafana/ui';
import { DisplayValue, ArrayVector, FieldType } from '@grafana/data';
import { config } from '@grafana/runtime';
import { useMetricData } from 'hooks/useMetricData';

interface Props {
  labelNames: string[];
  labelValues: string[];
  height: number;
  width: number;
  sparkline: boolean;
  onClick?: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
}

const getDisplayValue = (data: any[], loading: boolean): DisplayValue => {
  if (loading) {
    return {
      numeric: 0,
      title: 'Success rate',
      text: 'loading...',
    };
  }
  if (!data || data.length < 1) {
    return {
      numeric: 0,
      text: 'N/A',
      title: 'Success rate',
    };
  }

  const uptime = parseFloat(data[0].value[1]) * 100;
  return {
    title: 'Success rate',
    color: uptime < 99 ? 'red' : 'green',
    numeric: uptime,
    text: uptime.toFixed(2) + '%',
  };
};

const getSparklineValue = (data: any[], loading: boolean, showSparkline: boolean) => {
  if (!showSparkline || loading || data.length < 1) {
    return;
  }

  const points =
    data[0]?.values?.map((value: string[], index: number) => {
      return parseFloat(value[1]);
    }) ?? [];

  return {
    y: {
      name: '',
      values: new ArrayVector(points),
      type: FieldType.number,
      config: {},
    },
  };
};

export const UptimeGauge = ({ labelNames, labelValues, height, width, sparkline, onClick }: Props) => {
  const filter = labelNames
    .reduce<string[]>((filters, labelName, index) => {
      filters.push(`${labelName}="${labelValues[index]}"`);
      return filters;
    }, [])
    .join(',');

  const uptimeQuery = `sum((rate(probe_all_success_sum{${filter}}[3h]) OR rate(probe_success_sum{${filter}}[3h]))) / sum((rate(probe_all_success_count{${filter}}[3h]) OR rate(probe_success_count{${filter}}[3h])))`;
  const sparklineQuery = `100 * sum((rate(probe_all_success_sum{${filter}}[10m]) OR rate(probe_success_sum{${filter}}[10m]))) / sum((rate(probe_all_success_count{${filter}}[10m]) OR rate(probe_success_count{${filter}}[10m])))`;

  const lastUpdate = Math.floor(Date.now() / 1000);

  // options are declared in state to maintain referential equality for the options object. Otherwise data fetching can get stuck in a loop
  const [sparklineOptions] = useState({
    skip: !sparkline,
    start: lastUpdate - 60 * 60 * 3,
    end: lastUpdate,
    step: 600,
  });

  const { data: uptimeData, loading: uptimeLoading } = useMetricData(uptimeQuery);
  const { data: sparklineData, loading: sparklineLoading } = useMetricData(sparklineQuery, sparklineOptions);
  const value = getDisplayValue(uptimeData, uptimeLoading);
  const sparklineValue = getSparklineValue(sparklineData, sparklineLoading, sparkline);
  return (
    <Container>
      <BigValue
        theme={config.theme}
        colorMode={BigValueColorMode.Value}
        height={height}
        width={width}
        graphMode={BigValueGraphMode.Area}
        value={value}
        sparkline={sparklineValue}
        onClick={onClick}
      />
    </Container>
  );
};
