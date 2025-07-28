import React, { useEffect } from 'react';
import { Alert, Stack, Text, TextLink, useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { FaroEvent, reportError } from 'faro';
import { useBackendAddress } from 'hooks/useBackendAddress';
import { useProbeApiServer } from 'hooks/useProbeApiServer';
import { Clipboard } from 'components/Clipboard';
import { DocsLink } from 'components/DocsLink';

export const ProbeAPIServer = () => {
  const theme = useTheme2();
  const probeAPIServer = useProbeApiServer();

  const backendAddress = useBackendAddress();

  return (
    <Stack direction="column" gap={2}>
      <Text element="h3">Probe API Server URL</Text>
      <Text>
        The Synthetic Monitoring Agent will need to connect to the instance of the Synthetics API that corresponds with
        the region of your stack. This is the value you will need to set in the <code>API_SERVER</code> environment
        variable when setting up a private probe.
      </Text>
      {probeAPIServer ? (
        <Clipboard content={probeAPIServer} inlineCopy />
      ) : (
        <NoProbeAPIServer backendAddress={backendAddress} />
      )}
      <Stack direction="column" gap={0.5}>
        <Text variant="bodySmall" italic>
          Your backend address is:
        </Text>
        <Text color="warning" variant="bodySmall" italic>
          {backendAddress}
        </Text>
      </Stack>
      <DocsLink article="addPrivateProbe" className={css({ marginBottom: theme.spacing(2) })}>
        Learn how to run a private probe
      </DocsLink>
    </Stack>
  );
};

const NoProbeAPIServer = ({ backendAddress }: { backendAddress: string }) => {
  useEffect(() => {
    reportError(FaroEvent.NO_PROBE_MAPPING_FOUND);
  }, []);

  return (
    <Alert severity="error" title="No probe API server found">
      You can find the correct value by cross-referencing your backend address ({`${backendAddress}`}) with the{' '}
      <TextLink
        external
        href={`https://grafana.com/docs/grafana-cloud/testing/synthetic-monitoring/set-up/set-up-private-probes/#probe-api-server-url`}
      >
        Probe API Server URL table
      </TextLink>
      . If you still need help, please contact support.
    </Alert>
  );
};
