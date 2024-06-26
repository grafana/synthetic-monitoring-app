import React from 'react';
import { OrgRole } from '@grafana/data';
import { Stack, TextLink } from '@grafana/ui';

import { ROUTES } from 'types';
import { hasRole } from 'utils';
import { Card } from 'components/Card';
import { PluginPage } from 'components/PluginPage';

import { AppInitializer } from './AppInitializer';

export const ProbesWelcomePage = () => {
  return (
    <PluginPage>
      <Card>
        <Stack justifyContent={'center'} alignItems={'center'} direction={'column'}>
          <h2>Get started monitoring your services</h2>
          <p>
            Click the {"See Probes"} button to initialize the plugin and see a list of public probes or visit the
            Synthetic Monitoring{' '}
            <TextLink href="https://grafana.com/docs/grafana-cloud/testing/synthetic-monitoring/" external={true}>
              documentation
            </TextLink>{' '}
            for more information
          </p>

          <AppInitializer redirectTo={ROUTES.Probes} disabled={!hasRole(OrgRole.Editor)} buttonText="See Probes" />
        </Stack>
      </Card>
    </PluginPage>
  );
};
