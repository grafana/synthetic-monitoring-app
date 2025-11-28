import React from 'react';
import { Stack, Text } from '@grafana/ui';

export const SM_CHECKS_DOCS_TEXT = `Synthetic Monitoring checks are tests that run on selected public or private probes at frequent intervals to continuously verify your systems.`;

export function AboutSMChecks() {
  return (
    <Stack direction="column" gap={2}>
      <Text variant="h4" element="h3">
        How Synthetic Monitoring checks work
      </Text>
      <Text element="p">{SM_CHECKS_DOCS_TEXT}</Text>
      <Text element="p">
        Checks save results as Prometheus metrics and Loki logs, enabling the configuration of Grafana alerts for custom
        notifications and incident management.
      </Text>
    </Stack>
  );
}
