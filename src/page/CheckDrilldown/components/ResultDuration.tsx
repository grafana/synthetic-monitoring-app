import React from 'react';
import { Stack, Tag } from '@grafana/ui';

import { formatDuration } from 'page/CheckDrilldown/components/CheckExplorer.utils';

interface ResultDurationProps {
  state: 0 | 1 | null;
  duration: number | null;
  type: `up_down` | `success_fail`;
}

export const ResultDuration = ({ state, duration, type = `up_down` }: ResultDurationProps) => {
  const result = getResult(state, type);

  const colorIndexMap = {
    up: 18,
    down: 0,
    success: 18,
    failed: 0,
    unknown: 9,
  };

  const colorIndex = colorIndexMap[result];

  return (
    <Stack gap={0}>
      <Tag name={result} colorIndex={colorIndex} />
      <Tag name={formatDuration(duration)} colorIndex={9} />
    </Stack>
  );
};

function getResult(uptime: number | null, type: `up_down` | `success_fail`) {
  if (uptime === null) {
    return `unknown`;
  }

  if (type === `up_down`) {
    return uptime > 0 ? `up` : `down`;
  }

  return uptime > 0 ? `success` : `failed`;
}
