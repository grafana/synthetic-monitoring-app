import React from 'react';
import { Stack, Text } from '@grafana/ui';

export function AboutBrowserChecks() {
  return (
    <Stack direction="column" gap={2}>
      <Text element="p">
        k6 browser checks run a k6 script using the browser module to control a headless browser. Write native
        JavaScript to control the browser and perform actions like clicking buttons, filling out forms, and more.
      </Text>
    </Stack>
  );
}
