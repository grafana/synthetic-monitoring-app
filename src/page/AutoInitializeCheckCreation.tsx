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

/**
 * Rendered for check-creation deep-links (e.g. checks/new/api-endpoint) while the
 * plugin is uninitialized. When the auto-enable feature flag is on, it triggers
 * initialization automatically and reloads the user back onto their intended page.
 * When the flag is off, it preserves the previous behavior of redirecting Home.
 */
export const AutoInitializeCheckCreation = () => {
  const { isEnabled } = useFeatureFlag(FeatureName.AutoEnableOnUrl);

  if (!isEnabled) {
    return <Navigate to={getRoute(AppRoutes.Home)} replace />;
  }

  return (
    <PluginPage layout={PageLayoutType.Canvas}>
      <Stack justifyContent="center" alignItems="center">
        <AppInitializer autoStart buttonText="Get started" />
      </Stack>
    </PluginPage>
  );
};
