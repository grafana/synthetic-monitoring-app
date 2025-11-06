import React from 'react';
import { Stack, Text } from '@grafana/ui';

export function AboutSMChecks() {
  return (
    <Stack direction="column" gap={2}>
      <Text element="p">
        Synthetic Monitoring checks are tests that run on selected public or private probes at frequent intervals to
        continuously verify your systems.
      </Text>
      <Text element="p">
        Checks save results as Prometheus metrics and Loki logs, enabling the configuration of Grafana alerts for custom
        notifications and incident management.
      </Text>
    </Stack>
  );
}
