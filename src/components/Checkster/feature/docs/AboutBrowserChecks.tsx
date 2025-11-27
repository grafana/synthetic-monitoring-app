import React from 'react';
import { Stack, Text } from '@grafana/ui';

export const BROWSER_CHECKS_DOCS_TEXT = `k6 browser checks run a k6 script using the browser module to control a headless browser. Write native JavaScript to control the browser and perform actions like clicking buttons, filling out forms, and more.`;

export const AboutBrowserChecks = () => {
  return (
    <Stack direction="column" gap={2}>
      <Text variant="h4" element="h3">
        How k6 browser checks work
      </Text>
      <Text element="p">{BROWSER_CHECKS_DOCS_TEXT}</Text>
    </Stack>
  );
};
