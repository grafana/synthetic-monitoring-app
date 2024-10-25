import React, { useState } from 'react';
import { Alert, LinkButton } from '@grafana/ui';

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
      Probes are automated tools that test websites and apps. They act like users by sending requests and checking the
      responses.
      <div>
        <LinkButton size="sm" href={`${getRoute(ROUTES.NewProbe)}`}>
          Set up a Private Probe
        </LinkButton>
      </div>
    </Alert>
  );
};
