import React from 'react';
import { Navigate, Route, Routes } from 'react-router';

import { AppRoutes, AUTO_INITIALIZE_ROUTES } from 'routing/types';
import { getRoute } from 'routing/utils';
import { useMeta } from 'hooks/useMeta';
import { AutoInitializeResourceCreation } from 'page/AutoInitializeResourceCreation';
import { ConfigPageLayout } from 'page/ConfigPageLayout';
import { UninitializedTab } from 'page/ConfigPageLayout/tabs/UninitializedTab';
import { UnprovisionedSetup } from 'page/UnprovisionedSetup';
import { WelcomePage } from 'page/WelcomePage';

export const UninitialisedRouter = () => {
  const meta = useMeta();
  const provisioned = Boolean(meta.jsonData?.metrics?.grafanaName);

  // todo: is this the correct check for provisioning?
  // todo: is this state even possible in Grafana v11?
  if (!provisioned) {
    return <UnprovisionedSetup />;
  }

  return (
    <Routes>
      <Route path={AppRoutes.Home} element={<WelcomePage />} />
      <Route path={AppRoutes.Scene} element={<WelcomePage />} />
      {AUTO_INITIALIZE_ROUTES.map((route) => (
        <Route key={route} path={`${route}/*`} element={<AutoInitializeResourceCreation />} />
      ))}
      <Route path={AppRoutes.Config} element={<ConfigPageLayout />}>
        <Route index element={<UninitializedTab />} />
        <Route path="*" element={<Navigate to={getRoute(AppRoutes.Home)} replace />} />
      </Route>

      {/* TODO: Create 404 instead of navigating to home(?) */}
      <Route path="*" element={<Navigate to={getRoute(AppRoutes.Home)} replace />} />
    </Routes>
  );
};
