import React from 'react';
import { DisplayValue } from '@grafana/data';
import { config } from '@grafana/runtime';
import { BigValue, BigValueColorMode, BigValueGraphMode, Container } from '@grafana/ui';

import { getLatencySuccessRateThresholdColor, getSuccessRateThresholdColor } from 'utils';
import { useThreshold } from 'data/useThresholds';
import { BigValueTitle } from 'components/BigValueTitle';
import { LATENCY_DESCRIPTION, REACHABILITY_DESCRIPTION, UPTIME_DESCRIPTION } from 'components/constants';

interface Props {
  height: number;
  width: number;
  onClick?: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
  type: 'reachability' | 'uptime' | 'latency';
  value: number | null;
  unit: `%` | `ms`;
}

export const Gauge = ({ height, width, onClick, type, value, unit }: Props) => {
  const { data: threshold } = useThreshold(type);
  const parsedValue = parseValue(value, unit);
  const comparer = comparisonMap[type];
  const color = threshold && parsedValue !== null ? comparer(threshold, parsedValue) : undefined;
  const infoText = infoMap[type];
  const title = titleMap[type];
  const text = formatValue(parsedValue, unit);

  const displayValue: DisplayValue = {
    // @ts-expect-error The BigValue component only allows strings for a title, but we're looking to pass in a component.
    // There's nothing technically stopping us from this, but it is a hack
    title: <BigValueTitle title={title} infoText={infoText} />,
    color,
    text,
  };

  return (
    <Container>
      <BigValue
        theme={config.theme2}
        colorMode={BigValueColorMode.Value}
        height={height}
        width={width}
        graphMode={BigValueGraphMode.Area}
        value={displayValue}
        onClick={onClick}
      />
    </Container>
  );
};

const infoMap = {
  latency: LATENCY_DESCRIPTION,
  reachability: REACHABILITY_DESCRIPTION,
  uptime: UPTIME_DESCRIPTION,
};

const titleMap = {
  latency: 'Latency',
  reachability: 'Reachability',
  uptime: 'Uptime',
};

const comparisonMap = {
  latency: getLatencySuccessRateThresholdColor,
  reachability: getSuccessRateThresholdColor,
  uptime: getSuccessRateThresholdColor,
};

function parseValue(value: number | null, unit: `%` | `ms`) {
  if (!value) {
    return value;
  }

  if (unit === `%`) {
    return value * 100;
  }

  if (unit === `ms`) {
    return value * 1000;
  }

  return value;
}

function formatValue(value: number | null, unit: `%` | `ms`) {
  if (!value) {
    return `N/A`;
  }

  if (unit === `%`) {
    return `${value.toFixed(1)}${unit}`;
  }

  return `${value.toFixed(0)}${unit}`;
}
