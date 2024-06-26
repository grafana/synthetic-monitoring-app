import React from 'react';
import { Stack, TextLink } from '@grafana/ui';

import { PluginPage } from 'components/PluginPage';
import { Card } from 'components/Card';
import { ROUTES } from 'types';
import { AppInitializer } from './AppInitializer';
import { hasRole } from 'utils';
import { OrgRole } from '@grafana/data';

export const AlertingWelcomePage = () => {
  return (
    <PluginPage>
      <Card>
        <Stack justifyContent={'center'} alignItems={'center'} direction={'column'}>
          <h2>Get started monitoring your services</h2>
          <p>
            Click the "See Alerting" button to initialize the plugin and see a list of default alerts or visit the
            Synthetic Monitoring{' '}
            <TextLink href="https://grafana.com/docs/grafana-cloud/testing/synthetic-monitoring/" external={true}>
              documentation
            </TextLink>{' '}
            for more information
          </p>

          <AppInitializer redirectTo={ROUTES.Alerts} disabled={!hasRole(OrgRole.Editor)} buttonText="See Alerting" />
        </Stack>
      </Card>
    </PluginPage>
  );
};
