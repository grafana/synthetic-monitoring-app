import React from 'react';
import { Alert, Stack, Text } from '@grafana/ui';

import { Ul } from 'components/Ul';

export const ReasonsForMissingResult = ({ isPublic }: { isPublic: boolean }) => {
  return (
    <Alert title="Reasons for missing probe results:" severity="info">
      <Stack direction="column" gap={2}>
        <Ul>
          <li>The probe may have been offline</li>
          {!isPublic && <li>The probe&apos;s credentials may have expired</li>}
          <li>The probe may have been restarted or the check was updated when this execution was scheduled</li>
          <li>
            If the probe was scheduled to run right at the end of this timepoint, it may have began its execution in the
            timepoint after this one and reported its results there instead.
          </li>
        </Ul>
        <Text>
          Occasional missing probe results are normal due to the nature of the internet and the probe agent&apos;s
          scheduling system but if probe results are consistently missing, it may indicate a larger problem that needs
          investigating.
        </Text>
      </Stack>
    </Alert>
  );
};
