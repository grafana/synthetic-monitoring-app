import React from 'react';
import { Box, Stack, Text } from '@grafana/ui';

import { CheckType } from 'types';
import { AboutSMChecks } from 'components/Checkster/feature/docs/AboutSMChecks';

export const API_ENDPOINT_DOCS_CHECK_COMPATABILITY: CheckType[] = [
  CheckType.DNS,
  CheckType.HTTP,
  CheckType.GRPC,
  CheckType.TCP,
  CheckType.Traceroute,
];

export function APIEndpointDocsPanel() {
  return (
    <Box padding={2}>
      <Stack direction="column" gap={2}>
        <Text variant="h3">Docs</Text>
        <AboutSMChecks />
      </Stack>
    </Box>
  );
}
