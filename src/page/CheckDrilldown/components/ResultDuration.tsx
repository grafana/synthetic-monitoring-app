import React from 'react';
import { Stack, Tag } from '@grafana/ui';

import { formatDuration } from 'page/CheckDrilldown/components/CheckExplorer.utils';

interface ResultDurationProps {
  state: 0 | 1 | null;
  duration: number | null;
}

export const ResultDuration = ({ state, duration }: ResultDurationProps) => {
  const result = getResult(state);

  const colorIndexMap = {
    success: 18,
    failed: 0,
    pending: 9,
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

function getResult(uptime: number | null) {
  if (uptime === null) {
    return `unknown`;
  }

  return uptime > 0 ? `success` : `failed`;
}
