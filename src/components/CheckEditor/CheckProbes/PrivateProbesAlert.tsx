import React from 'react';
import { Alert, LinkButton, Stack, TextLink } from '@grafana/ui';
import { useLocalStorage } from 'usehooks-ts';

import { ROUTES } from 'types';
import { getRoute } from 'routing/utils';

export const PrivateProbesAlert = () => {
  const [dismissed, setDismissed] = useLocalStorage<boolean>('dismissedPrivateProbesAlert', false);

  if (dismissed) {
    return null;
  }

  return (
    <Alert
      title="You haven't set up any private probes yet."
      severity="info"
      onRemove={() => {
        setDismissed(true);
      }}
    >
      <Stack gap={1} direction="column" alignItems="flex-start">
        <p>
          Private probes are instances of the open source Grafana{' '}
          <TextLink
            href="https://grafana.com/docs/grafana-cloud/testing/synthetic-monitoring/set-up/set-up-private-probes/"
            external={true}
          >
            Synthetic Monitoring Agent
          </TextLink>{' '}
          and are only accessible to you.
        </p>
        <LinkButton size="sm" href={`${getRoute(ROUTES.NewProbe)}`}>
          Set up a Private Probe
        </LinkButton>
      </Stack>
    </Alert>
  );
};
