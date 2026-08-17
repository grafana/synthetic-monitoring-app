import React from 'react';
import { PageLayoutType } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import { Stack } from '@grafana/ui';

import { AppInitializer } from 'components/AppInitializer';

export const AutoInitializeResourceCreation = () => {
  return (
    <PluginPage layout={PageLayoutType.Canvas}>
      <Stack justifyContent="center" alignItems="center">
        <AppInitializer autoInitialize buttonText="Get started" />
      </Stack>
    </PluginPage>
  );
};
