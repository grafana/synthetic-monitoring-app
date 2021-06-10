import React, { useState, useContext } from 'react';
import { BigValueColorMode, BigValueGraphMode, BigValue, Container } from '@grafana/ui';
import { DisplayValue, ArrayVector, FieldType } from '@grafana/data';
import { config } from '@grafana/runtime';
import { useMetricData } from 'hooks/useMetricData';
import { SuccessRateContext, SuccessRateTypes, SuccessRateValue } from 'contexts/SuccessRateContext';

interface Props {
  type: SuccessRateTypes;
  id: number;
  labelNames: string[];
  labelValues: string[];
  height: number;
  width: number;
  sparkline: boolean;
  onClick?: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
}

const getDisplayValue = (successRate: SuccessRateValue, loading: boolean): DisplayValue => {
  if (loading) {
    return {
      numeric: 0,
      title: 'Success rate',
      text: 'loading...',
    };
  }

  return {
    title: 'Success rate',
    color: successRate.thresholdColor,
    numeric: successRate.value,
    text: successRate.noData ? 'N/A' : successRate.value + '%',
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

export const SuccessRateGauge = ({ type, id, labelNames, labelValues, height, width, sparkline, onClick }: Props) => {
  const { values, loading } = useContext(SuccessRateContext);

  const filter = labelNames
    .reduce<string[]>((filters, labelName, index) => {
      filters.push(`${labelName}="${labelValues[index]}"`);
      return filters;
    }, [])
    .join(',');

  const sparklineQuery = `100 * sum((rate(probe_all_success_sum{${filter}}[10m]) OR rate(probe_success_sum{${filter}}[10m]))) / sum((rate(probe_all_success_count{${filter}}[10m]) OR rate(probe_success_count{${filter}}[10m])))`;

  const lastUpdate = Math.floor(Date.now() / 1000);

  // options are declared in state to maintain referential equality for the options object. Otherwise data fetching can get stuck in a loop
  const [sparklineOptions] = useState({
    skip: !sparkline,
    start: lastUpdate - 60 * 60 * 3,
    end: lastUpdate,
    step: 600,
  });

  const { data: sparklineData, loading: sparklineLoading } = useMetricData(sparklineQuery, sparklineOptions);
  const value = getDisplayValue(values[type]?.[id] ?? values.defaults, loading);
  const sparklineValue = getSparklineValue(sparklineData, sparklineLoading, sparkline);
  return (
    <Container>
      <BigValue
        theme={config.theme2}
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
