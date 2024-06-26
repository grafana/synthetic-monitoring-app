import React from 'react';
import { OrgRole } from '@grafana/data';
import { Stack, TextLink } from '@grafana/ui';

import { ROUTES } from 'types';
import { hasRole } from 'utils';
import { Card } from 'components/Card';
import { PluginPage } from 'components/PluginPage';

import { AppInitializer } from './AppInitializer';

export const ChecksWelcomePage = () => {
  return (
    <PluginPage>
      <p>Monitor your endpoints</p>
      <Card>
        <Stack justifyContent={'center'} alignItems={'center'} direction={'column'}>
          <h2>Get started monitoring your services</h2>
          <p>
            Click the {'Create a Check'} button to create checks or visit the Synthetic Monitoring{' '}
            <TextLink href="https://grafana.com/docs/grafana-cloud/testing/synthetic-monitoring/" external={true}>
              documentation
            </TextLink>{' '}
            for more information
          </p>

          <AppInitializer
            redirectTo={ROUTES.ChooseCheckType}
            disabled={!hasRole(OrgRole.Editor)}
            buttonText="Create a Check"
          />
        </Stack>
      </Card>
    </PluginPage>
  );
};
