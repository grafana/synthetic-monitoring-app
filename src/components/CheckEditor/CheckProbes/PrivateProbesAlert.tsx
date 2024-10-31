import React, { useState } from 'react';
import { Alert, LinkButton, Stack } from '@grafana/ui';

import { ROUTES } from 'types';
import { getRoute } from 'components/Routing.utils';

export const PrivateProbesAlert = () => {
  const [display, setDisplay] = useState(true);

  if (!display) {
    return null;
  }

  return (
    <Alert
      title="You haven't set up any private probes yet."
      severity="info"
      onRemove={() => {
        setDisplay(false);
      }}
    >
      <Stack gap={1} direction={'column'} alignItems={'flex-start'}>
        Private probes are instances of the open source Grafana Synthetic Monitoring Agent and are only accessible to
        you.
        <LinkButton size="sm" href={`${getRoute(ROUTES.NewProbe)}`}>
          Set up a Private Probe
        </LinkButton>
      </Stack>
    </Alert>
  );
};
