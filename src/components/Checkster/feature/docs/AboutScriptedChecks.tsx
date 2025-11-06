import React from 'react';
import { Stack, Text } from '@grafana/ui';

export function AboutScriptedChecks() {
  return (
    <Stack direction="column" gap={2}>
      <Text element="p">
        k6 scripted checks utilise Grafana k6, enabling you to write JavaScript to monitor transactions and user flows
        by implementing workflows, custom logic, and validations.
      </Text>
    </Stack>
  );
}
