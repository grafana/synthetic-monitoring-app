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
        Probes are automated tools that test websites and apps. They act like users by sending requests and checking the
        responses.
        <LinkButton size="sm" href={`${getRoute(ROUTES.NewProbe)}`}>
          Set up a Private Probe
        </LinkButton>
      </Stack>
    </Alert>
  );
};
