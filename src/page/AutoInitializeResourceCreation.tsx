import React from 'react';
import { Navigate } from 'react-router';
import { PageLayoutType } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import { Stack } from '@grafana/ui';

import { FeatureName } from 'types';
import { AppRoutes } from 'routing/types';
import { getRoute } from 'routing/utils';
import { useFeatureFlag } from 'hooks/useFeatureFlag';
import { AppInitializer } from 'components/AppInitializer';

export const AutoInitializeResourceCreation = () => {
  const { isEnabled: isFeatureEnabled } = useFeatureFlag(FeatureName.AutoInitializeOnUrl);

  if (!isFeatureEnabled) {
    return <Navigate to={getRoute(AppRoutes.Home)} replace />;
  }

  return (
    <PluginPage layout={PageLayoutType.Canvas}>
      <Stack justifyContent="center" alignItems="center">
        <AppInitializer autoInitialize buttonText="Get started" />
      </Stack>
    </PluginPage>
  );
};
