import React from 'react';
import { Stack, Tag, Text } from '@grafana/ui';

import { Check } from 'types';

export const InfoLabels = ({ check }: { check: Check }) => {
  const { labels } = check;

  if (labels.length === 0) {
    return (
      <Stack direction={`column`} gap={0.5}>
        <Text>No Labels</Text>
        <Text variant={`bodySmall`} italic>
          Consider adding labels to your checks to make organisation easier.
        </Text>
      </Stack>
    );
  }

  return (
    <Stack direction={`row`} wrap="wrap">
      {labels.map((label) => (
        <Tag key={label.name} name={`${label.name}: ${label.value}`} />
      ))}
    </Stack>
  );
};
