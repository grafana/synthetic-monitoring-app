import React from 'react';
import { Stack, Text, TextLink } from '@grafana/ui';

import { Ul } from 'components/Ul';

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
      <Ul>
        <li>
          <TextLink
            external
            href="https://grafana.com/docs/grafana-cloud/testing/synthetic-monitoring/create-checks/checks/"
          >
            Check types and what they do
          </TextLink>
        </li>
        <li>
          <TextLink
            external
            href="https://grafana.com/docs/grafana-cloud/testing/synthetic-monitoring/create-checks/public-probes/"
          >
            Public probes
          </TextLink>
        </li>
        <li>
          <TextLink
            external
            href="https://grafana.com/docs/grafana-cloud/testing/synthetic-monitoring/create-checks/manage-secrets/"
          >
            Create and manage secrets
          </TextLink>
        </li>
      </Ul>
    </Stack>
  );
}
