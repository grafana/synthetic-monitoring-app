import React from 'react';
import { PageLayoutType } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import { Stack } from '@grafana/ui';

import { AppInitializer } from 'components/AppInitializer';

// Auto-initializes the plugin when an uninitialized user deep-links into a resource-creation route.
export const AutoInitializeResourceCreation = () => {
  return (
    <PluginPage layout={PageLayoutType.Canvas}>
      <Stack justifyContent="center" alignItems="center">
        <AppInitializer autoInitialize buttonText="Get started" />
      </Stack>
    </PluginPage>
  );
};
